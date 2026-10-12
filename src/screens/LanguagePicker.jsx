import { LANGUAGES } from '../lib/languages.js'
import { t } from '../i18n/index.js'

export default function LanguagePicker({ current, onPick }) {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">{t(current, 'chooseLanguage')}</h1>
      <ul className="space-y-3">
        {LANGUAGES.map((lang) => (
          <li key={lang.code}>
            <button
              type="button"
              lang={lang.code}
              dir={lang.dir}
              onClick={() => onPick(lang.code)}
              aria-pressed={lang.code === current}
              className={`w-full min-h-14 rounded-2xl border-2 px-6 py-4 text-xl ${
                lang.code === current ? 'border-teal-700 bg-teal-50 font-semibold' : 'border-slate-300'
              }`}
            >
              {lang.name}
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
