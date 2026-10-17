const VARIANTS = {
  primary: 'bg-teal-700 text-white active:bg-teal-800',
  secondary: 'bg-white text-teal-800 border-2 border-teal-700 active:bg-teal-50',
  danger: 'bg-red-700 text-white active:bg-red-800',
}

// Renders a link when given href (e.g. tel:112), otherwise a button
export default function BigButton({ children, onClick, href, variant = 'primary' }) {
  const className = `flex w-full min-h-14 items-center justify-center rounded-2xl px-6 py-4 text-center text-xl font-semibold ${VARIANTS[variant]}`
  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  )
}
