import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Screen from '../../components/Screen.jsx'
import ChoiceCard from '../../components/ChoiceCard.jsx'
import PrimaryButton from '../../components/PrimaryButton.jsx'
import { useSpeak } from '../../components/speech.js'
import { CROPS } from '../../data/crops.js'
import { useFarm } from '../../state/FarmContext.jsx'

// S4 Last crop (optional): tap one picture. None / I don't know. Skip allowed.
export default function S4LastCrop() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { farm, lastCrop, update } = useFarm()
  const nav = useNavigate()
  useSpeak(t('s4.question'), { auto: true })

  if (!farm) return <Navigate to="/" replace />

  const pick = (id) => {
    update({ lastCrop: id })
    nav('/priorities')
  }

  return (
    <Screen
      title={t('s4.title')}
      speak={t('s4.question')}
      footer={<PrimaryButton variant="outline" onClick={() => nav('/priorities')}>{t('common.skip')} →</PrimaryButton>}
    >
      <h2 className="mb-4 text-2xl font-semibold text-brand-900">{t('s4.question')}</h2>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(CROPS).map(([id, c]) => (
          <ChoiceCard key={id} size="sm" icon={c.emoji} label={c[lang]} selected={lastCrop === id} onClick={() => pick(id)} />
        ))}
      </div>
      <div className="mt-3">
        <ChoiceCard size="sm" icon="🤷" label={t('s4.none')} selected={lastCrop === 'none'} onClick={() => pick('none')} />
      </div>
    </Screen>
  )
}
