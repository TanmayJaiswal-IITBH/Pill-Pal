import AudioControls from '../components/AudioControls.jsx'
import BigButton from '../components/BigButton.jsx'
import Disclaimer from '../components/Disclaimer.jsx'
import ExpiryBadge from '../components/ExpiryBadge.jsx'
import { t } from '../i18n/index.js'
import { buildSpeech, describeExpiry } from '../lib/explain.js'
import { useSpeakOnShow } from '../lib/useSpeakOnShow.js'

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-bold text-slate-700">{title}</h2>
      {children}
    </section>
  )
}

export default function Result({ lang, data, onScanAnother, onWrongMedicine }) {
  const expiry = describeExpiry(data.expiry_date, lang)
  const speech = buildSpeech(data, lang)
  useSpeakOnShow(speech, lang)

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <header>
        <h1 className="text-3xl font-bold">{data.name}</h1>
        {data.strength && <p className="text-2xl">{data.strength}</p>}
      </header>

      <ExpiryBadge status={expiry.status} label={expiry.label} />
      <AudioControls lang={lang} text={speech} />

      {data.purpose && (
        <Section title={t(lang, 'purpose')}>
          <p>{data.purpose}</p>
        </Section>
      )}
      <Section title={t(lang, 'howToTake')}>
        <p>{data.how_to_take}</p>
      </Section>
      {data.warnings.length > 0 && (
        <Section title={t(lang, 'warnings')}>
          <ul className="list-disc space-y-1 ps-6">
            {data.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Section>
      )}

      <Disclaimer lang={lang} />
      <BigButton onClick={onScanAnother}>{t(lang, 'scanAnother')}</BigButton>
      <button type="button" onClick={onWrongMedicine} className="mx-auto min-h-14 px-4 font-semibold text-red-800 underline">
        {t(lang, 'wrongMedicine')}
      </button>
    </main>
  )
}
