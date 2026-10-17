// Fills in "what it is for" from trusted health websites (via Tavily search) instead of the
// model's memory. Only the purpose comes from the web: how to take it and warnings always
// come from the label itself. Only the medicine name is sent to Tavily, never the photo.

import { generate } from './_ai.js'

const TAVILY_URL = 'https://api.tavily.com/search'
// Plain-language, reputable sources only
export const TRUSTED_SITES = ['medlineplus.gov', 'nhs.uk', 'mayoclinic.org', 'drugs.com', 'nih.gov']
export const PURPOSE_TIMEOUT_MS = 4000
const MAX_PURPOSE_LENGTH = 200

// Anything that looks like an amount or a schedule means the sentence drifted into dose advice
const DOSE_PATTERN =
  /\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|g|kg|ml|l|units?|iu|tablets?|capsules?|pills?|drops?|puffs?|times|hours?|hrs?|days?)\b/i

export function buildPurposePrompt(name, language, sources) {
  const sourceText = sources.map((s, i) => `Source ${i + 1} (${s.url}):\n${s.content}`).join('\n\n')
  return `Below are extracts from trusted health websites about the medicine "${name}".
Using only these extracts, write one short sentence in ${language}, at a reading level for a 10-year-old,
saying what this medicine is used for. Do not mention doses, amounts, how often to take it, or side effects.
If the extracts do not clearly say what "${name}" is used for, reply with exactly: NONE

${sourceText}`
}

// Returns the sentence, or null if it is missing, unsure, too long or mentions a dose
export function checkPurpose(text) {
  const sentence = typeof text === 'string' ? text.trim().replace(/^["']|["']$/g, '') : ''
  if (!sentence || /^NONE\.?$/i.test(sentence)) return null
  if (sentence.length > MAX_PURPOSE_LENGTH || DOSE_PATTERN.test(sentence)) return null
  return sentence
}

function siteName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// Returns { purpose, source } or null. Never throws; gives up after PURPOSE_TIMEOUT_MS.
export async function lookUpPurpose({ name, language, tavilyKey, aiKey, timeoutMs = PURPOSE_TIMEOUT_MS }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${tavilyKey}` },
      body: JSON.stringify({
        query: `What is ${name} medicine used for?`,
        search_depth: 'basic',
        max_results: 3,
        include_domains: TRUSTED_SITES,
      }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const results = ((await res.json()).results ?? []).filter((r) => r.url && r.content)
    if (!results.length) return null

    const reply = await generate([{ text: buildPurposePrompt(name, language, results) }], aiKey, controller.signal)
    const purpose = checkPurpose(reply.text)
    return purpose ? { purpose, source: siteName(results[0].url) } : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
