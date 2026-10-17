import { t } from '../i18n/index.js'

export default function Disclaimer({ lang }) {
  return <p className="rounded-2xl bg-slate-100 p-4 text-slate-800">{t(lang, 'disclaimer')}</p>
}
