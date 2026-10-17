// Sends the photo to /api/scan. Always resolves to { ok: true, data } or { ok: false, error }.

// The server gives the AI 25 seconds; allow for upload time on a slow connection
const CLIENT_TIMEOUT_MS = 40000

// Errors that mean "the photo was the problem": show the retake screen
const RETAKE_ERRORS = ['low_confidence', 'missing_fields', 'bad_json', 'bad_image', 'missing_image', 'image_too_large']

export function needsRetake(error) {
  return RETAKE_ERRORS.includes(error)
}

export async function scanPhoto(image, language) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS)
  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image, language }),
      signal: controller.signal,
    })
    const body = await res.json().catch(() => null)
    if (body && typeof body.ok === 'boolean') return body
    return { ok: false, error: res.status === 413 ? 'image_too_large' : 'ai_unavailable' }
  } catch {
    return { ok: false, error: 'network' }
  } finally {
    clearTimeout(timer)
  }
}
