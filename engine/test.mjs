import fs from 'fs'
import { rankRotations, suit, soilScore } from './rotations.mjs'
const d = JSON.parse(fs.readFileSync(new URL('./testdata.json', import.meta.url)))
let fail = 0
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++ }
const by = (s) => d.crops.find((c) => c.slug === s)
for (const [name, cellData] of Object.entries(d.cells)) {
  const out = rankRotations({ ...cellData, crops: d.crops, reasons: d.reasons }, { priorities: ['soil', 'water'], canWater: false, canBuyFertilizer: false })
  console.log('\n==', name, 'low_potential:', out.low_potential, 'best:', out.best_for_you)
  for (const p of out.plans) console.log(' ', p.kind.padEnd(7), p.sequence.map((s) => s.crop + '@' + s.month).join(' > '), JSON.stringify(p.sub), JSON.stringify(p.scen), '|', p.why.map((w) => w.code).join(','), '|', p.warnings.map((w) => w.code).join(','))
  ok(out.plans.length === 3, name + ': 3 plans')
  for (const p of out.plans) {
    ok(p.sequence.every((s, i) => i === 0 || by(s.crop).family !== by(p.sequence[i - 1].crop).family), name + ' ' + p.kind + ': no same family back to back')
    ok(p.sequence.some((s) => by(s.crop).is_legume), name + ' ' + p.kind + ': has a legume')
  }
  // last-crop rule: plan must not start with the family of the last crop
  const o2 = rankRotations({ ...cellData, crops: d.crops, reasons: d.reasons }, { lastCrop: 'maize', priorities: ['money'] })
  ok(o2.plans.every((p) => by(p.sequence[0].crop).family !== 'Poaceae'), name + ': after maize, no cereal first')
}
ok(soilScore([by('maize'), by('groundnut'), by('cassava')], true) > soilScore([by('maize'), by('sorghum'), by('millet')], true), 'cereal-legume soil score beats cereal-cereal')
ok(suit(5, 0, 2, 8, 10) === 1 && suit(1, 0, 2, 8, 10) === 0.5 && suit(11, 0, 2, 8, 10) === 0, 'trapezoid suitability')
// flood-intolerant crop excluded in flood-prone cell (Douala flood=5, tomato flood_tol=1)
const dou = d.cells.Douala
const o3 = rankRotations({ ...dou, crops: d.crops, reasons: d.reasons }, {})
ok(o3.plans.every((p) => p.sequence.every((s) => s.crop !== 'tomato')), 'Douala: tomato (flood_tol 1) excluded')
console.log(fail ? '\n' + fail + ' FAILED' : '\nALL PASSED'); process.exit(fail ? 1 : 0)
