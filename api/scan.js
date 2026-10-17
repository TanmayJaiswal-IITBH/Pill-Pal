// POST /api/scan with JSON { image: "data:image/jpeg;base64,...", language: "en" }
// Returns { ok: true, data } or { ok: false, error }. The photo is never stored or logged.

import { scanLabel } from './_ai.js'

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

// The AI is told the language by name; codes match src/lib/languages.js
const LANGUAGE_NAMES = { en: 'English', hi: 'Hindi', es: 'Spanish', ar: 'Arabic', fr: 'French' }

const DATA_URL = /^data:(image\/(?:jpeg|png|webp|heic|heif));base64,([A-Za-z0-9+/]+=*)$/

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    // Opening /api/scan in a browser shows whether the server can see the key (never the key itself)
    res.status(405).json({ ok: false, error: 'method_not_allowed', ai_key_configured: Boolean(process.env.AI_API_KEY) })
    return
  }

  const image = req.body?.image
  if (typeof image !== 'string' || !image) {
    res.status(400).json({ ok: false, error: 'missing_image' })
    return
  }
  const match = DATA_URL.exec(image)
  if (!match) {
    res.status(400).json({ ok: false, error: 'bad_image' })
    return
  }
  const [, mimeType, imageBase64] = match
  // Every 4 base64 characters hold 3 bytes
  if ((imageBase64.length * 3) / 4 > MAX_IMAGE_BYTES) {
    res.status(413).json({ ok: false, error: 'image_too_large' })
    return
  }

  const apiKey = process.env.AI_API_KEY
  if (!apiKey) {
    console.error('AI_API_KEY is not set')
    res.status(503).json({ ok: false, error: 'ai_unavailable' })
    return
  }

  const language = LANGUAGE_NAMES[req.body.language] ?? LANGUAGE_NAMES.en
  const { attempts, raw, detail, ...result } = await scanLabel({ imageBase64, mimeType, language, apiKey })
  if (!result.ok) console.warn(`scan failed: ${result.error} ${detail ?? ''} after ${attempts} attempt(s)`)
  // Unreadable labels are a normal answer (200); only an AI outage is a server-side failure
  res.status(result.error === 'ai_unavailable' ? 502 : 200).json(result)
}
