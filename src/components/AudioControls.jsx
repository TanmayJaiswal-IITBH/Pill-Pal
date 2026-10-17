import { t } from '../i18n/index.js'
import { SLOW_RATE, speak } from '../lib/speech.js'
import { getLanguage } from '../lib/languages.js'

// Replay and Slower. Automatic playback is done by useSpeakOnShow on the screen itself.
export default function AudioControls({ lang, text }) {
  const { speechLang } = getLanguage(lang)
  const button =
    'min-h-14 flex-1 rounded-2xl border-2 border-teal-700 bg-white px-4 py-3 text-xl font-semibold text-teal-800 active:bg-teal-50'
  return (
    <div className="flex gap-3">
      <button type="button" className={button} onClick={() => speak(text, speechLang)}>
        <span aria-hidden="true">🔊 </span>
        {t(lang, 'replay')}
      </button>
      <button type="button" className={button} onClick={() => speak(text, speechLang, { rate: SLOW_RATE })}>
        <span aria-hidden="true">🐢 </span>
        {t(lang, 'slower')}
      </button>
    </div>
  )
}
