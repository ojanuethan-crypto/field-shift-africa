import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../../api/client.js'
import { useData } from './useData.js'

// Data hooks. Real endpoints: GET /api/advice-index and GET /api/faq (Roadmap section 6).
// Real documents are stored one language per passage, so the index is asked for in the app language (mock passages have both).
export function useAdviceIndex() {
  const { i18n } = useTranslation()
  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
  return useData(() => api(`/api/advice-index?lang=${lang}`, { mockFile: 'advice-index.json' }), [lang])
}
export const useFaq = (lang) => useData(() => api(`/api/faq?lang=${lang}`, { mockFile: 'faq.json' }), [lang])

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'my', 'i', 'to', 'of', 'in', 'on', 'do', 'how', 'what', 'can', 'and', 'for',
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'est', 'mon', 'ma', 'mes', 'je', 'que', 'qui', 'quoi', 'comment', 'dans', 'et', 'pour', 'sur', 'ne', 'pas'])

export const normalize = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ')

const tokens = (s) => normalize(s).split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w))

// Offline keyword search (F42). No AI model. Returns the best passage, or null if nothing matches well.
export function searchPassages(query, passages, lang) {
  const q = tokens(query)
  if (!q.length) return null
  let best = null
  for (const p of passages) {
    const kw = new Set((p.keywords?.[lang] ?? []).map(normalize))
    const body = tokens(p.text[lang])
    let score = 0
    for (const w of q) {
      const stem = w.length > 4 ? w.slice(0, -1) : w
      if (kw.has(w) || [...kw].some((k) => k.startsWith(stem))) score += 2
      else if (body.some((b) => b === w || (w.length > 4 && b.startsWith(stem)))) score += 1
    }
    if (!best || score > best.score) best = { p, score }
  }
  return best && best.score >= 2 ? best.p : null
}
