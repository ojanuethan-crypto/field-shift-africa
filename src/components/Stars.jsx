import { Star } from 'lucide-react'

// Score shown as stars, not numbers. value 0..1 -> 1..5 stars
export default function Stars({ value, label }) {
  const n = Math.max(1, Math.min(5, Math.round(value * 5)))
  return (
    <span className="inline-flex" role="img" aria-label={label || `${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={20}
          className={i <= n ? 'fill-amber-accent text-amber-accent' : 'text-gray-300'}
        />
      ))}
    </span>
  )
}
