// Thin wrapper around the browser's Web Speech API.

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickVoice(speechLang) {
  const voices = window.speechSynthesis.getVoices()
  const base = speechLang.split('-')[0]
  return (
    voices.find((v) => v.lang === speechLang) ??
    voices.find((v) => v.lang.startsWith(base)) ??
    null
  )
}

export function speak(text, speechLang, { rate = 1 } = {}) {
  if (!isSpeechSupported() || !text) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = speechLang
  utterance.rate = rate
  const voice = pickVoice(speechLang)
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}
