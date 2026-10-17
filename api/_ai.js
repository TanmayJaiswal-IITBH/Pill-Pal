// Calls Google AI Studio with the label photo and returns the checked result.
// Shared by api/scan.js and scripts/test-prompt.mjs so both run exactly the same code.

import { buildPrompt, parseScanResult } from './_prompt.js'

// Gemma 4 26B A4B: reads images and answers in about 4 seconds with minimal thinking.
// Gemma 4 31B gave similar answers but took 25 to 85 seconds, too slow for a phone.
export const MODEL = 'gemma-4-26b-a4b-it'

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
export const TIMEOUT_MS = 9000
// The API sometimes fails fast with a 500; retry while there is still time
const MAX_ATTEMPTS = 3
const MIN_TIME_FOR_RETRY_MS = 4000

async function requestOnce({ imageBase64, mimeType, language, apiKey, signal }) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: buildPrompt(language) },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: { thinkingConfig: { thinkingLevel: 'minimal' } },
    }),
    signal,
  })
  if (!res.ok) return { status: res.status }
  const json = await res.json()
  // Skip any "thinking" parts and keep only the answer text
  const parts = json.candidates?.[0]?.content?.parts ?? []
  return { status: res.status, text: parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('') }
}

// Returns { ok: true, data } or { ok: false, error }, plus attempts, the raw reply and a failure detail for logs. Never throws.
export async function scanLabel({ imageBase64, mimeType, language, apiKey, timeoutMs = TIMEOUT_MS }) {
  const started = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let attempts = 0
  try {
    while (true) {
      attempts++
      const reply = await requestOnce({ imageBase64, mimeType, language, apiKey, signal: controller.signal })
      if (reply.text !== undefined) return { ...parseScanResult(reply.text), attempts, raw: reply.text }
      const timeLeft = timeoutMs - (Date.now() - started)
      if (reply.status < 500 || attempts >= MAX_ATTEMPTS || timeLeft < MIN_TIME_FOR_RETRY_MS) {
        return { ok: false, error: 'ai_unavailable', attempts, detail: `HTTP ${reply.status}` }
      }
    }
  } catch (err) {
    // Timeout (abort), network failure or an unreadable response body
    const detail = err.name === 'AbortError' ? 'timeout' : err.name
    return { ok: false, error: 'ai_unavailable', attempts, detail }
  } finally {
    clearTimeout(timer)
  }
}
