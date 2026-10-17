import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./_ai.js', () => ({ scanLabel: vi.fn() }))
const { scanLabel } = await import('./_ai.js')
const { default: handler, MAX_IMAGE_BYTES } = await import('./scan.js')

function call(method, body) {
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
  return handler({ method, body }, res).then(() => res)
}

const image = 'data:image/jpeg;base64,' + Buffer.from('fake photo').toString('base64')

beforeEach(() => {
  process.env.AI_API_KEY = 'test-key'
  scanLabel.mockReset()
})

describe('POST /api/scan', () => {
  it('rejects other methods', async () => {
    const res = await call('GET')
    expect(res.statusCode).toBe(405)
    expect(res.body).toEqual({ ok: false, error: 'method_not_allowed', ai_key_configured: true })
  })

  it('rejects a missing or malformed image', async () => {
    expect((await call('POST', {})).body.error).toBe('missing_image')
    expect((await call('POST', { image: 'hello' })).body.error).toBe('bad_image')
    expect((await call('POST', { image: 'data:text/plain;base64,aGk=' })).body.error).toBe('bad_image')
    expect(scanLabel).not.toHaveBeenCalled()
  })

  it('rejects an image over 4 MB', async () => {
    const big = 'data:image/jpeg;base64,' + 'A'.repeat(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4)
    const res = await call('POST', { image: big })
    expect(res.statusCode).toBe(413)
    expect(res.body).toEqual({ ok: false, error: 'image_too_large' })
  })

  it('passes the image and language name to the AI', async () => {
    scanLabel.mockResolvedValue({ ok: true, data: { name: 'Paracetamol' }, attempts: 1 })
    const res = await call('POST', { image, language: 'hi' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true, data: { name: 'Paracetamol' } })
    expect(scanLabel).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: 'image/jpeg', language: 'Hindi', apiKey: 'test-key' }),
    )
  })

  it('falls back to English for an unknown language', async () => {
    scanLabel.mockResolvedValue({ ok: false, error: 'low_confidence', attempts: 1 })
    const res = await call('POST', { image, language: 'xx' })
    expect(res.body).toEqual({ ok: false, error: 'low_confidence' })
    expect(scanLabel.mock.calls[0][0].language).toBe('English')
  })

  it('reports an AI outage as ai_unavailable', async () => {
    scanLabel.mockResolvedValue({ ok: false, error: 'ai_unavailable', attempts: 2 })
    const res = await call('POST', { image })
    expect(res.statusCode).toBe(502)
    expect(res.body).toEqual({ ok: false, error: 'ai_unavailable' })
  })

  it('reports a missing API key as ai_unavailable', async () => {
    delete process.env.AI_API_KEY
    const res = await call('POST', { image })
    expect(res.body).toEqual({ ok: false, error: 'ai_unavailable' })
    expect(scanLabel).not.toHaveBeenCalled()
  })
})
