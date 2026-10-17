// Calls Google AI Studio with the label photo and returns the checked result.
// Shared by api/scan.js and scripts/test-prompt.mjs so both run exactly the same code.

import { buildPrompt, parseScanResult } from './_prompt.js'

// Gemini 3.5 Flash Lite, chosen on 17 Oct 2026 from a test of 10 label photos:
// all 10 answered in under 2.5 seconds, all 8 sharp labels read correctly, and both blurry
// photos rated low confidence. Gemma 4 26B had slowed to a 13 second median, Gemini 3.8 Flash
// took about 6 seconds, and Gemini 3.1 Flash Lite guessed a strength on a blurry photo.
export const MODEL = 'gemini-3.5-flash-lite'

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
// Real phone photos can take longer than the test set, and the API sometimes stalls for 10+ seconds
export const TIMEOUT_MS = 25000
// The API sometimes fails fast with a 500; retry while there is still time
const MAX_ATTEMPTS = 4
const MIN_TIME_FOR_RETRY_MS = 4000
// Most answers take about 2 seconds, but now and then one request stalls.
// If there is no answer by then, send a second copy and use whichever answers first.
const HEDGE_AFTER_MS = 4000

// One call to the model. Returns { status, text } where text is undefined if the call failed.
export async function generate(parts, apiKey, signal) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { thinkingConfig: { thinkingLevel: 'minimal' } },
    }),
    signal,
  })
  if (!res.ok) return { status: res.status }
  const json = await res.json()
  // Skip any "thinking" parts and keep only the answer text
  const answer = json.candidates?.[0]?.content?.parts ?? []
  return { status: res.status, text: answer.filter((p) => !p.thought).map((p) => p.text ?? '').join('') }
}

function requestOnce({ imageBase64, mimeType, language, apiKey, signal }) {
  return generate(
    [{ text: buildPrompt(language) }, { inline_data: { mime_type: mimeType, data: imageBase64 } }],
    apiKey,
    signal,
  )
}

// Returns { ok: true, data } or { ok: false, error }, plus attempts, the raw reply and a failure detail for logs. Never throws.
export async function scanLabel({ imageBase64, mimeType, language, apiKey, timeoutMs = TIMEOUT_MS }) {
  const deadline = Date.now() + timeoutMs
  const controller = new AbortController()
  const { signal } = controller
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  let attempts = 0
  let lastDetail

  function wait(ms) {
    return new Promise((resolve) => {
      const id = setTimeout(resolve, ms)
      signal.addEventListener('abort', () => {
        clearTimeout(id)
        resolve()
      })
    })
  }

  // One line of requests: retries fast 500s until it gets an answer or runs out of time
  async function lane(delayMs) {
    if (delayMs) await wait(delayMs)
    while (!signal.aborted && attempts < MAX_ATTEMPTS) {
      attempts++
      const reply = await requestOnce({ imageBase64, mimeType, language, apiKey, signal })
      if (reply.text !== undefined) return reply.text
      lastDetail = `HTTP ${reply.status}`
      // A 4xx (bad key, bad request) will not fix itself: stop both lanes
      if (reply.status < 500) controller.abort()
      if (deadline - Date.now() < MIN_TIME_FOR_RETRY_MS) break
    }
    throw new Error(lastDetail)
  }

  try {
    const text = await Promise.any([lane(0), lane(HEDGE_AFTER_MS)])
    return { ...parseScanResult(text), attempts, raw: text }
  } catch {
    // Timeout, network failure, unreadable response body, or the API kept failing
    const detail = timedOut ? 'timeout' : (lastDetail ?? 'network error')
    return { ok: false, error: 'ai_unavailable', attempts, detail }
  } finally {
    clearTimeout(timer)
    // Cancel the slower copy, if any
    controller.abort()
  }
}
