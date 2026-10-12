import { useEffect, useState } from 'react'
import LanguagePicker from './screens/LanguagePicker.jsx'
import Home from './screens/Home.jsx'
import { DEFAULT_LANGUAGE, getLanguage } from './lib/languages.js'

const LANG_KEY = 'pillpal.lang'

function loadLanguage() {
  try {
    return localStorage.getItem(LANG_KEY)
  } catch {
    return null
  }
}

export default function App() {
  const [lang, setLang] = useState(() => loadLanguage())

  useEffect(() => {
    const { code, dir } = getLanguage(lang ?? DEFAULT_LANGUAGE)
    document.documentElement.lang = code
    document.documentElement.dir = dir
  }, [lang])

  function pickLanguage(code) {
    try {
      localStorage.setItem(LANG_KEY, code)
    } catch {
      // Private mode: the choice just won't be remembered
    }
    setLang(code)
  }

  if (!lang) return <LanguagePicker current={DEFAULT_LANGUAGE} onPick={pickLanguage} />
  return <Home lang={lang} onScan={() => {}} />
}
