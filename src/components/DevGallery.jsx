import { Link } from 'react-router-dom'
import { useFarm } from '../state/FarmContext.jsx'
import Pic from './Pic.jsx'
import { ICONS } from './SciFarmIcons.jsx'

// DEV ONLY (route /dev, not available in production builds): lists every screen so the team can
// open any of them directly. Screens not registered yet are shown greyed out as "not built".
const AGREED = [
  ['/splash', 'Splash'], ['/voice', 'Voice question'], ['/voice-pick', 'Voice pick'], ['/language', 'S0 Language'],
  ['/', 'S1 Home map'], ['/confirm', 'S2 Confirm farm'], ['/land', 'S3 Your land'], ['/last-crop', 'S4 Last crop'],
  ['/priorities', 'S5 What matters'], ['/conditions', 'S6 Two questions'], ['/routes', 'S7 Routes'],
  ['/routes/3-soil', 'S8 Route detail'], ['/space', 'S9 See from space'], ['/zones', 'S10 Zone legend'],
  ['/twins', 'S11 Climate Twins'], ['/months', 'S12 Months to watch'], ['/advisor', 'S14 Advisor'],
  ['/faq', 'S15 Common questions'], ['/sources', 'S16 Source viewer'], ['/farms', 'S17 My Farms'],
  ['/share/3-soil', 'S18 Share preview'], ['/compare', 'S19 Compare routes'], ['/passport', 'S20 Data Passport'],
  ['/proof', 'S21 Proof'], ['/settings', 'S22 Settings'], ['/about', 'S23 About'], ['/help', 'S24 Help'],
  ['/feedback', 'S25 Feedback'],
]

const DEMOS = {
  Douala: { lat: 4.05, lon: 9.7, name: 'Douala' },
  Maroua: { lat: 10.59, lon: 14.32, name: 'Maroua' },
  Ngaoundéré: { lat: 7.32, lon: 13.58, name: 'Ngaoundéré' },
}

export default function DevGallery({ routes }) {
  const { update, reset, farm, lang } = useFarm()
  const built = new Set(routes.map((r) => r.path.replace(/\/:.*$/, '')))
  const isBuilt = (path) => built.has(path.replace(/^(\/(?:routes|share))\/.+$/, '$1'))

  const seed = (name) =>
    update({
      lang: lang || 'en', voiceSet: true, muted: true, farm: DEMOS[name],
      lastCrop: 'maize', priorities: ['money', 'soil'], canWater: true, canBuyFertilizer: true,
    })

  return (
    <div className="mx-auto h-full max-w-md overflow-y-auto bg-surface p-4">
      <h1 className="text-2xl font-semibold text-brand-900">Screen gallery (dev only)</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Tap a demo farm to fill the journey state (farm, last crop, priorities, answers), then open any screen.
        Current farm: <b>{farm?.name ?? 'none'}</b> · language: <b>{lang ?? 'not chosen'}</b>
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {Object.keys(DEMOS).map((n) => (
          <button key={n} type="button" onClick={() => seed(n)}
            className="tap rounded-full bg-brand-700 px-4 text-sm font-medium text-white">Use {n}</button>
        ))}
        <button type="button" onClick={() => update({ lang: 'en' })} className="tap rounded-full bg-white px-4 text-sm ring-1 ring-brand-700">EN</button>
        <button type="button" onClick={() => update({ lang: 'fr' })} className="tap rounded-full bg-white px-4 text-sm ring-1 ring-brand-700">FR</button>
        <button type="button" onClick={() => reset() || update({ voiceSet: false, lang: null })}
          className="tap rounded-full bg-white px-4 text-sm text-red-700 ring-1 ring-red-300">Reset first-run</button>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2">
        {AGREED.map(([path, label]) =>
          isBuilt(path) ? (
            <li key={path}>
              <Link to={path} className="tap flex h-full flex-col justify-center rounded-2xl bg-white px-3 py-2 shadow-sm">
                <span className="text-sm font-medium text-ink">{label}</span>
                <span className="text-xs text-ink-soft">{path}</span>
              </Link>
            </li>
          ) : (
            <li key={path} className="flex flex-col justify-center rounded-2xl bg-gray-200/60 px-3 py-2 opacity-60">
              <span className="text-sm">{label}</span>
              <span className="text-xs">{path} · not built yet</span>
            </li>
          ),
        )}
      </ul>

      <h2 className="mt-6 text-lg font-semibold text-brand-900">Icon set ({Object.keys(ICONS).length})</h2>
      <ul className="mt-2 grid grid-cols-4 gap-2" data-testid="icon-sheet">
        {Object.keys(ICONS).map((name) => (
          <li key={name} className="flex flex-col items-center rounded-2xl bg-white p-2 shadow-sm">
            <Pic name={name} size={56} />
            <span className="mt-1 text-center text-[10px] leading-tight text-ink-soft">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
