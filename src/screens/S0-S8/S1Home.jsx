import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Crosshair, Headset, Layers, LocateFixed, Lock, TriangleAlert } from 'lucide-react'
import Pic from '../../components/Pic.jsx'
import Screen from '../../components/Screen.jsx'
import BottomNav from '../../components/BottomNav.jsx'
import FarmMap from '../../components/FarmMap.jsx'
import PrimaryButton from '../../components/PrimaryButton.jsx'
import { useSpeak } from '../../components/speech.js'
import { SITES, placeName, round2 } from '../../data/sites.js'
import { useFarm } from '../../state/FarmContext.jsx'

// S1 Home = Map. Map of Africa, locate me, ask (mic), layers, bottom sheet "Where is your farm?"
export default function S1Home() {
  const { t, i18n } = useTranslation()
  const { lang, farm, voiceSet, update } = useFarm()
  const nav = useNavigate()
  const [pin, setPin] = useState(farm)
  const [status, setStatus] = useState('idle') // idle | locating | denied
  const [open, setOpen] = useState(true) // bottom sheet: tap or drag the handle to hide / show the options
  const dragY = useRef(null)
  const speakText = t('s1.where')
  useSpeak(speakText)

  // First run: voice question -> language -> map (the splash is handled globally in App.jsx)
  if (!lang) return <Navigate to={voiceSet ? '/language' : '/voice'} replace />

  const choose = (lat, lon) => {
    const la = round2(lat)
    const lo = round2(lon) // coordinates rounded before use or sending
    const p = { lat: la, lon: lo, name: placeName(la, lo, i18n.language) }
    setPin(p)
    update({ farm: p, lastCrop: null, priorities: [], canWater: null, canBuyFertilizer: null })
    setTimeout(() => nav('/confirm'), 450) // let the pin show before moving on
  }

  const locate = () => {
    if (!navigator.geolocation) return setStatus('denied')
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('idle')
        choose(pos.coords.latitude, pos.coords.longitude)
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }

  return (
    <Screen flush speak={speakText} footer={null}>
      <div className="flex h-full flex-col">
        <div className="relative flex-1">
          <FarmMap pin={pin} onPick={choose} flyZoom={7} />

          <div className="absolute right-3 top-20 z-[500] flex flex-col gap-3">
            <RoundBtn label={t('s1.locate')} onClick={locate}><LocateFixed size={24} /></RoundBtn>
            <RoundBtn label={t('s1.ask')} onClick={() => nav('/advisor')}><Pic name="advisor" fallback={<Headset size={24} />} size={30} /></RoundBtn>
            <RoundBtn label={t('s1.layers')} onClick={() => nav('/space')}><Layers size={24} /></RoundBtn>
          </div>

          <section className="absolute inset-x-0 bottom-0 z-[500] rounded-t-3xl bg-white px-4 pb-4 pt-1 shadow-[0_-6px_20px_rgba(0,0,0,0.15)]">
            {/* The handle really works: tap it, press Enter, or drag up / down to show or hide the options */}
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? t('s1.sheetClose') : t('s1.sheetOpen')}
              onPointerDown={(e) => {
                dragY.current = e.clientY
                e.currentTarget.setPointerCapture?.(e.pointerId)
              }}
              onPointerUp={(e) => {
                const dy = e.clientY - (dragY.current ?? e.clientY)
                dragY.current = null
                if (dy > 30) setOpen(false)
                else if (dy < -30) setOpen(true)
                else setOpen((o) => !o)
              }}
              onClick={(e) => { if (e.detail === 0) setOpen((o) => !o) }}
              className="block w-full touch-none pb-1 pt-2 text-left"
            >
              <span className="mx-auto mb-2 block h-1.5 w-12 rounded-full bg-gray-300" />
              <span className="flex items-center justify-between">
                <span className="text-xl font-semibold text-brand-900">{t('s1.where')}</span>
                {open ? <ChevronDown size={24} className="text-ink-soft" /> : <ChevronUp size={24} className="text-ink-soft" />}
              </span>
            </button>
            {open && (
              <>
                <PrimaryButton onClick={locate} disabled={status === 'locating'} className="mt-3 flex items-center justify-center gap-2">
                  <Crosshair size={22} />
                  {status === 'locating' ? t('s1.locating') : t('s1.useLocation')}
                </PrimaryButton>
                {status === 'denied' && (
                  <p role="alert" className="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-sm font-medium"><TriangleAlert size={16} className="mr-1 inline" /> {t('s1.denied')}</p>
                )}
                <p className="mb-2 mt-3 text-sm font-medium text-ink-soft">{t('s1.orPick')}</p>
                <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                  {SITES.map((s) => (
                    <button key={s.id} type="button" onClick={() => choose(s.lat, s.lon)}
                      className="tap flex shrink-0 flex-col items-center gap-1 rounded-2xl bg-brand-50 px-4 py-2 active:scale-95">
                      <Pic name={s.pic} emoji={s.icon} size={44} />
                      <span className="text-sm font-medium">{s.name[i18n.language]}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-soft"><Lock size={12} className="mr-1 inline" /> {t('s1.privacy')}</p>
              </>
            )}
          </section>
        </div>
        <BottomNav />
      </div>
    </Screen>
  )
}

function RoundBtn({ children, label, onClick }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}
      className="tap pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-white text-brand-900 shadow-lg active:scale-95">
      {children}
    </button>
  )
}
