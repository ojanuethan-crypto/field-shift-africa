import { useState } from 'react'
import { TileLayer, WMSTileLayer } from 'react-leaflet'
import { CloudRain, EyeOff, Leaf, Shovel, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Screen from '../../components/Screen.jsx'
import { useFarm } from '../../state/FarmContext.jsx'
import MapBox from './components/MapBox.jsx'

// NASA GIBS layers (ids and tile matrix sets checked against the live WMTS endpoint).
// 'default' = latest available picture, so the date shown is "latest", never a forecast.
const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/'
const LAYERS = {
  vegetation: {
    icon: Leaf,
    url: `${GIBS}MODIS_Terra_NDVI_8Day/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
    maxNativeZoom: 9,
    gradient: 'linear-gradient(90deg,#d9c9a3,#c9d97a,#4caf50,#1b5e20)',
  },
  rain: {
    icon: CloudRain,
    url: `${GIBS}IMERG_Precipitation_Rate/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
    maxNativeZoom: 6,
    gradient: 'linear-gradient(90deg,#b3e5fc,#4fc3f7,#1976d2,#6a1b9a)',
  },
  // Soil type: not a NASA product. ISRIC SoilGrids (250 m, modelled) "most probable WRB soil group",
  // served as WMS tiles (checked live: CORS open, 30 classes). Categorical, so a legend image, no gradient.
  soil: {
    icon: Shovel,
    wms: { url: 'https://maps.isric.org/mapserv?map=/map/wrb.map', layers: 'MostProbable' },
    legend:
      'https://maps.isric.org/mapserv?map=/map/wrb.map&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=MostProbable&FORMAT=image/png&SLD_VERSION=1.1.0',
    attribution: 'ISRIC SoilGrids',
  },
}

// S9 See from space: NASA layers on the map with a one-line "what you see". Falls back if tiles fail.
export default function S9SeeFromSpace() {
  const { t } = useTranslation()
  const { farm } = useFarm()
  const [layer, setLayer] = useState('vegetation') // 'vegetation' | 'rain' | 'soil' | 'off'
  const [fails, setFails] = useState(0)
  const pick = (id) => { setLayer(id); setFails(0) }
  const tilesFailed = layer !== 'off' && fails >= 4
  const l = LAYERS[layer]

  return (
    <Screen title={t('s9.title')} subtitle={t('s9.subtitle')} speak={`${t('s9.title')}. ${t('s9.subtitle')}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[...Object.keys(LAYERS), 'off'].map((id) => {
            const Icon = LAYERS[id]?.icon ?? EyeOff
            const active = layer === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => pick(id)}
                aria-pressed={active}
                className={`tap flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 text-sm font-bold ${
                  active ? 'border-brand-700 bg-brand-700 text-white' : 'border-gray-200 bg-white text-brand-900'
                }`}
              >
                <Icon size={26} />
                {t(`s9.layers.${id}`)}
              </button>
            )
          })}
        </div>

        <MapBox
          pin={farm}
          flyZoom={5}
          center={farm ? [farm.lat, farm.lon] : [2, 20]}
          zoom={farm ? 5 : 3}
        >
          {l && !l.wms && (
            <TileLayer
              key={layer}
              url={l.url}
              maxNativeZoom={l.maxNativeZoom}
              opacity={0.75}
              attribution="NASA GIBS"
              eventHandlers={{ tileerror: () => setFails((n) => n + 1) }}
            />
          )}
          {l?.wms && (
            <WMSTileLayer
              key={layer}
              url={l.wms.url}
              layers={l.wms.layers}
              format="image/png"
              transparent
              version="1.3.0"
              opacity={0.7}
              attribution={l.attribution}
              eventHandlers={{ tileerror: () => setFails((n) => n + 1) }}
            />
          )}
        </MapBox>

        {tilesFailed && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border-2 border-amber-accent bg-white p-3">
            <TriangleAlert className="shrink-0 text-amber-accent" />
            <p className="text-sm">{t('s9.tilesFailed')}</p>
          </div>
        )}

        {l && (
          <div className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-brand-900">{t('s9.seeing')}</h2>
            <p>{t(`s9.what.${layer}`)}</p>
            {l.gradient && (
              <div>
                <div className="h-3 rounded-full" style={{ background: l.gradient }} />
                <div className="mt-1 flex justify-between text-xs font-bold text-ink-soft">
                  <span>{t(`s9.scale.${layer}.low`)}</span>
                  <span>{t(`s9.scale.${layer}.high`)}</span>
                </div>
              </div>
            )}
            {l.legend && (
              <details className="rounded-2xl bg-surface p-3">
                <summary className="tap cursor-pointer font-bold text-brand-900">{t('s9.legendTitle')}</summary>
                <img src={l.legend} alt={t('s9.legendAlt')} loading="lazy" className="mt-2 max-w-full" />
                <p className="mt-2 text-xs text-ink-soft">{t('s9.legendNote')}</p>
              </details>
            )}
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="font-bold text-brand-900">{t('s9.date')}</dt>
              <dd>{t(layer === 'soil' ? 's9.modelled' : 's9.latest')}</dd>
              <dt className="font-bold text-brand-900">{t('s9.source')}</dt>
              <dd>{t(`s9.sources.${layer}`)}</dd>
            </dl>
          </div>
        )}
      </div>
    </Screen>
  )
}
