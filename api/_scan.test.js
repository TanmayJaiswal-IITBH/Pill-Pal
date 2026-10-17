import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./_ai.js', () => ({ scanLabel: vi.fn() }))
vi.mock('./_purpose.js', () => ({ lookUpPurpose: vi.fn() }))
const { scanLabel } = await import('./_ai.js')
const { lookUpPurpose } = await import('./_purpose.js')
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
  delete process.env.TAVILY_API_KEY
  scanLabel.mockReset()
  lookUpPurpose.mockReset()
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
    scanLabel.mockResolvedValue({ ok: false, error: 'ai_unavailable', attempts: 2, detail: 'timeout' })
    const res = await call('POST', { image })
    expect(res.statusCode).toBe(502)
    expect(res.body).toEqual({ ok: false, error: 'ai_unavailable', detail: 'timeout' })
  })

  it('reports a missing API key as ai_unavailable', async () => {
    delete process.env.AI_API_KEY
    const res = await call('POST', { image })
    expect(res.body).toEqual({ ok: false, error: 'ai_unavailable', detail: 'no_api_key' })
    expect(scanLabel).not.toHaveBeenCalled()
  })

  it('fills in the purpose from trusted sites when Tavily is set up', async () => {
    process.env.TAVILY_API_KEY = 'tvly-test'
    scanLabel.mockResolvedValue({ ok: true, data: { name: 'Pioglitazone', purpose: 'Not stated' }, attempts: 1 })
    lookUpPurpose.mockResolvedValue({ purpose: 'It helps control blood sugar.', source: 'medlineplus.gov' })
    const res = await call('POST', { image })
    expect(res.body.data).toEqual({
      name: 'Pioglitazone',
      purpose: 'It helps control blood sugar.',
      purpose_source: 'medlineplus.gov',
    })
    expect(lookUpPurpose).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Pioglitazone', language: 'English', tavilyKey: 'tvly-test' }),
    )
  })

  it('keeps the label purpose when search is off or finds nothing', async () => {
    scanLabel.mockResolvedValue({ ok: true, data: { name: 'Pioglitazone', purpose: 'For diabetes' }, attempts: 1 })
    expect((await call('POST', { image })).body.data.purpose).toBe('For diabetes')
    expect(lookUpPurpose).not.toHaveBeenCalled()

    process.env.TAVILY_API_KEY = 'tvly-test'
    lookUpPurpose.mockResolvedValue(null)
    expect((await call('POST', { image })).body.data).toEqual({ name: 'Pioglitazone', purpose: 'For diabetes' })
  })
})
