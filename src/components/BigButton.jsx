export default function BigButton({ children, onClick, variant = 'primary' }) {
  const styles =
    variant === 'primary'
      ? 'bg-teal-700 text-white active:bg-teal-800'
      : 'bg-white text-teal-800 border-2 border-teal-700 active:bg-teal-50'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full min-h-14 rounded-2xl px-6 py-4 text-xl font-semibold ${styles}`}
    >
      {children}
    </button>
  )
}
