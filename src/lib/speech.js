// Thin wrapper around the browser's Web Speech API.

export const SLOW_RATE = 0.7
const VOICES_TIMEOUT_MS = 2000

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// Chrome loads voices asynchronously: getVoices() is empty until "voiceschanged" fires.
// Some browsers never fire it, so give up waiting after a short while.
let voicesReady
function loadVoices() {
  voicesReady ??= new Promise((resolve) => {
    const synth = window.speechSynthesis
    if (synth.getVoices().length) return resolve()
    const done = () => {
      synth.removeEventListener('voiceschanged', done)
      resolve()
    }
    synth.addEventListener('voiceschanged', done)
    setTimeout(done, VOICES_TIMEOUT_MS)
  })
  return voicesReady
}

function pickVoice(speechLang) {
  const voices = window.speechSynthesis.getVoices()
  const base = speechLang.split('-')[0]
  return (
    voices.find((v) => v.lang.replace('_', '-') === speechLang) ??
    voices.find((v) => v.lang.startsWith(base)) ??
    null
  )
}

// iOS only lets a page speak after a tap. Call this from a tap handler (e.g. the
// scan button) so speech that starts later, once the result arrives, is allowed.
export function unlockSpeech() {
  if (!isSpeechSupported()) return
  loadVoices()
  const silent = new SpeechSynthesisUtterance('')
  silent.volume = 0
  window.speechSynthesis.speak(silent)
}

// Bumped by stopSpeaking so a speak() still waiting for voices does not start afterwards
let generation = 0

export async function speak(text, speechLang, { rate = 1 } = {}) {
  if (!isSpeechSupported() || !text) return
  const mine = ++generation
  await loadVoices()
  if (mine !== generation) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = speechLang
  utterance.rate = rate
  const voice = pickVoice(speechLang)
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  generation++
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}
