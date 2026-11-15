import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Droplets } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import StatusMark from '../../components/StatusMark.jsx'
import Stars from '../../components/Stars.jsx'
import { CROPS } from '../../data/crops.js'
import { useFarm } from '../../state/FarmContext.jsx'
import { useRankedPlans } from '../S0-S8/S7Routes.jsx'
import NeedFarm from './NeedFarm.jsx'
import { Card, Disclaimer, WATER_LABEL, planWater } from './parts.jsx'

// S19 Compare routes (COULD): two plans side by side by picture. Route: /compare (opened from S7).
function Column({ plan, lang }) {
  const { t } = useTranslation()
  const water = planWater(plan)
  return (
    <Card className="min-w-0 space-y-3 !p-3">
      <h2 className="text-center text-base font-semibold leading-tight text-brand-900">{t(`s7.${plan.kind}`)}</h2>
      <div className="flex justify-center"><Stars value={plan.score} /></div>
      <div className="space-y-4">
        {plan.sequence.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-xs text-ink-soft">{t('s7.season', { n: i + 1 })}</span>
            <span className="text-4xl" aria-hidden>{CROPS[s.crop].emoji}</span>
            <span className="text-sm font-medium">{CROPS[s.crop][lang]}</span>
            <StatusMark status={plan.statuses[i]} size={22} label={t(`s7.legend.${plan.statuses[i]}`)} />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1 border-t border-gray-200 pt-3 text-center">
        <Droplets size={22} className="text-brand-700" aria-hidden />
        <StatusMark status={water} size={22} label={t(WATER_LABEL[water])} />
        <span className="text-sm">{t(WATER_LABEL[water])}</span>
      </div>
      <p className="border-t border-gray-200 pt-3 text-center text-sm text-ink-soft">{plan.reason[lang]}</p>
    </Card>
  )
}

export default function S19Compare() {
  const { t, i18n } = useTranslation()
  const { farm } = useFarm()
  const { plans, loading } = useRankedPlans()
  const [picked, setPicked] = useState([]) // ids; first two plans by default

  if (!farm) return <NeedFarm title={t('s19.title')} />
  if (loading) return <Screen title={t('s19.title')}><p className="py-16 text-center text-lg">⏳</p></Screen>

  const ids = picked.length === 2 ? picked : plans.slice(0, 2).map((p) => p.id)
  // Tapping a plan chip swaps it in; the older pick leaves.
  const toggle = (id) => setPicked(ids.includes(id) ? ids : [ids[1], id])

  return (
    <Screen title={t('s19.title')} speak={t('s19.speak')}>
      <div className="space-y-4">
        <p className="text-center text-base text-ink-soft">{t('s19.pick')}</p>
        <div className="flex gap-2" role="group" aria-label={t('s19.pick')}>
          {plans.map((p) => {
            const on = ids.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(p.id)}
                className={`tap flex-1 rounded-2xl px-2 py-2 text-sm font-semibold ${on ? 'bg-brand-900 text-white' : 'bg-white text-brand-900'}`}
              >
                {t(`s7.${p.kind}`)}
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {ids.map((id) => {
            const plan = plans.find((p) => p.id === id)
            return plan ? <Column key={id} plan={plan} lang={i18n.language} /> : null
          })}
        </div>
        <Disclaimer>{t('common.disclaimer')}</Disclaimer>
      </div>
    </Screen>
  )
}
