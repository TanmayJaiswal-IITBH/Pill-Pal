// Supported languages. Names are shown in their own script.
export const LANGUAGES = [
  { code: 'en', name: 'English', speechLang: 'en-IN', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', speechLang: 'hi-IN', dir: 'ltr' },
  { code: 'es', name: 'Español', speechLang: 'es-ES', dir: 'ltr' },
  { code: 'ar', name: 'العربية', speechLang: 'ar-SA', dir: 'rtl' },
  { code: 'fr', name: 'Français', speechLang: 'fr-FR', dir: 'ltr' },
]

export const DEFAULT_LANGUAGE = 'en'

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}
