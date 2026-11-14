import { DropletOff, Thermometer, Waves } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Screen from '../../components/Screen.jsx'
import { api } from '../../api/client.js'
import { useFarm } from '../../state/FarmContext.jsx'
import MockBadge from './components/MockBadge.jsx'
import QueryState from './components/QueryState.jsx'
import { useData } from './lib/useData.js'

// Each hazard has its own icon AND colour (never colour alone).
const HAZARDS = [
  { key: 'dry', Icon: DropletOff, cls: 'text-[#B7791F]' },
  { key: 'flood', Icon: Waves, cls: 'text-[#2E86C1]' },
  { key: 'heat', Icon: Thermometer, cls: 'text-red-600' },
]
const NOW_MONTH = new Date().getMonth() + 1

// S12 Months to watch: 12-month strip with dry spell / flood / heat icons. Past climate, not a forecast.
export default function S12MonthsToWatch() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
  const { farm } = useFarm()
  const lat = farm?.lat ?? 4.05
  const lon = farm?.lon ?? 9.7
  // Real API: profile.watch_months = { dry: [...], flood: [...], heat: [...] } (months 1-12). Mock: flat file.
  const query = useData(() => api(`/api/profile?lat=${lat}&lon=${lon}&lang=${lang}`, { mockFile: 'watch.json' }), [lat, lon, lang])
  const d = query.data
  const wm = d?.watch_months ?? d
  const name = (m, style = 'short') => new Intl.DateTimeFormat(lang, { month: style }).format(new Date(2026, m - 1, 1))
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <Screen title={t('s12.title')} subtitle={t('s12.subtitle')} speak={`${t('s12.title')}. ${t('s12.subtitle')}`}>
      <div className="space-y-4">
        <MockBadge />
        <QueryState query={query} />

        {wm && (
          <>
            <div className="grid grid-cols-3 gap-2 rounded-3xl bg-white p-3 shadow-sm">
              {months.map((m) => {
                const active = HAZARDS.filter((h) => wm[h.key]?.includes(m))
                return (
                  <div key={m} className={`flex min-h-24 flex-col items-center gap-1 rounded-2xl border-2 p-2 ${m === NOW_MONTH ? 'border-brand-700 bg-brand-100' : 'border-gray-200'}`}>
                    <span className="text-sm font-bold capitalize text-brand-900">{name(m)}</span>
                    <div className="flex flex-1 flex-col items-center justify-center gap-1">
                      {active.length === 0 && <span className="text-xs text-ink-soft">{t('s12.calm')}</span>}
                      {active.map(({ key, Icon, cls }) => (
                        <span key={key} className={cls}>
                          <Icon size={24} aria-label={t(`s12.legend.${key}`)} />
                        </span>
                      ))}
                    </div>
                    {m === NOW_MONTH && <span className="text-xs font-bold text-brand-700">{t('s12.now')}</span>}
                  </div>
                )
              })}
            </div>

            <div className="space-y-2 rounded-3xl bg-white p-4 shadow-sm">
              {HAZARDS.map(({ key, Icon, cls }) => (
                <p key={key} className="flex items-center gap-3">
                  <Icon className={`shrink-0 ${cls}`} />
                  <span>
                    <b>{t(`s12.legend.${key}`)}:</b>{' '}
                    {wm[key]?.length ? wm[key].map((m) => name(m, 'long')).join(', ') : t('s12.none')}
                  </span>
                </p>
              ))}
            </div>
            <p className="rounded-2xl bg-brand-100 p-3 text-sm font-bold text-brand-900">{t('s12.pastNote')}</p>
          </>
        )}
      </div>
    </Screen>
  )
}
