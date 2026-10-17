const STYLES = {
  ok: 'bg-green-100 text-green-900 border-green-700',
  soon: 'bg-amber-100 text-amber-900 border-amber-600',
  expired: 'bg-red-700 text-white border-red-800',
  unknown: 'bg-slate-100 text-slate-900 border-slate-500',
}
const ICONS = { ok: '✓', soon: '!', expired: '✕', unknown: '?' }

export default function ExpiryBadge({ status, label }) {
  return (
    <p className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-xl font-bold ${STYLES[status]}`}>
      <span aria-hidden="true" className="text-2xl">
        {ICONS[status]}
      </span>
      {label}
    </p>
  )
}
