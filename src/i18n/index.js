import en from './en.js'

// Other languages are added here as they are translated; missing keys fall back to English.
const STRINGS = { en }

export function t(lang, key) {
  return STRINGS[lang]?.[key] ?? en[key] ?? key
}
