import { Star, Check, TriangleAlert, X } from 'lucide-react'

export const Card = ({ className = '', children, ...p }) => (
  <section className={`rounded-3xl bg-white p-4 shadow-[0_2px_12px_rgba(20,38,28,0.06)] ${className}`} {...p}>
    {children}
  </section>
)

/* Big pill button (>= 48px). variant: solid | soft | outline */
export function Button({ variant = 'solid', className = '', icon: Icon, children, ...p }) {
  const styles = {
    solid: 'bg-primary text-white',
    soft: 'bg-[#dcebe2] text-primary',
    outline: 'border-2 border-primary text-primary bg-white',
  }[variant]
  return (
    <button
      type="button"
      className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-base font-semibold disabled:opacity-50 ${styles} ${className}`}
      {...p}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  )
}

/* Stars instead of numbers (design rule). */
export const Stars = ({ value, max = 5 }) => (
  <span className="flex gap-0.5" role="img" aria-label={`${value}/${max}`}>
    {Array.from({ length: max }, (_, i) => (
      <Star key={i} size={18} className={i < value ? 'fill-amber text-amber' : 'text-line'} />
    ))}
  </span>
)

/* Colour AND shape: green tick, yellow triangle, red cross. */
export function StatusIcon({ status, label }) {
  const map = {
    ok: { I: Check, c: 'bg-accent text-white' },
    warn: { I: TriangleAlert, c: 'bg-amber text-ink' },
    bad: { I: X, c: 'bg-danger text-white' },
  }[status]
  return (
    <span aria-label={label} className={`flex h-6 w-6 items-center justify-center rounded-full ${map.c}`}>
      <map.I size={14} strokeWidth={3} />
    </span>
  )
}

export const Disclaimer = ({ children }) => (
  <p className="px-6 text-center text-sm leading-snug text-muted">{children}</p>
)
