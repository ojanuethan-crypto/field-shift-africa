// Dev check: feeds the RUNNING API's answers through the app's own adapters and ranking code (no browser). Run: node backend/scripts/check_frontend.mjs [base-url]
import { normalizeProfile, normalizeRotations, normalizeWindow } from '../../src/api/adapters.js'
import { rankPlans } from '../../src/data/scoring.js'

const B = process.argv[2] || 'http://127.0.0.1:8000'
const get = async (p) => { const r = await fetch(B + p); return { status: r.status, body: await r.json() } }
const post = async (p, b) => { const r = await fetch(B + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); return { status: r.status, body: await r.json() } }
let fail = 0
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++ }

// --- S3 profile states
for (const [name, lat, lon, want] of [['Douala', 4.05, 9.7, 'profile'], ['Sahara', 23, 12, 'desert'], ['Atlantic', 0, -10, 'nodata'], ['Arctic', 80, 0, 'outside']]) {
  const r = await get(`/api/profile?lat=${lat}&lon=${lon}&lang=en`)
  const n = normalizeProfile(r.body)
  const got = n?.state ?? (n?.outside ? 'outside' : 'profile')
  ok(r.status === 200 && got === want, `profile ${name}: ${r.status} -> ${got}`)
  if (want === 'profile') {
    ok(n.zone.name.en && n.zone.name.fr && Array.isArray(n.rain_p50) && n.rain_p50.length === 12, 'profile has zone name {en,fr} and 12 rain values')
    ok(n.hazards.flood >= 1 && n.hazards.flood <= 5 && n.soil.en && n.description.fr, 'hazards 1-5, soil and description bilingual')
    ok(Array.isArray(n.watch_months?.flood), 'watch_months present for S12')
  }
}

// --- S7/S8 rotations: the exact body hooks.js sends
const body = { lat: 4.05, lon: 9.7, lang: 'en', priorities: ['soil', 'water'], last_crop: 'maize', constraints: { irrigation: false, fertilizer: null } }
const r = await post('/api/rotations', body)
ok(r.status === 200 && Array.isArray(r.body) && r.body.length === 3, `rotations 200, 3 plans`)
const plans = normalizeRotations(r.body)
ok(plans.every((p) => p.serverScore > 0 && p.serverScore <= 1), 'server score used: ' + plans.map((p) => p.serverScore.toFixed(2)))
ok(plans.every((p) => ['safest', 'soil', 'money'].includes(p.kind) && p.sequence.every((s) => s.month >= 1 && s.month <= 12 && s.water.length === 3)), 'kind, months, water meters present')
const ranked = rankPlans(plans, { priorities: ['soil', 'water'], canWater: false, lastCrop: 'maize' })
ok(ranked.every((p, i) => i === 0 || ranked[i - 1].score >= p.score) && ranked[0].score === ranked[0].serverScore, 'rankPlans keeps the server score and order')
ok(ranked.every((p) => p.sequence[0].crop !== 'maize' && !['sorghum', 'millet', 'rice'].includes(p.sequence[0].crop)), 'last crop (snake_case last_crop) reached the backend: no cereal first after maize')
ok(ranked[0].reason.en && ranked[0].reason.fr && ranked[0].why.length && ranked[0].warnings.every((w) => w.en && w.fr), 'reason/why/warnings bilingual')
const noLast = await post('/api/rotations', { ...body, last_crop: null, priorities: [] })
ok(noLast.status === 200 && noLast.body.length === 3, 'last_crop null, no priorities')
const desert = await post('/api/rotations', { lat: 23, lon: 12, lang: 'en', priorities: [], last_crop: null, constraints: {} })
const dn = normalizeRotations(desert.body)
ok(desert.status === 200 && dn.state === 'desert', 'desert rotations: 200 -> state ' + dn.state + ' (S7 shows the friendly desert screen)')
const sea = normalizeRotations((await post('/api/rotations', { lat: 0, lon: -10, lang: 'en', priorities: [], last_crop: null, constraints: {} })).body)
ok(sea.state === 'nodata', 'open sea rotations -> state ' + sea.state)

// --- F10 window
const w = normalizeWindow((await get('/api/window?lat=4.05&lon=9.7&lang=fr')).body)
ok(w && w.start_month === 3 && w.end_month === 4 && w.text.fr.includes('mars'), 'window: ' + JSON.stringify(w))

// --- S10 zones
const z = (await get('/api/zones')).body
ok(z.features.length > 2000 && z.zones.length === 10 && z.zones.every((x) => x.name.en && x.name.fr && x.color), 'zones: ' + z.features.length + ' points, ' + z.zones.length + ' zones with names/colours')
ok(z.features.every((f) => z.zones.some((x) => x.id === f.properties.zone_id)), 'every point belongs to a listed zone')

// --- S11 twins, S14-S16 advisor
const t = (await get('/api/twins?lat=4.05&lon=9.7&lang=en')).body
ok(t.twins.length >= 3 && t.twins.every((x) => x.reason.en && x.reason.fr && x.crops.every((c) => typeof c === 'string')) && t.origin.lat === 4.05, 'twins shape for S11: ' + t.twins.map((x) => x.name))
const idx = (await get('/api/advice-index?lang=fr')).body
ok(idx.passages.length > 100 && idx.passages.every((p) => p.text.fr && p.keywords.fr), 'advice-index?lang=fr: every passage has French text')
const faq = (await get('/api/faq?lang=fr')).body
ok(faq.items.every((i) => idx.passages.some((p) => p.id === i.passage) && i.q.fr), 'faq?lang=fr items resolve in the index')
const ask = (await post('/api/ask', { question: 'Des ravageurs dans mon champ', lang: 'fr', zone_id: null })).body
ok(ask.mode === 'search' && ask.answer && ask.sources[0].doc && ask.sources[0].page, 'ask answer + source: ' + ask.sources[0].doc)
const fb = await post('/api/feedback', { target: 'advisor', value: 'up' })
ok(fb.status === 200 && fb.body.ok === true, 'feedback accepted (ThumbsRow)')

// --- S20 Passport / S21 Proof (what Passport.jsx and Proof.jsx read)
const pp = (await get('/api/passport')).body
ok(pp.rows.length >= 5 && pp.rows.every((r) => r.variable.en && r.variable.fr && r.dataset && r.accessed), 'passport: ' + pp.rows.length + ' sourced rows, bilingual labels')
ok(pp.rows.every((r) => r.how) && pp.limits.length > 3 && pp.limits.every((l) => l.en && l.fr), 'passport: method text and bilingual limits')
const pr = (await get('/api/proof')).body
ok(pr.events.length >= 4 && pr.events.every((e) => e.hit_rate != null && e.baseline != null && e.misses != null && e.cells_total && e.misses_note.en && e.misses_note.fr && e.name.fr), 'proof: events with hit rate, chance, misses and a note in both languages')
const worst = pr.events.reduce((a, b) => (a.hit_rate < b.hit_rate ? a : b))
ok(worst.hit_rate < worst.baseline, 'proof shows the miss honestly: ' + worst.id + ' ' + Math.round(worst.hit_rate * 100) + '% vs chance ' + Math.round(worst.baseline * 100) + '%')
ok(pr.ndvi_correlation === null, 'proof does not invent an NDVI result')

// --- CORS for the Vite dev origin
const pre = await fetch(B + '/api/rotations', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } })
ok(pre.headers.get('access-control-allow-origin') === 'http://localhost:5173', 'CORS preflight allows http://localhost:5173')
console.log(fail ? `\n${fail} FAILED` : '\nALL PASSED'); process.exit(fail ? 1 : 0)
