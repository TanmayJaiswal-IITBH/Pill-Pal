import BigButton from '../components/BigButton.jsx'
import { t } from '../i18n/index.js'

// Placeholder: camera capture and upload are wired up in the MVP step.
export default function Home({ lang, onScan }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <h1 className="mb-10 text-center text-3xl font-bold">{t(lang, 'appName')}</h1>
      <BigButton onClick={onScan}>{t(lang, 'scanMedicine')}</BigButton>
    </main>
  )
}
