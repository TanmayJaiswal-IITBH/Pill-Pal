import { t } from '../i18n/index.js'

export default function Scanning({ lang }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6" aria-live="polite">
      <p className="text-2xl">{t(lang, 'reading')}</p>
    </main>
  )
}
