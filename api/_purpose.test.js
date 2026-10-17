import { describe, it, expect, vi, afterEach } from 'vitest'
import { checkPurpose, lookUpPurpose, TRUSTED_SITES } from './_purpose.js'

const input = { name: 'Pioglitazone', language: 'English', tavilyKey: 'tvly-test', aiKey: 'ai-test' }

function tavily(results, ok = true) {
  return { ok, status: ok ? 200 : 401, json: async () => ({ results }) }
}
function gemini(text) {
  return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) }
}
const source = { url: 'https://medlineplus.gov/druginfo/meds/a699016.html', content: 'Pioglitazone is used to treat type 2 diabetes.' }

afterEach(() => vi.unstubAllGlobals())

describe('checkPurpose', () => {
  it('keeps a plain sentence', () => {
    expect(checkPurpose('It helps control blood sugar in type 2 diabetes.')).toBe(
      'It helps control blood sugar in type 2 diabetes.',
    )
  })

  it('drops unsure, empty, too long or dose-like answers', () => {
    expect(checkPurpose('NONE')).toBeNull()
    expect(checkPurpose('')).toBeNull()
    expect(checkPurpose(undefined)).toBeNull()
    expect(checkPurpose('x'.repeat(201))).toBeNull()
    expect(checkPurpose('Take 30 mg once a day to control blood sugar.')).toBeNull()
    expect(checkPurpose('Used for pain, 2 tablets every 6 hours.')).toBeNull()
  })
})

describe('lookUpPurpose', () => {
  it('searches only trusted sites and returns the purpose with its source', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(tavily([source])).mockResolvedValueOnce(gemini('It helps control blood sugar.'))
    vi.stubGlobal('fetch', fetch)
    expect(await lookUpPurpose(input)).toEqual({ purpose: 'It helps control blood sugar.', source: 'medlineplus.gov' })

    const [url, request] = fetch.mock.calls[0]
    expect(url).toBe('https://api.tavily.com/search')
    const body = JSON.parse(request.body)
    expect(body.include_domains).toEqual(TRUSTED_SITES)
    expect(body.query).toContain('Pioglitazone')
    // The photo is never sent to the search service
    expect(request.body).not.toContain('base64')
  })

  it('returns null when search finds nothing, fails or the AI is unsure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(tavily([])))
    expect(await lookUpPurpose(input)).toBeNull()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(tavily([], false)))
    expect(await lookUpPurpose(input)).toBeNull()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(tavily([source])).mockResolvedValueOnce(gemini('NONE')))
    expect(await lookUpPurpose(input)).toBeNull()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('network')))
    expect(await lookUpPurpose(input)).toBeNull()
  })

  it('gives up after the timeout', async () => {
    vi.useFakeTimers()
    const hang = (url, { signal }) =>
      new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))
    vi.stubGlobal('fetch', vi.fn(hang))
    const promise = lookUpPurpose(input)
    await vi.advanceTimersByTimeAsync(4000)
    expect(await promise).toBeNull()
    vi.useRealTimers()
  })
})
