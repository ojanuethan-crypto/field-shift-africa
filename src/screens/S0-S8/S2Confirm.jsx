import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Move } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import FarmMap from '../../components/FarmMap.jsx'
import PrimaryButton from '../../components/PrimaryButton.jsx'
import { useSpeak } from '../../components/speech.js'
import { placeName, round2 } from '../../data/sites.js'
import { useFarm } from '../../state/FarmContext.jsx'

// S2 Confirm my farm. Pin, place name, Yes / Move pin, optional name for saving.
export default function S2Confirm() {
  const { t, i18n } = useTranslation()
  const { farm, update } = useFarm()
  const nav = useNavigate()
  const [moving, setMoving] = useState(false)
  const [nickname, setNickname] = useState(farm?.nickname || '')
  useSpeak(t('s2.question'), { auto: true })

  if (!farm) return <Navigate to="/" replace />

  const move = (lat, lon) => {
    if (!moving) return
    const la = round2(lat)
    const lo = round2(lon)
    update({ farm: { ...farm, lat: la, lon: lo, name: placeName(la, lo, i18n.language) } })
    setMoving(false)
  }

  const confirm = () => {
    update({ farm: { ...farm, nickname: nickname.trim() || undefined } })
    nav('/land')
  }

  return (
    <Screen
      title={t('s2.title')}
      speak={t('s2.question')}
      flush
      footer={
        <div className="grid gap-2">
          <PrimaryButton onClick={confirm}>✓ {t('s2.yes')}</PrimaryButton>
          <PrimaryButton variant="outline" onClick={() => setMoving((m) => !m)}>
            <span className="inline-flex items-center justify-center gap-2"><Move size={20} /> {t('s2.move')}</span>
          </PrimaryButton>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div className="relative min-h-0 flex-1">
          <FarmMap center={[farm.lat, farm.lon]} zoom={9} pin={farm} onPick={move} flyZoom={9} />
          {moving && (
            <p className="absolute inset-x-4 top-3 z-[500] rounded-xl bg-amber-100 px-3 py-2 text-center text-sm font-medium shadow">
              👆 {t('s1.tapMap')}
            </p>
          )}
        </div>
        <div className="shrink-0 space-y-3 bg-white px-4 py-4">
          <p className="flex items-center gap-2 text-xl font-semibold text-brand-900">
            <MapPin className="text-brand-700" /> {farm.name}
          </p>
          <label className="block text-sm font-medium text-ink-soft">
            {t('s2.name')}
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('s2.namePlaceholder')}
              maxLength={40}
              className="mt-1 block w-full rounded-xl border-2 border-gray-200 px-3 py-3 text-base text-ink focus:border-brand-700 focus:outline-none"
            />
          </label>
        </div>
      </div>
    </Screen>
  )
}
