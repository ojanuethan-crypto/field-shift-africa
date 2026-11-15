import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Screen from '../../components/Screen.jsx'
import { CROPS } from '../../data/crops.js'
import { useFarm } from '../../state/FarmContext.jsx'

// S17 My Farms. Saved plots live only on the phone (FarmContext.farms -> localStorage).
// Farm shape: { id?, name, lat, lon, plan?: { name, crops: ['maize', 'groundnut', ...] } }
const farmId = (f) => f.id ?? `${Number(f.lat).toFixed(2)},${Number(f.lon).toFixed(2)}`

export default function S17MyFarms() {
  const { t } = useTranslation()
  const { farm, farms, update } = useFarm()
  const [toDelete, setToDelete] = useState(null)
  const currentSaved = farm && farms.some((f) => farmId(f) === farmId(farm))

  const saveCurrent = () =>
    update({ farms: [...farms, { ...farm, id: farmId(farm), name: farm.name || t('s17.unnamed') }] })
  const addExample = () => {
    const f = { id: 'example-douala', name: 'Douala', lat: 4.05, lon: 9.7, plan: { name: 'Soil-rebuilder', crops: ['maize', 'groundnut', 'cassava'] } }
    if (!farms.some((x) => x.id === f.id)) update({ farms: [...farms, f] })
  }
  const remove = () => {
    update({ farms: farms.filter((f) => farmId(f) !== farmId(toDelete)) })
    setToDelete(null)
  }

  return (
    <Screen title={t('s17.title')} subtitle={t('s17.subtitle')} speak={`${t('s17.title')}. ${t('s17.subtitle')}`}>
      <div className="space-y-4">
        {farm && !currentSaved && (
          <button type="button" onClick={saveCurrent}
            className="tap flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-accent py-3 text-lg font-medium text-ink">
            <Plus /> {t('s17.saveCurrent')}
          </button>
        )}

        {farms.length === 0 ? (
          <div className="space-y-3 rounded-3xl bg-white p-6 text-center shadow-sm">
            <MapPin className="mx-auto text-brand-700" size={40} />
            <p className="text-lg">{t('s17.empty')}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {farms.map((f) => {
              const current = farm && farmId(farm) === farmId(f)
              return (
                <li key={farmId(f)} className={`space-y-3 rounded-3xl bg-white p-4 shadow-sm ${current ? 'border-2 border-brand-700' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-brand-900">{f.name}</h2>
                      <p className="text-xs text-ink-soft">{Number(f.lat).toFixed(2)}, {Number(f.lon).toFixed(2)}</p>
                    </div>
                    {current && <span className="rounded-full bg-brand-700 px-3 py-1 text-xs font-bold text-white">{t('s17.current')}</span>}
                  </div>

                  {f.plan?.crops?.length ? (
                    <p className="flex flex-wrap items-center gap-1 text-2xl" aria-label={f.plan.name}>
                      {f.plan.crops.map((c, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <ArrowRight size={16} className="text-gray-500" />}
                          <span>{CROPS[c]?.emoji ?? '🌱'}</span>
                        </span>
                      ))}
                      <span className="ml-2 text-sm font-bold text-brand-700">{f.plan.name}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-ink-soft">{t('s17.noPlan')}</p>
                  )}

                  <div className="flex gap-2">
                    {!current && (
                      <button type="button" onClick={() => update({ farm: { lat: f.lat, lon: f.lon, name: f.name } })}
                        className="tap flex-1 rounded-full bg-brand-700 font-bold text-white">{t('s17.use')}</button>
                    )}
                    <button type="button" onClick={() => setToDelete(f)} aria-label={`${t('s17.delete')} ${f.name}`}
                      className="tap inline-flex items-center justify-center gap-1 rounded-full border-2 border-red-600 px-4 font-bold text-red-600">
                      <Trash2 size={20} /> {t('s17.delete')}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <Link to="/" className="tap flex items-center justify-center gap-2 rounded-2xl bg-brand-900 py-3 text-lg font-medium text-white">
          <Plus /> {t('s17.add')}
        </Link>
        {import.meta.env.DEV && (
          <button type="button" onClick={addExample} className="w-full text-sm text-ink-soft underline">{t('s17.example')}</button>
        )}
        <p className="text-center text-xs text-ink-soft">{t('s17.privacy')}</p>
      </div>

      {toDelete && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="del-title">
          <div className="w-full max-w-sm space-y-3 rounded-3xl bg-white p-5">
            <h2 id="del-title" className="text-xl font-bold text-brand-900">{t('s17.confirmTitle')}</h2>
            <p><b>{toDelete.name}</b>. {t('s17.confirmText')}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setToDelete(null)} className="tap flex-1 rounded-full border-2 border-brand-700 font-bold text-brand-900">{t('s17.cancel')}</button>
              <button type="button" onClick={remove} className="tap flex-1 rounded-full bg-red-600 font-bold text-white">{t('s17.yes')}</button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  )
}
