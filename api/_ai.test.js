import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scanLabel } from './_ai.js'

const answer = JSON.stringify({
  name: 'Paracetamol',
  strength: '500 mg',
  expiry_date: null,
  purpose: 'For pain',
  how_to_take: 'Follow the label.',
  warnings: [],
  confidence: 'high',
})

// A fake fetch reply that arrives after `ms` and respects the abort signal
function reply(ms, status, text = answer) {
  return (url, { signal }) =>
    new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        resolve({
          ok: status === 200,
          status,
          json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
        })
      }, ms)
      signal.addEventListener('abort', () => {
        clearTimeout(id)
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
      })
    })
}

const input = { imageBase64: 'abc', mimeType: 'image/jpeg', language: 'English', apiKey: 'key' }

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function run(...replies) {
  const fetch = vi.fn()
  for (const r of replies) fetch.mockImplementationOnce(r)
  vi.stubGlobal('fetch', fetch)
  const promise = scanLabel(input)
  await vi.runAllTimersAsync()
  return { result: await promise, fetch }
}

describe('scanLabel', () => {
  it('returns the parsed answer', async () => {
    const { result } = await run(reply(4000, 200))
    expect(result).toMatchObject({ ok: true, attempts: 1, data: { name: 'Paracetamol' } })
  })

  it('retries a fast 500', async () => {
    const { result } = await run(reply(1500, 500), reply(3000, 200))
    expect(result).toMatchObject({ ok: true, attempts: 2 })
  })

  it('stops at once on a 4xx', async () => {
    const { result, fetch } = await run(reply(500, 403))
    expect(result).toMatchObject({ ok: false, error: 'ai_unavailable', detail: 'HTTP 403' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('sends a second copy when the first stalls, and uses whichever answers', async () => {
    const { result, fetch } = await run(reply(60000, 200), reply(3000, 200))
    expect(result).toMatchObject({ ok: true, attempts: 2 })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('gives up after 9 seconds', async () => {
    const { result } = await run(reply(60000, 200), reply(60000, 200))
    expect(result).toMatchObject({ ok: false, error: 'ai_unavailable', detail: 'timeout' })
  })

  it('passes unreadable labels through as a normal answer', async () => {
    const { result } = await run(reply(3000, 200, '{"confidence": "low"}'))
    expect(result).toMatchObject({ ok: false, error: 'low_confidence' })
  })
})
