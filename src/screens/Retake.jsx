import PhotoButton from '../components/PhotoButton.jsx'
import { t } from '../i18n/index.js'
import { useSpeakOnShow } from '../lib/useSpeakOnShow.js'

// Shown for unreadable or incomplete labels. We never show a guess.
export default function Retake({ lang, onPhoto, onBack }) {
  useSpeakOnShow(`${t(lang, 'retakeTitle')} ${t(lang, 'retakeHelp')}`, lang)
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6">
      <p className="text-5xl" aria-hidden="true">
        📷
      </p>
      <h1 className="text-3xl font-bold">{t(lang, 'retakeTitle')}</h1>
      <p>{t(lang, 'retakeHelp')}</p>
      <PhotoButton camera onPhoto={onPhoto}>
        {t(lang, 'takeAnother')}
      </PhotoButton>
      <button type="button" onClick={onBack} className="mx-auto min-h-14 px-4 text-teal-800 underline">
        {t(lang, 'backToStart')}
      </button>
    </main>
  )
}
