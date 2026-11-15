import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Cloud, CloudRain, Compass, Droplets, Footprints, Lightbulb, CloudSun, Share2, Sun, TriangleAlert } from 'lucide-react'
import { CropPic } from '../../components/Pic.jsx'
import Screen from '../../components/Screen.jsx'
import PrimaryButton from '../../components/PrimaryButton.jsx'
import StatusMark from '../../components/StatusMark.jsx'
import Stars from '../../components/Stars.jsx'
import { speakText, useSpeak } from '../../components/speech.js'
import { CROPS } from '../../data/crops.js'
import { useFarm } from '../../state/FarmContext.jsx'
import { useRankedPlans } from './S7Routes.jsx'
import { Friendly } from './S3Land.jsx'

const TABS = [
  { key: 'steps', Icon: Footprints },
  { key: 'water', Icon: Droplets },
  { key: 'whatif', Icon: CloudSun },
  { key: 'why', Icon: Lightbulb },
]
const YEARS = [
  { key: 'dry', Icon: Sun, idx: 0 },
  { key: 'normal', Icon: Cloud, idx: 1 },
  { key: 'wet', Icon: CloudRain, idx: 2 },
]
const WATER_STATUS = { enough: 'good', risky: 'warn', not_enough: 'bad' }
const WATER_LABEL = { enough: 'waterEnough', risky: 'waterRisky', not_enough: 'waterNot' }

