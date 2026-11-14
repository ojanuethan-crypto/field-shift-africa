export default function PrimaryButton({ children, onClick, disabled, variant = 'solid', className = '' }) {
  const base =
    'tap w-full rounded-2xl px-5 py-3 text-lg font-medium transition active:scale-[.98] disabled:opacity-40'
  const styles =
    variant === 'solid'
      ? 'bg-brand-700 text-white shadow'
      : 'border-2 border-brand-700 bg-white text-brand-700'
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  )
}
