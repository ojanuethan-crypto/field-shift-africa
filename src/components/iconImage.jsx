import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { ICONS } from './SciFarmIcons.jsx'

// Render one of the SVG icons to an <img>, so it can be drawn on a canvas (e.g. the share picture).
// Returns null if the name is not in ICONS.
export async function iconToImage(name, size = 192) {
  const Icon = ICONS[name]
  if (!Icon) return null
  const host = document.createElement('div')
  const root = createRoot(host)
  flushSync(() => root.render(<Icon width={size} height={size} />))
  const svg = host.querySelector('svg')
  if (!svg) {
    root.unmount()
    return null
  }
  const xml = new XMLSerializer().serializeToString(svg)
  root.unmount()
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
  await img.decode()
  return img
}
