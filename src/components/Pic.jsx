import { ICONS } from './SciFarmIcons.jsx'
import { CROPS } from '../data/crops.js'

// Illustration slot. Looks the icon up in ICONS (SciFarmIcons.jsx, inline SVG, transparent background).
// Any name not in ICONS yet shows the emoji (or the `fallback` node) instead, so screens keep working
// while the set is being completed. See docs/ICONS.md for the list of names.
export default function Pic({ name, emoji, fallback, size = 48, className = '' }) {
  const Icon = name ? ICONS[name] : null
  if (Icon) {
    return <Icon width={size} height={size} className={`inline-block shrink-0 ${className}`} aria-hidden="true" focusable="false" />
  }
  if (fallback) return fallback
  return (
    <span aria-hidden className={`inline-block leading-none ${className}`} style={{ fontSize: size * 0.85 }}>
      {emoji}
    </span>
  )
}

export function CropPic({ id, size = 48, className }) {
  return <Pic name={`crop-${id}`} emoji={CROPS[id]?.emoji} size={size} className={className} />
}
