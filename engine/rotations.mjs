// @ts-nocheck
// Rotation engine: transparent multi-criteria scoring (NOT machine learning). Pure function, no I/O.
// Guide 04 sections 8.1-8.4. Decisions written down here AND on the Data Passport (scoring_config / passport_notes):
//  * Candidate crops = in_mvp crops whose suitability (min of temperature, rainfall, pH trapezoids) >= 0.4.
//  * Long-cycle crops (cycle > 180 d) take ONE plan slot, water is computed over a 6-month window, and they carry LONG_CYCLE_WARNING.
//  * No intercropping. Planting month = start of the cell's planting window (rain onset), seasons repeat yearly.
//  * Effective rainfall = 80% of rain. Rain scenarios: dry = P20, normal = P50, wet = P80 of monthly rainfall.
//  * Hard rules: no same crop / same family in consecutive slots (and not the farmer's last crop family in slot 1),
//    >= 1 legume in plans of 3+ seasons, flood-intolerant crops (flood_tol = 1) excluded in flood-prone cells.

export const EFFECTIVE_RAIN = 0.8
export const SUIT_MIN = 0.4

export function suit(v, amin, omin, omax, amax) {
  if (v == null || amin == null) return 1 // no range (e.g. fallow): always suitable
  if (v <= amin || v >= amax) return 0
  if (v >= omin && v <= omax) return 1
  return v < omin ? (v - amin) / (omin - amin) : (amax - v) / (amax - omax)
}

const WATER_LABEL = (ratio) => (ratio >= 0.9 ? 'enough' : ratio >= 0.5 ? 'risky' : 'not_enough')
const clamp01 = (x) => Math.max(0, Math.min(1, x))
const mean = (a) => a.reduce((s, x) => s + x, 0) / Math.max(a.length, 1)

// cycle window starting at planting month m (1-12): returns the 12-month indexes covered
function cycleMonths(crop, m) {
  const n = Math.max(2, Math.min(6, Math.ceil(Math.min(crop.cycle_days, 180) / 30)))
  return Array.from({ length: n }, (_, i) => (m - 1 + i) % 12)
}

// Water fit (guide 8.4). rainByMonth: 12 values mm. etc = kc * ET0 over the cycle.
export function waterRatio(crop, m, rainByMonth, et0ByMonth, irrigated) {
  const idx = cycleMonths(crop, m)
  const rain = idx.reduce((s, i) => s + rainByMonth[i], 0) * EFFECTIVE_RAIN
  const etc = Math.max(1, crop.kc_avg * idx.reduce((s, i) => s + et0ByMonth[i], 0))
  const ratio = rain / etc
  return irrigated ? Math.min(1.4, 0.5 + 0.5 * ratio + 0.4) : ratio // irrigation lifts the effective ratio
}

export function cropSuitability(crop, cell, tmeanByMonth, m) {
  if (crop.tmin_abs == null) return 1
  const idx = cycleMonths(crop, m)
  const t = mean(idx.map((i) => tmeanByMonth[i]))
  const sT = suit(t, crop.tmin_abs, crop.tmin_opt, crop.tmax_opt, crop.tmax_abs)
  const sR = suit(cell.rain_annual, crop.rain_min_abs, crop.rain_min_opt, crop.rain_max_opt, crop.rain_max_abs)
  const sP = cell.ph == null ? 1 : suit(cell.ph, crop.ph_min_abs, crop.ph_min_opt, crop.ph_max_opt, crop.ph_max_abs)
  return Math.min(sT, sR, sP)
}

export function soilScore(seq, canBuyFert) {
  const legume = seq.filter((c) => c.is_legume).length / seq.length
  const diversity = new Set(seq.map((c) => c.family)).size / seq.length
  const cover = seq.reduce((s, c) => s + c.cover, 0) / (5 * seq.length)
  const legWeight = canBuyFert ? 2 : 2.4 // without fertilizer the soil depends more on legumes (assumption)
  return 0.4 * Math.min(legume * legWeight, 1) + 0.3 * diversity + 0.3 * cover
}

export function resilience(seq, hz) {
  const w = { drought: hz.drought, flood: hz.flood, heat: hz.heat }
  const tol = { drought: 'drought_tol', flood: 'flood_tol', heat: 'heat_tol' }
  let num = 0, den = 0
  for (const h of Object.keys(w)) {
    num += w[h] * (seq.reduce((s, c) => s + c[tol[h]], 0) / (5 * seq.length))
    den += w[h]
  }
  return num / den
}

