import BigButton from '../components/BigButton.jsx'
import { t } from '../i18n/index.js'
import { useSpeakOnShow } from '../lib/useSpeakOnShow.js'

// Shown when the AI or the network fails. The photo was fine, so Try again resends it.
export default function ErrorScreen({ lang, onRetry, onBack }) {
  useSpeakOnShow(`${t(lang, 'errorTitle')} ${t(lang, 'errorHelp')}`, lang)
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6">
      <h1 className="text-3xl font-bold">{t(lang, 'errorTitle')}</h1>
      <p>{t(lang, 'errorHelp')}</p>
      <BigButton onClick={onRetry}>{t(lang, 'tryAgain')}</BigButton>
      <button type="button" onClick={onBack} className="mx-auto min-h-14 px-4 text-teal-800 underline">
        {t(lang, 'backToStart')}
      </button>
    </main>
  )
}
