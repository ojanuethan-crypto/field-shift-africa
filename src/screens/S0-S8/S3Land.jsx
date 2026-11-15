import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Database, Globe, Globe2, Mountain, Sun, Thermometer, Waves, WifiOff } from 'lucide-react'
import Pic from '../../components/Pic.jsx'
import Screen from '../../components/Screen.jsx'
import PrimaryButton from '../../components/PrimaryButton.jsx'
import StatusMark from '../../components/StatusMark.jsx'
import { useSpeak } from '../../components/speech.js'
import { useProfile } from '../../api/hooks.js'
import StateScreen from '../S18-S26/StateScreen.jsx'
import { USE_MOCK } from '../../api/config.js'
import { useFarm } from '../../state/FarmContext.jsx'

const HAZARDS = [
  { key: 'drought', Icon: Sun },
  { key: 'flood', Icon: Waves },
  { key: 'heat', Icon: Thermometer },
  { key: 'erosion', Icon: Mountain },
]
// level 1-2 good (tick), 3 careful (triangle), 4-5 risky (cross): never colour alone
const levelStatus = (n) => (n <= 2 ? 'good' : n === 3 ? 'warn' : 'bad')

// S3 Your land: zone, 4 hazard pictograms, rain bars, soil sentence, links, Continue.
export default function S3Land() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { farm } = useFarm()
  const nav = useNavigate()
  const [retry, setRetry] = useState(0)
  const { data, loading, error } = useProfile(farm, retry, lang)

  const speakText = data?.zone ? `${data.zone.name[lang]}. ${data.soil[lang]}` : t('s3.title')
  useSpeak(speakText)

  if (!farm) return <Navigate to="/" replace />

  if (loading) return <Screen title={t('s3.title')}><Skeleton /></Screen>

  if (error)
    return (
      <Screen title={t('s3.title')} speak={t('s3.error')}>
        <Friendly icon={<WifiOff size={72} strokeWidth={1.5} className="text-brand-700" />} title={t('s3.error')}>
          <PrimaryButton onClick={() => setRetry((r) => r + 1)}>{t('s3.retry')}</PrimaryButton>
        </Friendly>
      </Screen>
    )

  if (data?.state) return <StateScreen type={data.state} />

  if (data?.outside)
    return (
      <Screen title={t('s3.title')} speak={t('s3.outsideTitle')}>
        <Friendly icon={<Globe size={72} strokeWidth={1.5} className="text-brand-700" />} title={t('s3.outsideTitle')} body={t('s3.outsideBody')}>
          <PrimaryButton onClick={() => nav('/')}>{t('s3.pickAgain')}</PrimaryButton>
        </Friendly>
      </Screen>
    )

  const maxRain = Math.max(...data.rain_p50, 1)
  const months = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(lang, { month: 'narrow' }).format(new Date(2026, i, 1)),
  )

  return (
    <Screen
      title={t('s3.title')}
      speak={speakText}
      footer={<PrimaryButton onClick={() => nav('/last-crop')}>{t('common.continue')} →</PrimaryButton>}
    >
      <div className="space-y-4 pb-2">
        <section className="flex items-center gap-4 rounded-3xl bg-brand-900 p-4 text-white shadow">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white">
            <Pic name={data.zone.pic} emoji={data.zone.icon} size={64} />
          </span>
          <div>
            <p className="text-sm opacity-80">{farm.nickname || farm.name}</p>
            <h2 className="text-2xl font-semibold leading-tight">{data.zone.name[lang]}</h2>
            <p className="text-base opacity-90">{data.description[lang]}</p>
          </div>
        </section>

        <Card title={t('s3.hazards')}>
          <ul className="grid grid-cols-2 gap-3">
            {HAZARDS.map(({ key, Icon }) => {
              const n = data.hazards[key]
              return (
                <li key={key} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-brand-900 shadow-sm">
                    <Icon size={26} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">{t(`s3.${key}`)}</p>
                    <p className="flex items-center gap-1.5 text-sm text-ink-soft">
                      <StatusMark status={levelStatus(n)} size={18} label={t('s3.level', { n })} />
                      {n}/5
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card title={t('s3.rain')}>
          <div className="flex h-28 items-end gap-1" role="img" aria-label={t('s3.rain')}>
            {data.rain_p50.map((v, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-md bg-sky-500" style={{ height: `${Math.max(4, (v / maxRain) * 100)}%` }} />
                </div>
                <span className="text-[11px] text-ink-soft">{months[i]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('s3.soil')}>
          <p className="flex items-center gap-3 text-lg"><Pic name="priority-soil" emoji="🌱" size={40} />{data.soil[lang]}</p>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          <Link3 Icon={Globe2} label={t('s3.twins')} onClick={() => nav('/twins')} />
          <Link3 Icon={CalendarDays} label={t('s3.months')} onClick={() => nav('/months')} />
          <Link3 Icon={Database} label={t('s3.passport')} onClick={() => nav('/passport')} />
        </div>

        {USE_MOCK && <p className="text-center text-xs text-ink-soft">{t('s3.mockNote')}</p>}
        <p className="text-center text-xs text-ink-soft">{t('common.disclaimer')}</p>
      </div>
    </Screen>
  )
}

const Card = ({ title, children }) => (
  <section className="rounded-3xl bg-white p-4 shadow-sm">
    <h3 className="mb-3 text-base font-semibold text-brand-900">{title}</h3>
    {children}
  </section>
)

const Link3 = ({ Icon, label, onClick }) => (
  <button type="button" onClick={onClick}
    className="tap flex flex-col items-center gap-1 rounded-2xl bg-white p-3 text-center text-xs font-medium text-brand-900 shadow-sm active:scale-95">
    <Icon size={24} className="text-brand-700" />
    {label}
  </button>
)

export function Friendly({ icon, title, body, children }) {
  return (
    <div className="flex min-h-[60%] flex-col items-center justify-center gap-4 text-center">
      <div aria-hidden>{typeof icon === 'string' ? <span className="text-7xl">{icon}</span> : icon}</div>
      <h2 className="text-xl font-semibold">{title}</h2>
      {body && <p className="max-w-xs text-ink-soft">{body}</p>}
      <div className="w-full max-w-xs">{children}</div>
    </div>
  )
}

const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-28 rounded-3xl bg-gray-200" />
    <div className="h-40 rounded-3xl bg-gray-200" />
    <div className="h-32 rounded-3xl bg-gray-200" />
  </div>
)
