// Client-side scoring used while the backend is mocked (see guide 05, section 6).
// Real backend will do this; the shape of the results stays the same.

// 1-2 priorities -> weights. Two chosen: 0.4 each, others 0.1. One chosen: 0.55, others 0.15.
export function weightsFromPriorities(priorities = []) {
  const keys = ['money', 'water', 'soil', 'safety']
  const n = priorities.length
  const hi = n === 2 ? 0.4 : 0.55
  const lo = n === 2 ? 0.1 : 0.15
  if (n === 0) return Object.fromEntries(keys.map((k) => [k, 0.25]))
  return Object.fromEntries(keys.map((k) => [k, priorities.includes(k) ? hi : lo]))
}

// Status for each season of a plan, for the tick / triangle / cross row.
export function seasonStatus(plan, lastCrop) {
  return plan.sequence.map((s, i) => {
    if (i === 0 && lastCrop && lastCrop === s.crop) return 'warn' // same crop twice in a row
    const w = s.water[1]
    return w === 'enough' ? 'good' : w === 'risky' ? 'warn' : 'bad'
  })
}

export function scorePlan(plan, { priorities, canWater, lastCrop }) {
  const w = weightsFromPriorities(priorities)
  let s = Object.keys(w).reduce((sum, k) => sum + w[k] * plan.sub[k], 0)
  if (canWater === false) {
    s -= 0.04 * plan.sequence.filter((x) => x.water[1] === 'not_enough').length
  }
  if (lastCrop && lastCrop === plan.sequence[0].crop) s -= 0.08
  return Math.max(0, Math.min(1, s))
}

// Returns plans with `score` and `statuses`, sorted best first.
export function rankPlans(plans, ctx) {
  return plans
    .map((p) => ({ ...p, score: scorePlan(p, ctx), statuses: seasonStatus(p, ctx.lastCrop) }))
    .sort((a, b) => b.score - a.score)
}