// S8 Route detail with picture tabs: Steps / Water / What if (S13) / Why.
export default function S8RouteDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { farm, muted } = useFarm()
  const nav = useNavigate()
  const { plans, loading } = useRankedPlans()
  const [tab, setTab] = useState('steps')
  const [year, setYear] = useState('normal')

  const plan = plans.find((p) => p.id === id)
  const kindLabel = plan ? t(`s7.${plan.kind}`) : t('s8.title')
  useSpeak(plan ? `${kindLabel}. ${plan.reason[lang]}` : '', { auto: true })

  if (!farm) return <Navigate to="/" replace />
  if (loading) return <Screen title={t('s8.title')}><p className="py-16 text-center text-lg">⏳ {t('s7.loading')}</p></Screen>
  if (!plan)
    return (
      <Screen title={t('s8.title')} speak={t('s8.notFound')}>
        <Friendly icon={<Compass size={72} strokeWidth={1.5} className="text-brand-700" />} title={t('s8.notFound')}>
          <PrimaryButton onClick={() => nav('/routes')}>{t('s8.backToRoutes')}</PrimaryButton>
        </Friendly>
      </Screen>
    )

  const month = (m) => new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2026, m - 1, 1))
  const yIdx = YEARS.find((y) => y.key === year).idx
  const crop = (s) => CROPS[s.crop][lang]
  const stepText = (s) => t('s8.plantIn', { crop: crop(s), month: month(s.month) })

  const onWhatIf = (k) => {
    setYear(k)
    if (!muted) speakText(`${t(`s8.year.${k}`)}. ${t('s8.scoreLabel')}: ${Math.round(plan.scen[k] * 5)} / 5`, lang)
  }

  return (
    <Screen
      title={kindLabel}
      speak={`${kindLabel}. ${plan.reason[lang]}`}
      footer={
        <PrimaryButton onClick={() => nav(`/share/${plan.id}`)}>
          <span className="inline-flex items-center justify-center gap-2"><Share2 size={22} /> {t('s8.share')}</span>
        </PrimaryButton>
      }
    >
      <div role="tablist" className="mb-4 grid grid-cols-4 gap-2">
        {TABS.map(({ key, Icon }) => (
          <button key={key} role="tab" aria-selected={tab === key} type="button" onClick={() => setTab(key)}
            className={`tap flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-xs font-semibold transition ${
              tab === key ? 'bg-brand-700 text-white shadow' : 'bg-white text-brand-900'
            }`}>
            <Icon size={26} />
            {t(`s8.tabs.${key}`)}
          </button>
        ))}
      </div>

      {tab === 'steps' && (
        <ol className="space-y-3">
          {plan.sequence.map((s, i) => (
            <li key={i} className={`rounded-3xl p-4 shadow-sm ${i === 0 ? 'bg-brand-900 text-white' : 'bg-white'}`}>
              <p className={`text-sm font-semibold ${i === 0 ? 'text-amber-accent' : 'text-brand-700'}`}>
                {i === 0 ? `${t('s8.next')} →` : t('s8.then')} · {t('s7.season', { n: i + 1 })}
              </p>
              <div className="mt-2 flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white">
                  <CropPic id={s.crop} size={52} />
                </span>
                <p className="flex-1 text-xl font-semibold leading-snug">{stepText(s)}</p>
                <StatusMark status={plan.statuses[i]} size={28} label={t(`s7.legend.${plan.statuses[i]}`)} />
              </div>
              {i === 0 && <p className="mt-3 text-base opacity-90">{plan.reason[lang]}</p>}
            </li>
          ))}
        </ol>
      )}

      {tab === 'water' && (
        <ul className="space-y-3">
          {plan.sequence.map((s, i) => {
            const w = s.water[1]
            return (
              <li key={i} className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="flex items-center gap-3 text-lg font-semibold">
                  <CropPic id={s.crop} size={40} />{crop(s)}
                </p>
                <WaterMeter level={w} />
                <p className="mt-2 flex items-center gap-2 font-medium">
                  <StatusMark status={WATER_STATUS[w]} size={22} /> {t(`s8.${WATER_LABEL[w]}`)}
                </p>
              </li>
            )
          })}
        </ul>
      )}

      {tab === 'whatif' && (
        <div>
          <p className="mb-3 text-lg font-medium text-brand-900">{t('s8.whatifIntro')}</p>
          <div className="grid grid-cols-3 gap-3">
            {YEARS.map(({ key, Icon }) => (
              <button key={key} type="button" aria-pressed={year === key} onClick={() => onWhatIf(key)}
                className={`tap flex flex-col items-center gap-1 rounded-3xl border-2 py-4 font-semibold transition ${
                  year === key ? 'border-brand-700 bg-brand-50' : 'border-transparent bg-white'
                }`}>
                <Icon size={40} className={key === 'dry' ? 'text-amber-accent' : key === 'wet' ? 'text-sky-600' : 'text-ink-soft'} />
                <span className="text-sm">{t(`s8.year.${key}`)}</span>
              </button>
            ))}
          </div>

          <section aria-live="polite" className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-ink-soft">{t('s8.scoreLabel')}</p>
            <div className="mt-1 flex items-center gap-3">
              <Stars value={plan.scen[year]} label={`${Math.round(plan.scen[year] * 5)}/5`} />
              <StatusMark status={plan.scen[year] >= 0.7 ? 'good' : plan.scen[year] >= 0.5 ? 'warn' : 'bad'} size={26} />
            </div>
            <ul className="mt-3 space-y-2">
              {plan.sequence.map((s, i) => {
                const w = s.water[yIdx]
                return (
                  <li key={i} className="flex items-center gap-3">
                    <CropPic id={s.crop} size={32} />
                    <span className="flex-1 font-medium">{crop(s)}</span>
                    <StatusMark status={WATER_STATUS[w]} size={22} />
                    <span className="text-sm text-ink-soft">{t(`s8.${WATER_LABEL[w]}`)}</span>
                  </li>
                )
              })}
            </ul>
            {plan.scen[year] < 0.6 && plan.warnings[0] && (
              <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-sm font-medium"><TriangleAlert size={16} className="mr-1 inline" /> {plan.warnings[0][lang]}</p>
            )}
          </section>
        </div>
      )}

      {tab === 'why' && (
        <div className="space-y-4">
          <section className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-brand-900"><Lightbulb size={20} className="mr-1 inline text-amber-accent" /> {t('s8.whyTitle')}</h2>
            <ul className="space-y-2">
              {plan.why.map((w, i) => (
                <li key={i} className="flex gap-2 text-base"><StatusMark status="good" size={20} />{w[lang]}</li>
              ))}
            </ul>
          </section>
          {plan.warnings.length > 0 && (
            <section className="rounded-3xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-brand-900"><TriangleAlert size={16} className="mr-1 inline" /> {t('s8.warningsTitle')}</h2>
              <ul className="space-y-2">
                {plan.warnings.map((w, i) => (
                  <li key={i} className="flex gap-2 text-base"><StatusMark status="warn" size={20} />{w[lang]}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <p className="mt-5 text-center text-xs text-ink-soft">{t('common.disclaimer')}</p>
    </Screen>
  )
}

// Water meter: 3 segments, filled by level. Shape + label back up the colour.
function WaterMeter({ level }) {
  const n = level === 'enough' ? 3 : level === 'risky' ? 2 : 1
  const color = level === 'enough' ? 'bg-sky-500' : level === 'risky' ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="mt-3 flex items-center gap-1" role="img" aria-label={level}>
      <Droplets size={22} className="mr-1 text-sky-600" />
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-5 flex-1 rounded-full ${i <= n ? color : 'bg-gray-200'}`} />
      ))}
    </div>
  )
}
