import { Check, TriangleAlert, X } from 'lucide-react'

// Color AND shape: green tick, yellow triangle, red cross. status: 'good' | 'warn' | 'bad'
const MAP = {
  good: { Icon: Check, cls: 'bg-green-600 text-white' },
  warn: { Icon: TriangleAlert, cls: 'bg-amber-400 text-ink' },
  bad: { Icon: X, cls: 'bg-red-600 text-white' },
}

export default function StatusMark({ status = 'good', size = 20, label }) {
  const { Icon, cls } = MAP[status]
  return (
    <span
      role="img"
      aria-label={label || status}
      className={`inline-grid place-items-center rounded-full ${cls}`}
      style={{ width: size, height: size }}
    >
      <Icon size={size * 0.62} strokeWidth={2.5} />
    </span>
  )
}
