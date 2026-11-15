import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import Pic from '../../components/Pic.jsx'
import ChoiceCard from '../../components/ChoiceCard.jsx'
import PrimaryButton from '../../components/PrimaryButton.jsx'
import { speakText, useSpeak } from '../../components/speech.js'
import { useFarm } from '../../state/FarmContext.jsx'

// S6 Two quick yes/no questions with icons.
export default function S6Conditions() {
  const { t, i18n } = useTranslation()
  const { farm, canWater, canBuyFertilizer, update, muted } = useFarm()
  const nav = useNavigate()
  useSpeak(`${t('s6.water')} ${t('s6.fertilizer')}`, { auto: true })

  if (!farm) return <Navigate to="/" replace />

  const say = (q) => !muted && speakText(q, i18n.language)

  return (
    <Screen
      title={t('s6.title')}
      speak={`${t('s6.water')} ${t('s6.fertilizer')}`}
      footer={
        <PrimaryButton disabled={canWater === null || canBuyFertilizer === null} onClick={() => nav('/routes')}>
          {t('s6.see')} →
        </PrimaryButton>
      }
    >
      <div className="space-y-6 pt-8">
        <Question icon={<Pic name="cond-water" emoji="🚿" size={56} />} text={t('s6.water')} value={canWater}
          onChange={(v) => { update({ canWater: v }); say(t('s6.water')) }} />
        <Question icon={<Pic name="cond-fertilizer" emoji="🧪" size={56} />} text={t('s6.fertilizer')} value={canBuyFertilizer}
          onChange={(v) => { update({ canBuyFertilizer: v }); say(t('s6.fertilizer')) }} />
      </div>
    </Screen>
  )
}

function Question({ icon, text, value, onChange }) {
  const { t } = useTranslation()
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-3 text-xl font-semibold text-brand-900">
        <span aria-hidden>{icon}</span>{text}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <ChoiceCard size="sm" icon={<ThumbsUp size={34} strokeWidth={1.5} className="text-green-700" />} label={t('common.yes')} selected={value === true} onClick={() => onChange(true)} />
        <ChoiceCard size="sm" icon={<ThumbsDown size={34} strokeWidth={1.5} className="text-red-700" />} label={t('common.no')} selected={value === false} onClick={() => onChange(false)} />
      </div>
    </section>
  )
}
