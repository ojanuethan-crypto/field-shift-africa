import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Screen from '../../components/Screen.jsx'
import ChoiceCard from '../../components/ChoiceCard.jsx'
import PrimaryButton from '../../components/PrimaryButton.jsx'
import { speakText, useSpeak } from '../../components/speech.js'
import { useFarm } from '../../state/FarmContext.jsx'

const CARDS = [
  { key: 'money', icon: '💰' },
  { key: 'water', icon: '💧' },
  { key: 'soil', icon: '🌱' },
  { key: 'safety', icon: '🛡️' },
]

// S5 What matters most? 4 big cards, tap up to 2, spoken confirmation. Maps to weights in data/scoring.js.
export default function S5Priorities() {
  const { t, i18n } = useTranslation()
  const { farm, priorities, update, muted } = useFarm()
  const nav = useNavigate()
  const [full, setFull] = useState(false)
  useSpeak(t('s5.question'), { auto: true })

  useEffect(() => {
    if (!full) return
    const id = setTimeout(() => setFull(false), 2500)
    return () => clearTimeout(id)
  }, [full])

  if (!farm) return <Navigate to="/" replace />

  const sentence = (list) =>
    list.length === 2
      ? t('s5.picked_two', { a: t(`s5.${list[0]}`), b: t(`s5.${list[1]}`) })
      : list.length === 1
        ? t('s5.picked_one', { a: t(`s5.${list[0]}`) })
        : ''

  const toggle = (key) => {
    let next
    if (priorities.includes(key)) next = priorities.filter((k) => k !== key)
    else if (priorities.length >= 2) return setFull(true)
    else next = [...priorities, key]
    update({ priorities: next })
    if (!muted && next.length) speakText(sentence(next), i18n.language) // spoken confirmation
  }

  return (
    <Screen
      title={t('s5.title')}
      speak={t('s5.question')}
      footer={
        <PrimaryButton disabled={priorities.length === 0} onClick={() => nav('/conditions')}>
          {t('common.continue')} →
        </PrimaryButton>
      }
    >
      <h2 className="mb-5 text-2xl font-semibold text-brand-900">{t('s5.question')}</h2>
      <div className="grid grid-cols-2 gap-4">
        {CARDS.map((c) => (
          <ChoiceCard key={c.key} icon={c.icon} label={t(`s5.${c.key}`)} selected={priorities.includes(c.key)} onClick={() => toggle(c.key)} />
        ))}
      </div>
      <p aria-live="polite" className="mt-5 min-h-[3rem] text-center text-lg font-medium text-brand-700">
        {full ? <span className="text-ink">⚠️ {t('s5.max')}</span> : sentence(priorities)}
      </p>
    </Screen>
  )
}
