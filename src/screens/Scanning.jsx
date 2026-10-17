import { t } from '../i18n/index.js'

export default function Scanning({ lang }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 p-6" aria-live="polite">
      <div
        className="h-16 w-16 animate-spin rounded-full border-8 border-teal-100 border-t-teal-700 motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p className="text-center text-2xl font-semibold">{t(lang, 'reading')}</p>
    </main>
  )
}
