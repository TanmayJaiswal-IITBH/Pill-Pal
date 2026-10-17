import BigButton from '../components/BigButton.jsx'
import { t } from '../i18n/index.js'
import { useSpeakOnShow } from '../lib/useSpeakOnShow.js'

export default function WrongMedicine({ lang, onBack }) {
  useSpeakOnShow(`${t(lang, 'wrongMedicine')} ${t(lang, 'wrongMedicineHelp')}`, lang)
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6">
      <h1 className="text-3xl font-bold text-red-800">{t(lang, 'wrongMedicine')}</h1>
      <p className="text-2xl">{t(lang, 'wrongMedicineHelp')}</p>
      <BigButton href="tel:112" variant="danger">
        <span aria-hidden="true">📞 </span>
        {t(lang, 'callEmergency')}
      </BigButton>
      <button type="button" onClick={onBack} className="mx-auto min-h-14 px-4 text-teal-800 underline">
        {t(lang, 'back')}
      </button>
    </main>
  )
}
