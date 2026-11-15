import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Columns2, Star, Volume2, WifiOff } from 'lucide-react'
import { CropPic } from '../../components/Pic.jsx'
import Screen from '../../components/Screen.jsx'
import PrimaryButton from '../../components/PrimaryButton.jsx'
import StatusMark from '../../components/StatusMark.jsx'
import Stars from '../../components/Stars.jsx'
import { speakText, useSpeak } from '../../components/speech.js'
import { useRotations } from '../../api/hooks.js'
import MockBadge from '../S9-S17/components/MockBadge.jsx'
import { CROPS } from '../../data/crops.js'
import { rankPlans } from '../../data/scoring.js'
import { useFarm } from '../../state/FarmContext.jsx'
import { Friendly } from './S3Land.jsx'
import NeedFarm from '../S18-S26/NeedFarm.jsx'
import StateScreen from '../S18-S26/StateScreen.jsx'

export function useRankedPlans() {
  const { farm, priorities, canWater, canBuyFertilizer, lastCrop } = useFarm()
  const { i18n } = useTranslation()
  const [retry, setRetry] = useState(0)
  const { data, loading, error } = useRotations(
    farm,
    retry,
    { priorities, lastCrop, canWater, canBuyFertilizer },
    i18n.language.startsWith('fr') ? 'fr' : 'en',
  )
  const plans = useMemo(
    () => (Array.isArray(data) ? rankPlans(data, { priorities, canWater, lastCrop }) : []),
    [data, priorities, canWater, lastCrop],
  )
  // `state` = the place has no plans (desert / no data): the screens show the same friendly screen as S3
  return { plans, state: data?.state ?? null, loading, error, retry: () => setRetry((r) => r + 1) }
}

// S7 Routes: 3 plans (Safest / Soil-rebuilder / Money-first), best match first, tick/triangle/cross per season.
export default function S7Routes() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { farm, update, muted } = useFarm()
  const nav = useNavigate()
  const { plans, state, loading, error, retry } = useRankedPlans()
  useSpeak(t('s7.intro'), { auto: true })

  if (!farm) return <NeedFarm title={t('s7.title')} />

  const open = (p) => {
    update({ selectedPlanId: p.id })
    nav(`/routes/${p.id}`)
  }

  if (!loading && !error && state) return <StateScreen type={state} />
  if (loading) return <Screen title={t('s7.title')}><p className="py-16 text-center text-lg">⏳ {t('s7.loading')}</p></Screen>
  if (error)
    return (
      <Screen title={t('s7.title')} speak={t('s7.error')}>
        <Friendly icon={<WifiOff size={72} strokeWidth={1.5} className="text-brand-700" />} title={t('s7.error')}><PrimaryButton onClick={retry}>{t('s3.retry')}</PrimaryButton></Friendly>
      </Screen>
    )

  return (
    <Screen
      title={t('s7.title')}
      speak={t('s7.intro')}
      footer={
        <PrimaryButton variant="outline" onClick={() => nav('/compare')}>
          <span className="inline-flex items-center justify-center gap-2"><Columns2 size={20} /> {t('s7.compare')}</span>
        </PrimaryButton>
      }
    >
      <MockBadge />
      <p className="mb-4 text-lg font-medium text-brand-900">{t('s7.intro')}</p>

      <ul className="space-y-4">
        {plans.map((p, idx) => (
          <li key={p.id}>
            <article className={`relative overflow-hidden rounded-3xl bg-white shadow-sm ${idx === 0 ? 'ring-4 ring-brand-600' : ''}`}>
              {idx === 0 && (
                <div className="bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white"><span className="inline-flex items-center gap-1.5"><Star size={16} className="fill-white" /> {t('s7.best')}</span></div>
              )}
              <button type="button" onClick={() => open(p)} className="block w-full p-4 text-left active:bg-brand-50">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl font-semibold text-brand-900">{t(`s7.${p.kind}`)}</h2>
                  <Stars value={p.score} label={`${Math.round(p.score * 5)}/5`} />
                </div>

                <div className="mt-3 flex items-center gap-1">
                  {p.sequence.map((s, i) => (
                    <div key={i} className="flex flex-1 items-center">
                      <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-surface py-2">
                        <span className="text-xs font-medium text-ink-soft">{t('s7.season', { n: i + 1 })}</span>
                        <CropPic id={s.crop} size={48} />
                        <span className="text-sm font-medium">{CROPS[s.crop][lang]}</span>
                        <StatusMark status={p.statuses[i]} size={22} label={t(`s7.legend.${p.statuses[i]}`)} />
                      </div>
                      {i < p.sequence.length - 1 && <ChevronRight size={18} className="shrink-0 text-ink-soft" />}
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-base text-ink">{p.reason[lang]}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                  {t('s7.open')} <ChevronRight size={16} />
                </p>
              </button>
              <button
                type="button"
                aria-label={t('common.listen')}
                onClick={() => !muted && speakText(`${t(`s7.${p.kind}`)}. ${p.reason[lang]}`, lang)}
                className="tap absolute bottom-3 right-3 grid place-items-center rounded-full bg-brand-100 text-brand-700"
              >
                <Volume2 size={20} />
              </button>
            </article>
          </li>
        ))}
      </ul>

      <ul className="mt-5 flex justify-center gap-4 text-sm">
        {['good', 'warn', 'bad'].map((s) => (
          <li key={s} className="flex items-center gap-1.5"><StatusMark status={s} size={18} />{t(`s7.legend.${s}`)}</li>
        ))}
      </ul>
      <p className="mt-3 text-center text-xs text-ink-soft">{t('common.disclaimer')}</p>
    </Screen>
  )
}
