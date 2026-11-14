import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import i18n from '../i18n'
import { setActiveVoice } from '../components/voiceEngine.js'

// Shared journey state, persisted on the phone only (no accounts, no server).
// Teammates: only ADD fields to `initial`.
const KEY = 'fieldnav.state.v1'
const initial = {
  lang: null,          // 'fr' | 'en' (null until S0 done)
  muted: false,
  voice: 'iris',        // iris | jarvis | marc | clark
  voiceSet: false,     // true once the intro "Continue with voice?" was answered
  farm: null,          // { lat, lon, name }  (coords rounded to 2 decimals)
  lastCrop: null,      // crop id | 'none' | null
  priorities: [],      // up to 2 of: money, water, soil, safety
  canWater: null,      // true | false | null
  canBuyFertilizer: null,
  selectedPlanId: null,
  farms: [],           // S17 My Farms: saved plots [{ id, name, lat, lon, plan? }]
}

const Ctx = createContext(null)

function load() {
  try {
    return { ...initial, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return initial
  }
}

export function FarmProvider({ children }) {
  const [state, setState] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode */ }
  }, [state])

  useEffect(() => {
    if (state.lang && i18n.language !== state.lang) i18n.changeLanguage(state.lang)
  }, [state.lang])

  useEffect(() => { setActiveVoice(state.voice) }, [state.voice])

  // Keep saved language in step with the TopBar language switch (only once a language was chosen on S0).
  useEffect(() => {
    const sync = (l) => setState((s) => (s.lang && s.lang !== l ? { ...s, lang: l } : s))
    i18n.on('languageChanged', sync)
    return () => i18n.off('languageChanged', sync)
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      update: (patch) => setState((s) => ({ ...s, ...patch })),
      reset: () => setState((s) => ({ ...initial, lang: s.lang, muted: s.muted })),
    }),
    [state],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useFarm = () => useContext(Ctx)
