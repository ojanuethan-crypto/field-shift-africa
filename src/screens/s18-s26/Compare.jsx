import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Droplets } from 'lucide-react'
import ScreenHeader from '../../components/ScreenHeader'
import { Card, Stars, Disclaimer, StatusIcon } from '../../components/ui'
import { PLANS, getPlan } from '../../mock/plans'

/* S19 Compare routes (COULD): two plans side by side, by picture. */
const WATER = { enough: 'ok', risky: 'warn', notEnough: 'bad' }

function Column({ plan }) {
  const { t } = useTranslation()
  return (
    <Card className="min-w-0 space-y-3 !p-3">
      <h2 className="text-center text-base font-bold leading-tight">{t(`plans.${plan.id}.name`)}</h2>
      <div className="flex justify-center"><Stars value={plan.stars} /></div>
      <div className="space-y-4">
        {plan.sequence.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-xs text-muted">{t('plans.season', { n: i + 1 })}</span>
            <span className="text-4xl" aria-hidden>{s.emoji}</span>
            <span className="text-sm font-medium">{t(`crops.${s.crop}`)}</span>
            <StatusIcon status={s.status} label={t(`plans.status.${s.status}`)} />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1 border-t border-line pt-3 text-center">
        <Droplets size={22} className="text-accent" aria-hidden />
        <StatusIcon status={WATER[plan.water]} label={t(`plans.water.${plan.water}`)} />
        <span className="text-sm">{t(`plans.water.${plan.water}`)}</span>
      </div>
      <p className="border-t border-line pt-3 text-center text-sm text-muted">{t(`plans.${plan.id}.why`)}</p>
    </Card>
  )
}

export default function Compare() {
  const { t } = useTranslation()
  const [ids, setIds] = useState(['safest', 'money'])

  // Tap a plan chip to swap it into the left or right column (oldest pick leaves).
  const toggle = (id) =>
    setIds((cur) => (cur.includes(id) ? cur : [cur[1], id]))

  return (
    <main>
      <ScreenHeader title={t('compare.title')} speak={t('compare.speak')} />
      <div className="space-y-4 px-4">
        <p className="text-center text-base text-muted">{t('compare.pick')}</p>
        <div className="flex gap-2" role="group" aria-label={t('compare.pick')}>
          {PLANS.map((p) => {
            const on = ids.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(p.id)}
                className={`min-h-12 flex-1 rounded-2xl px-2 text-sm font-semibold ${
                  on ? 'bg-primary text-white' : 'bg-white text-primary'
                }`}
              >
                {t(`plans.${p.id}.name`)}
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {ids.map((id) => (
            <Column key={id} plan={getPlan(id)} />
          ))}
        </div>
        <Disclaimer>{t('common.disclaimer')}</Disclaimer>
      </div>
    </main>
  )
}
