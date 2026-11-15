import { Marker } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from 'react-i18next'
import Screen from '../../components/Screen.jsx'
import { api } from '../../api/client.js'
import { CROPS, cropName } from '../../data/crops.js'
import { useFarm } from '../../state/FarmContext.jsx'
import MapBox from './components/MapBox.jsx'
import MockBadge from './components/MockBadge.jsx'
import QueryState from './components/QueryState.jsx'
import { useData } from './lib/useData.js'

const pin = (n) =>
  L.divIcon({
    className: '',
    iconSize: [28, 28],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#e9a23b;color:#1f2a24;font:700 14px system-ui;
      display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 1px 4px #0006">${n}</div>`,
  })
const farmIcon = L.divIcon({
  className: '',
  iconSize: [30, 30],
  html: '<div style="width:30px;height:30px;border-radius:50%;background:#2563eb;border:4px solid #fff;box-shadow:0 1px 4px #0006"></div>',
})

// Similarity as 5 dots (shape + count, not a bare number).
const Dots = ({ value }) => (
  <span className="inline-flex gap-1" role="img" aria-label={`${Math.round(value * 5)}/5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className={`h-3 w-3 rounded-full ${i <= Math.round(value * 5) ? 'bg-brand-700' : 'border-2 border-gray-300'}`} />
    ))}
  </span>
)

// S11 Climate Twins: 3-5 similar places elsewhere in Africa and what grows there.
export default function S11ClimateTwins() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
  const { farm } = useFarm()
  const lat = farm?.lat ?? 4.05
  const lon = farm?.lon ?? 9.7
  const query = useData(() => api(`/api/twins?lat=${lat}&lon=${lon}&lang=${lang}`, { mockFile: 'twins.json' }), [lat, lon, lang])
  const twins = query.data?.twins ?? []
  const origin = query.data?.origin

  return (
    <Screen title={t('s11.title')} subtitle={t('s11.subtitle')} speak={`${t('s11.title')}. ${t('s11.subtitle')}`}>
      <div className="space-y-4">
        <MockBadge />
        <QueryState query={query} />

        {query.data && (
          <>
            <MapBox center={[2, 15]} zoom={3}>
              {origin && <Marker position={[origin.lat, origin.lon]} icon={farmIcon} />}
              {twins.map((x, i) => <Marker key={x.name} position={[x.lat, x.lon]} icon={pin(i + 1)} />)}
            </MapBox>
            <p className="-mt-2 text-xs text-ink-soft">
              <span className="mr-1 inline-block h-3 w-3 rounded-full bg-[#2563eb] align-middle" /> {t('s11.yourFarm')}
              {origin && !farm ? ` (${t('s11.demoPlace', { place: origin.name })})` : ''}
            </p>

            {twins.length === 0 ? (
              <p role="status" className="rounded-3xl bg-white p-4 text-center shadow-sm">{t('s11.empty')}</p>
            ) : (
              <ul className="space-y-3">
                {twins.map((x, i) => (
                  <li key={x.name} className="space-y-2 rounded-3xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-accent font-bold">{i + 1}</span>
                      <div className="flex-1">
                        <h2 className="font-bold text-brand-900">{x.name}</h2>
                        <p className="text-sm text-ink-soft">{x.country}</p>
                      </div>
                      <Dots value={x.similarity} />
                    </div>
                    <p>{x.reason[lang]}</p>
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <b>{t('s11.growsThere')}:</b>
                      {x.crops.map((c) => (
                        <span key={c} className="rounded-full bg-brand-100 px-3 py-1 font-bold text-brand-900">
                          {CROPS[c]?.emoji ?? '🌱'} {cropName(c, lang)}
                        </span>
                      ))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Screen>
  )
}
