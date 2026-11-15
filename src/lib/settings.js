import { useSyncExternalStore } from 'react'
import i18n from 'i18next'

/* Phone-only settings (no server, no account). Stored in localStorage under "fs.*". */
const KEY = 'fs.settings'
const SIZES = { normal: '16px', large: '19px', xlarge: '22px' }

function detectLang() {
  return (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en'
}
function read() {
  try {
    return { lang: detectLang(), textSize: 'normal', voice: true, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { lang: detectLang(), textSize: 'normal', voice: true }
  }
}

let state = read()
const listeners = new Set()

export const getSettings = () => state

export function applySettings() {
  document.documentElement.style.setProperty('--fs-root', SIZES[state.textSize] || SIZES.normal)
  document.documentElement.lang = state.lang
}

export function setSettings(patch) {
  state = { ...state, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode */ }
  applySettings()
  if (patch.lang && i18n.language !== patch.lang) i18n.changeLanguage(patch.lang)
  listeners.forEach((l) => l())
}

export function useSettings() {
  const s = useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    getSettings,
  )
  return [s, setSettings]
}

/* "Clear my data": removes everything this app stored on the phone. */
export function clearMyData() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith('fs.')).forEach((k) => localStorage.removeItem(k))
  } catch { /* ignore */ }
  state = read()
  applySettings()
  i18n.changeLanguage(state.lang)
  listeners.forEach((l) => l())
}
