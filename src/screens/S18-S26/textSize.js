// Text size setting for S22. Stored on the phone only. Applied once when the app loads (this file is
// imported by routes.jsx, which is part of the first bundle) and again whenever it changes.
const KEY = 'fs.textSize'
const SIZES = { normal: '16px', large: '19px', xlarge: '22px' }

export const getTextSize = () => {
  try { return localStorage.getItem(KEY) || 'normal' } catch { return 'normal' }
}

export function setTextSize(size) {
  try { localStorage.setItem(KEY, size) } catch { /* private mode */ }
  document.documentElement.style.fontSize = SIZES[size] || SIZES.normal
}

setTextSize(getTextSize())