export function priorityWeights(priorities) {
  const n = Math.min((priorities || []).length, 2)
  const sel = (k) => (priorities || []).includes(k)
  const W = { 0: [0.25, 0.25], 1: [0.55, 0.15], 2: [0.4, 0.1] }[n]
  const w = {}
  for (const k of ['money', 'water', 'soil', 'safety']) w[k] = sel(k) ? W[0] : W[1]
  return w
}

const KIND_FOCUS = {
  safest: { safety: 0.5, water: 0.2, soil: 0.15, money: 0.15 },
  soil: { soil: 0.5, safety: 0.2, water: 0.15, money: 0.15 },
  money: { money: 0.5, water: 0.2, soil: 0.15, safety: 0.15 },
}

/**
 * input: { cell: {rain_annual, ph, hz:{drought,flood,heat}, n_seasons}, climate: [{month,rain_p20,rain_p50,rain_p80,tmean,et0}] (12),
 *          floodMonths: number[], plantMonths: number[] (1-2 onset months), crops: [...], reasons: {code:{en,fr}} }
 * opts : { lastCrop: slug|null, canWater: bool, canBuyFertilizer: bool, priorities: string[] }
 */
export function rankRotations(input, opts = {}) {
  const { cell, climate, crops, reasons, floodMonths = [], plantMonths } = input
  const rain = { dry: [], normal: [], wet: [] }, et0 = [], tmean = []
  for (const r of [...climate].sort((a, b) => a.month - b.month)) {
    rain.dry.push(r.rain_p20); rain.normal.push(r.rain_p50); rain.wet.push(r.rain_p80); et0.push(r.et0); tmean.push(r.tmean)
  }
  if (!plantMonths || plantMonths.length === 0) return { low_potential: true, plans: [] }
  const bimodal = cell.n_seasons >= 2 && plantMonths.length >= 2
  const L = bimodal ? 4 : 3
  const slotMonth = (i) => (bimodal ? plantMonths[i % 2] : plantMonths[0])
  const irrigated = !!opts.canWater
  const last = opts.lastCrop && opts.lastCrop !== 'none' ? crops.find((c) => c.slug === opts.lastCrop) : null

  // 1) per-crop, per-slot suitability and candidate pool
  const pool = crops.filter((c) => c.in_mvp)
  const suitBy = (c, i) => cropSuitability(c, cell, tmean, slotMonth(i))
  const flooded = (c, i) => cell.hz.flood >= 4 && c.flood_tol === 1 && cycleMonths(c, slotMonth(i)).some((mi) => floodMonths.includes(mi + 1))
  let cand = pool.filter((c) => [...Array(L).keys()].every((i) => suitBy(c, i) >= SUIT_MIN && !flooded(c, i)))
  if (cand.length < 3) cand = pool.filter((c) => suitBy(c, 0) >= SUIT_MIN && !flooded(c, 0)) // relaxed: at least suitable in first slot
  if (cand.length < 2) return { low_potential: true, plans: [] }
  cand = cand.map((c) => ({ c, s: mean([...Array(L).keys()].map((i) => suitBy(c, i))) })).sort((a, b) => b.s - a.s).slice(0, 8).map((x) => x.c)

  // 2) enumerate sequences under hard rules
  const seqs = []
  const rec = (acc) => {
    if (acc.length === L) { if (acc.some((c) => c.is_legume)) seqs.push(acc.slice()); return }
    for (const c of cand) {
      const prev = acc.length ? acc[acc.length - 1] : last
      if (prev && (prev.slug === c.slug || prev.family === c.family)) continue
      if (acc.length && acc.some((x, k) => k === acc.length - 1 && x.slug === c.slug)) continue
      acc.push(c); rec(acc); acc.pop()
    }
  }
  rec([])
  if (!seqs.length) return { low_potential: false, plans: [], note: 'NO_VALID_SEQUENCE' }

  // 3) score
  const hz = cell.hz
  const scored = seqs.map((seq) => {
    const wf = (sc) => mean(seq.map((c, i) => Math.min(1, Math.max(0, waterRatio(c, slotMonth(i), rain[sc], et0, irrigated)))))
    const sub = {
      money: mean(seq.map((c) => c.income_idx)) / 5,
      water: wf('normal'),
      soil: soilScore(seq, !!opts.canBuyFertilizer),
      safety: resilience(seq, hz),
    }
    const waterScen = { dry: wf('dry'), normal: sub.water, wet: wf('wet') }
    return { seq, sub, waterScen }
  })
  const total = (s, w, sc = 'normal') => w.money * s.sub.money + w.water * (sc === 'normal' ? s.sub.water : s.waterScen[sc]) + w.soil * s.sub.soil + w.safety * s.sub.safety

  // 4) three named plans with diversity
  const plans = []
  const used = []
  for (const kind of ['safest', 'soil', 'money']) {
    const w = KIND_FOCUS[kind]
    const ranked = scored.slice().sort((a, b) => total(b, w) - total(a, w))
    const pick = ranked.find((s) => used.every((u) => u.filter((c, i) => c.slug === s.seq[i].slug).length <= L - 2)) || ranked[0]
    used.push(pick.seq)
    const seq = pick.seq
    const steps = seq.map((c, i) => ({
      crop: c.slug, month: slotMonth(i),
      water: ['dry', 'normal', 'wet'].map((sc) => WATER_LABEL(waterRatio(c, slotMonth(i), rain[sc], et0, irrigated))),
    }))
    const why = new Set(), warn = new Set()
    const first = seq[0]
    if (seq.some((c, i) => i > 0 && c.is_legume && seq[i - 1].family === 'Poaceae')) why.add('LEGUME_AFTER_CEREAL')
    if (new Set(seq.map((c) => c.family)).size === seq.length) why.add('FAMILY_BREAK')
    if (last) why.add('LAST_CROP_AVOIDED')
    if (hz.flood >= 4 && seq.every((c) => c.flood_tol >= 2)) why.add(floodMonths.length ? 'AVOIDS_FLOOD_PEAK' : 'FLOOD_TOLERANT')
    if (hz.drought >= 4 && mean(seq.map((c) => c.drought_tol)) >= 3.3) why.add('DROUGHT_TOLERANT')
    if (mean(seq.map((c) => c.cover)) >= 3.4) why.add('COVER_PROTECTS_SOIL')
    if (kind === 'money' && pick.sub.money >= 0.7) why.add('HIGH_INCOME_CROP')
    if (irrigated && hz.drought >= 3) why.add('IRRIGATION_HELPS')
    if (pick.sub.water >= 0.9) why.add('WATER_ENOUGH')
    if (steps.some((s) => s.water[0] !== 'enough')) warn.add('FAILS_DRY_YEAR')
    if (steps.some((s) => s.water[2] === 'not_enough') || (hz.flood >= 4 && steps.some((s) => s.water[2] === 'risky'))) warn.add('WET_YEAR_WEAK')
    if (seq.some((c) => c.cycle_days > 180)) warn.add('LONG_CYCLE_WARNING')
    if (seq.some((c) => c.heat_tol <= 2) && hz.heat >= 4) warn.add('HEAT_RISK')
    if (cell.soc != null && cell.soc < 10 && !opts.canBuyFertilizer) warn.add('LOW_FERTILITY')
    warn.add('LOW_CONFIDENCE')
    const txt = (code) => reasons[code] || { en: code, fr: code }
    const whyList = [...why].slice(0, 3)
    plans.push({
      id: `${cell.cell_id}-${kind}`, kind, sequence: steps,
      sub: Object.fromEntries(Object.entries(pick.sub).map(([k, v]) => [k, +clamp01(v).toFixed(2)])),
      scen: Object.fromEntries(['dry', 'normal', 'wet'].map((sc) => [sc, +clamp01(total(pick, w, sc)).toFixed(2)])),
      reason: whyList.length ? txt(whyList[0]) : txt('FAMILY_BREAK'),
      why: whyList.map((c) => ({ code: c, ...txt(c) })),
      warnings: [...warn].map((c) => ({ code: c, ...txt(c) })),
      total_by_weights: +total(pick, priorityWeights(opts.priorities)).toFixed(3),
    })
  }
  const best = plans.slice().sort((a, b) => b.total_by_weights - a.total_by_weights)[0]
  return { low_potential: false, best_for_you: best.id, plans, season_count: L, engine_version: 'rules-1.0' }
}
