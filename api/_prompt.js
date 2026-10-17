// The AI prompt and the checks on its reply live here so they are easy to tune.
// The underscore keeps Vercel from turning this file into its own endpoint.

const PROMPT = `You are a careful pharmacy assistant. Read the medicine label in this image.
Return JSON only: {"name", "strength", "expiry_date" (YYYY-MM or null),
"purpose", "how_to_take", "warnings" (max 3), "confidence" (low|medium|high)}.
Write every text field in {LANGUAGE} at a reading level for a 10-year-old.
If you cannot read the label clearly, set confidence to "low" and do not guess.
If the photo is blurry, very small or cut off, or the name or strength is hard to read, confidence is "low".
Never recommend changing a dose. Always follow the prescription label.`

const CONFIDENCE = ['low', 'medium', 'high']
const MAX_WARNINGS = 3

export function buildPrompt(language) {
  return PROMPT.replace('{LANGUAGE}', language)
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function extractJson(raw) {
  const unfenced = raw.replace(/```(?:json)?/gi, '').trim()
  try {
    return JSON.parse(unfenced)
  } catch {
    // Some replies wrap the JSON in a sentence; fall back to the outermost braces
    const start = unfenced.indexOf('{')
    const end = unfenced.lastIndexOf('}')
    if (start === -1 || end <= start) return undefined
    try {
      return JSON.parse(unfenced.slice(start, end + 1))
    } catch {
      return undefined
    }
  }
}

// Returns { ok: true, data } or { ok: false, error }. Never throws.
export function parseScanResult(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return { ok: false, error: 'bad_json' }

  const json = extractJson(raw)
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { ok: false, error: 'bad_json' }
  }

  const confidence = text(json.confidence).toLowerCase()
  if (!CONFIDENCE.includes(confidence)) return { ok: false, error: 'missing_fields' }
  if (confidence === 'low') return { ok: false, error: 'low_confidence' }

  const name = text(json.name)
  const howToTake = text(json.how_to_take)
  if (!name || !howToTake) return { ok: false, error: 'missing_fields' }

  // Expiry is only kept in the exact YYYY-MM form; src/lib/expiry.js does the date maths
  const expiry = text(json.expiry_date)
  const expiryDate = /^\d{4}-(0[1-9]|1[0-2])$/.test(expiry) ? expiry : null

  const warnings = Array.isArray(json.warnings)
    ? json.warnings.map(text).filter(Boolean).slice(0, MAX_WARNINGS)
    : []

  return {
    ok: true,
    data: {
      name,
      strength: text(json.strength),
      expiry_date: expiryDate,
      purpose: text(json.purpose),
      how_to_take: howToTake,
      warnings,
      confidence,
    },
  }
}
