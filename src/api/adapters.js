// The ONE place that turns backend responses into the shapes the screens use.
// If the backend shape changes, change it here (and in docs/API_CONTRACT.md), not in the screens.
//
// Accepted input per endpoint (see docs/API_CONTRACT.md):
//  - texts can be a plain string (already in the requested language) or { en, fr }
//  - rotations: the guide-02 shape ({ plans: [{ id, score, sequence, subscores, scenarios, reasons,
//    warnings, explanation }] }) plus the optional extras `kind`, `plant_month`, `water` per season
//  - mock files already use the internal shape and pass through unchanged
import { ZONES } from '../screens/S9-S17/zones.js'

export const both = (x) => (x && typeof x === 'object' ? x : { en: x ?? '', fr: x ?? '' })

const zoneArt = (id) => {
  const z = ZONES.find((zz) => zz.id === id)
  return { pic: z?.pic, icon: z?.emoji ?? '🌍' }
}

// data_quality / state values the backend can send for places we cannot advise on (F52)
const STATE_OF = { ocean: 'ocean', desert: 'desert', outside: 'outside', no_data: 'nodata', nodata: 'nodata', error: 'error' }

// GET /api/profile  ->  { zone, description, hazards, rain_p50, soil } | { outside } | { state }
export function normalizeProfile(raw) {
  if (!raw || raw.outside || raw.state) return raw
  const dq = raw.data_quality
  if (dq && dq !== 'ok') return { state: STATE_OF[dq] ?? 'nodata' }
  if (raw.zone?.name && typeof raw.zone.name === 'object' && !raw.climate) return raw // internal (mock) shape
  const z = raw.zone ?? {}
  const soil = raw.soil
  return {
    zone: { id: z.id, name: both(z.name), ...zoneArt(z.id) },
    description: both(raw.description ?? z.description),
    hazards: raw.hazards ?? {},
    rain_p50: raw.rain_p50 ?? raw.climate?.rain_p50 ?? [],
    soil: both(typeof soil === 'string' ? soil : soil?.summary ?? (soil?.en ? soil : '')),
  }
}

const level = (v) => (v >= 0.7 ? 'enough' : v >= 0.5 ? 'risky' : 'not_enough')

// Plan names are Safest / Soil-rebuilder / Money-first. The backend should send `kind`; if it does not,
// guess it from the strongest sub-score.
function guessKind(sub) {
  const money = sub.income ?? sub.money ?? 0
  const soil = sub.soil ?? 0
  const safe = sub.resilience ?? sub.safety ?? 0
  if (soil >= money && soil >= safe) return 'soil'
  if (money >= safe) return 'money'
  return 'safest'
}

function normalizePlan(p) {
  if (p.sub) return p // already the internal (mock) shape
  const sub = p.subscores ?? {}
  const scen = p.scenarios ?? {}
  const reasons = p.reasons?.length ? p.reasons : [p.explanation].filter(Boolean)
  return {
    id: p.id,
    kind: ['safest', 'soil', 'money'].includes(p.kind) ? p.kind : guessKind(sub),
    sequence: (p.sequence ?? []).map((s) => ({
      crop: s.crop,
      month: s.plant_month ?? s.month ?? null,
      // per season [dry, normal, wet]; if the backend does not send it, derive it from the scenario scores
      water: s.water
        ? [s.water.dry, s.water.normal, s.water.wet]
        : [level(scen.dry ?? 0.6), level(scen.normal ?? 0.7), level(scen.wet ?? 0.6)],
    })),
    sub: {
      money: sub.income ?? sub.money ?? 0,
      water: sub.water ?? 0,
      soil: sub.soil ?? 0,
      safety: sub.resilience ?? sub.safety ?? 0,
    },
    scen: { dry: scen.dry ?? 0, normal: scen.normal ?? 0, wet: scen.wet ?? 0 },
    reason: both(reasons[0] ?? ''),
    why: reasons.map(both),
    warnings: (p.warnings ?? []).map(both),
    // the backend scores with the farmer's priorities, last crop and conditions: its score wins
    serverScore: typeof p.score === 'number' ? (p.score > 1 ? p.score / 100 : p.score) : null,
  }
}

// POST /api/rotations  ->  [plan, ...]
export function normalizeRotations(raw) {
  const list = Array.isArray(raw) ? raw : raw?.plans ?? []
  return list.map(normalizePlan)
}

// GET /api/window  ->  { start_month, end_month, text? } | null   (months 1-12; the window may wrap the year, e.g. 11 -> 1)
// `text` is optional (a string in the requested language, or { en, fr }); without it the app builds the sentence.
export function normalizeWindow(raw) {
  if (!raw) return null
  const start = Number(raw.start_month ?? raw.start)
  const end = Number(raw.end_month ?? raw.end)
  if (!(start >= 1 && start <= 12 && end >= 1 && end <= 12)) return null
  return { start_month: start, end_month: end, text: raw.text || null }
}
