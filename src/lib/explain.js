// Builds what the result screen shows and says. Pure functions so they can be tested.

import { t } from '../i18n/index.js'
import { getExpiryStatus } from './expiry.js'

const BADGE_KEYS = { ok: 'expiryOk', soon: 'expirySoon', expired: 'expiryExpired', unknown: 'expiryUnknown' }
const SPOKEN_KEYS = { ok: 'sayExpiryOk', soon: 'sayExpirySoon', expired: 'sayExpiryExpired', unknown: 'sayExpiryUnknown' }

// "2027-06" -> "June 2027" in the user's language
export function formatExpiry(expiryDate, lang) {
  const [year, month] = expiryDate.split('-').map(Number)
  return new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

// Expiry always comes from src/lib/expiry.js, never from the AI's own opinion
export function describeExpiry(expiryDate, lang, today = new Date()) {
  const { status } = getExpiryStatus(expiryDate, today)
  const date = status === 'unknown' ? '' : formatExpiry(expiryDate, lang)
  return {
    status,
    label: t(lang, BADGE_KEYS[status], { date }),
    spoken: t(lang, SPOKEN_KEYS[status], { date }),
  }
}

function sentence(text) {
  const trimmed = text.trim()
  return /[.!?।]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

// Order: name, strength, purpose, how to take it, warnings, expiry, disclaimer
export function buildSpeech(data, lang, today = new Date()) {
  const parts = [sentence(data.name)]
  if (data.strength) parts.push(sentence(`${t(lang, 'strength')}: ${data.strength}`))
  if (data.purpose) parts.push(sentence(`${t(lang, 'purpose')}: ${data.purpose}`))
  parts.push(sentence(`${t(lang, 'howToTake')}: ${data.how_to_take}`))
  if (data.warnings.length) {
    parts.push(`${t(lang, 'warnings')}:`, ...data.warnings.map(sentence))
  }
  parts.push(describeExpiry(data.expiry_date, lang, today).spoken)
  parts.push(t(lang, 'disclaimer'))
  return parts.join(' ')
}
