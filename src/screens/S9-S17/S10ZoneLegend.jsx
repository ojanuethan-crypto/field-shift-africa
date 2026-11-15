import { useState } from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from 'react-i18next'
import Screen from '../../components/Screen.jsx'
import Pic from '../../components/Pic.jsx'
import { api } from '../../api/client.js'
import { USE_MOCK } from '../../api/config.js'
import MapBox from './components/MapBox.jsx'
import MockBadge from './components/MockBadge.jsx'
import QueryState from './components/QueryState.jsx'
import { useData } from './lib/useData.js'
import { ZONES } from './zones.js'

// Numbered round marker: colour + number, never colour alone.
const icon = (zone, state) =>
  L.divIcon({
    className: '',
    iconSize: [28, 28],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${zone.color};color:#fff;
      font:700 14px system-ui;display:flex;align-items:center;justify-content:center;
      border:3px solid #fff;box-shadow:0 1px 4px #0006;opacity:${state === 'dim' ? 0.35 : 1};
      transform:scale(${state === 'on' ? 1.25 : 1})">${zone.id}</div>`,
  })

// S10 Zone legend and layer: map coloured by zone, picture legend, tap a zone for its summary.
export default function S10ZoneLegend() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
  const [selected, setSelected] = useState(null)
  const query = useData(() => api('/api/zones', { mockFile: 'zones.geojson' }), [])
  // Mock: the 7 draft zones (texts in the i18n file). Real: the zones the database lists (name, colour, emoji, description).
  const fromApi = !USE_MOCK && query.data?.zones
  const zones = fromApi
    ? query.data.zones.map((z) => ({ id: z.id, color: z.color, emoji: z.icon ?? '🌍', name: z.name[lang], description: z.description?.[lang] }))
    : ZONES.map((z) => ({ ...z, name: t(`s10.list.${z.id}.name`) }))
  const zone = zones.find((z) => z.id === selected)
  const toggle = (id) => setSelected((s) => (s === id ? null : id))

  return (
    <Screen title={t('s10.title')} subtitle={t('s10.subtitle')} speak={`${t('s10.title')}. ${t('s10.subtitle')}`}>
      <div className="space-y-4">
        <MockBadge />
        <QueryState query={query} />

        <MapBox>
          {query.data?.features.map((f, i) => {
            const z = zones.find((x) => x.id === f.properties.zone_id)
            if (!z) return null
            const state = selected == null ? 'normal' : selected === z.id ? 'on' : 'dim'
            return (
              <Marker
                key={i}
                position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
                icon={icon(z, state)}
                eventHandlers={{ click: () => toggle(z.id) }}
              />
            )
          })}
        </MapBox>

        <div className="grid grid-cols-2 gap-2">
          {zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => toggle(z.id)}
              aria-pressed={selected === z.id}
              className={`tap flex items-center gap-2 rounded-2xl border-2 bg-white p-2 text-left text-sm font-bold ${
                selected === z.id ? 'border-brand-700' : 'border-gray-200'
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ background: z.color }}>
                {z.id}
              </span>
              <Pic name={z.pic} emoji={z.emoji} size={36} />
              <span className="leading-tight text-brand-900">{z.name}</span>
            </button>
          ))}
        </div>

        {zone ? (
          <div className="space-y-2 rounded-3xl bg-white p-4 shadow-sm" style={{ borderLeft: `8px solid ${zone.color}` }} aria-live="polite">
            <h2 className="text-lg font-bold text-brand-900"><Pic name={zone.pic} emoji={zone.emoji} size={32} className="mr-1 align-middle" /> {zone.id}. {zone.name}</h2>
            {fromApi ? (
              zone.description && <p>{zone.description}</p>
            ) : (
              <>
                <p>{t(`s10.list.${zone.id}.pattern`)}</p>
                <p><b>{t('s10.hazards')}:</b> {t(`s10.list.${zone.id}.hazards`)}</p>
                <p><b>{t('s10.rotation')}:</b> {t(`s10.list.${zone.id}.rotation`)}</p>
                <p><b>{t('s10.examples')}:</b> {t(`s10.list.${zone.id}.examples`)}</p>
              </>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-ink-soft">{t('s10.tapHint')}</p>
        )}

        <p className="rounded-2xl bg-brand-100 p-3 text-xs text-brand-900">{t('s10.draftNote')}</p>
      </div>
    </Screen>
  )
}
