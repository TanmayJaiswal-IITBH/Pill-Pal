import { useEffect } from 'react'
import { speak, stopSpeaking } from './speech.js'
import { getLanguage } from './languages.js'

// Reads the text aloud when a screen appears and stops when the user leaves it.
export function useSpeakOnShow(text, lang) {
  useEffect(() => {
    speak(text, getLanguage(lang).speechLang)
    return stopSpeaking
  }, [text, lang])
}
