// Runs Ojani's engine/rotations.mjs on his engine/testdata.json and prints the plans as JSON (used by test_engine_plans.py).
// usage: node js_plans_runner.mjs '<opts json>'
import fs from 'fs'
import { rankRotations } from '../../engine/rotations.mjs'

const d = JSON.parse(fs.readFileSync(new URL('../../engine/testdata.json', import.meta.url)))
const extra = JSON.parse(fs.readFileSync(new URL('./fixtures/extra_cells.json', import.meta.url)))
delete extra._note
Object.assign(d.cells, extra) // real cells from the live database that the supplied test data lacks (two-season)
const opts = JSON.parse(process.argv[2] || '{}')
const out = {}
for (const [name, cell] of Object.entries(d.cells)) {
  out[name] = rankRotations({ ...cell, crops: d.crops, reasons: d.reasons }, opts)
}
process.stdout.write(JSON.stringify(out))
