import { t } from '../i18n/index.js'

// Placeholder: the full result card, audio controls and expiry badge come in the MVP step.
export default function Result({ lang }) {
  return (
    <main className="mx-auto max-w-md p-6">
      <p className="text-lg">{t(lang, 'disclaimer')}</p>
    </main>
  )
}
