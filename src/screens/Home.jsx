import PhotoButton from '../components/PhotoButton.jsx'
import { t } from '../i18n/index.js'

export default function Home({ lang, onPhoto, onChangeLanguage }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col p-6">
      <div className="flex flex-1 flex-col justify-center gap-5">
        <h1 className="text-center text-4xl font-bold text-teal-800">{t(lang, 'appName')}</h1>
        <p className="mb-6 text-center">{t(lang, 'tagline')}</p>
        <PhotoButton camera onPhoto={onPhoto}>
          <span aria-hidden="true">📷 </span>
          {t(lang, 'scanMedicine')}
        </PhotoButton>
        <PhotoButton variant="secondary" onPhoto={onPhoto}>
          {t(lang, 'choosePhoto')}
        </PhotoButton>
      </div>
      <button type="button" onClick={onChangeLanguage} className="mx-auto min-h-14 px-4 text-teal-800 underline">
        {t(lang, 'changeLanguage')}
      </button>
    </main>
  )
}
