import { Check } from 'lucide-react'

// Big picture card for single/multi choices (language, priorities, crops, yes/no).
export default function ChoiceCard({ icon, label, selected, onClick, size = 'lg', sub }) {
  const pad = size === 'lg' ? 'py-6' : 'py-3'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!selected}
      className={`tap relative flex flex-col items-center justify-center gap-1 rounded-3xl border-2 bg-white px-3 ${pad} text-center shadow-sm transition active:scale-[.97] ${
        selected ? 'border-brand-700 bg-brand-50' : 'border-transparent'
      }`}
    >
      {selected && (
        <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-brand-700 text-white">
          <Check size={16} strokeWidth={2.5} />
        </span>
      )}
      {typeof icon === 'string' ? (
        <span className={size === 'lg' ? 'text-5xl' : 'text-3xl'} aria-hidden>
          {icon}
        </span>
      ) : (
        <span aria-hidden className="grid place-items-center">
          {icon}
        </span>
      )}
      <span className="text-base font-medium text-ink">{label}</span>
      {sub && <span className="text-sm text-ink-soft">{sub}</span>}
    </button>
  )
}
