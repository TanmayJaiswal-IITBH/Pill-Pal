import en from './en.js'

// Other languages are added here as they are translated; missing keys fall back to English.
const STRINGS = { en }

// t('en', 'expiryOk', { date: 'June 2027' }) fills in {date}
export function t(lang, key, vars = {}) {
  const text = STRINGS[lang]?.[key] ?? en[key] ?? key
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match))
}
