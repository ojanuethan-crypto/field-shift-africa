import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, ChevronRight, Download, Trash2, Volume2, VolumeX } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import { useFarm } from '../../state/FarmContext.jsx'
import { getTextSize, setTextSize } from './textSize.js'
import { Button, Card, Disclaimer } from './parts.jsx'

// S22 Settings (SHOULD): language, text size, voice, offline download, clear my data.
// Everything stays on this phone (localStorage). Language and mute live in the shared FarmContext.
function Choice({ on, onClick, children, label }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      className={`tap flex-1 rounded-2xl px-3 py-3 text-lg font-semibold ${on ? 'bg-brand-900 text-white' : 'bg-surface text-brand-900'}`}
    >
      {children}
    </button>
  )
}

export default function S22Settings() {
  const { t, i18n } = useTranslation()
  const { lang, muted, update, reset } = useFarm()
  const current = lang || i18n.language
  const [size, setSize] = useState(getTextSize)
  const [offline, setOffline] = useState('idle') // idle | busy | done | fail
  const [confirm, setConfirm] = useState(false)

  const pickSize = (s) => {
    setTextSize(s)
    setSize(s)
  }

  // TODO(F13): when the PWA service worker exists, precache the advice library and last plans here.
  const download = async () => {
    setOffline('busy')
    try {
      if (!('caches' in window)) throw new Error('no cache api')
      const cache = await caches.open('fs-offline-advice')
      await cache.add('/')
      setOffline('done')
    } catch {
      setOffline('fail')
    }
  }

  const clearAll = () => {
    reset() // journey state, farms, plans (keeps language and mute)
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('fs.') && k !== 'fs.textSize').forEach((k) => localStorage.removeItem(k))
    } catch { /* ignore */ }
    setConfirm(false)
  }

  return (
    <Screen title={t('s22.title')} speak={t('s22.speak')}>
      <div className="space-y-4">
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-900">{t('s22.language')}</h2>
          <div className="flex gap-2">
            <Choice on={current === 'fr'} onClick={() => update({ lang: 'fr' })}>Français</Choice>
            <Choice on={current === 'en'} onClick={() => update({ lang: 'en' })}>English</Choice>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-900">{t('s22.textSize')}</h2>
          <div className="flex items-end gap-2">
            <Choice on={size === 'normal'} onClick={() => pickSize('normal')} label={t('s22.sizeNormal')}>
              <span className="text-base">A</span>
            </Choice>
            <Choice on={size === 'large'} onClick={() => pickSize('large')} label={t('s22.sizeLarge')}>
              <span className="text-xl">A</span>
            </Choice>
            <Choice on={size === 'xlarge'} onClick={() => pickSize('xlarge')} label={t('s22.sizeXlarge')}>
              <span className="text-3xl">A</span>
            </Choice>
          </div>
        </Card>

        <Card className="space-y-3">
          <button
            type="button"
            role="switch"
            aria-checked={!muted}
            onClick={() => update({ muted: !muted })}
            className="tap flex w-full items-center gap-3 text-left"
          >
            {muted ? <VolumeX size={28} className="text-ink-soft" /> : <Volume2 size={28} className="text-brand-700" />}
            <span className="flex-1 text-lg font-semibold text-brand-900">{t('s22.voice')}</span>
            <span className={`flex h-9 w-16 items-center rounded-full p-1 ${muted ? 'bg-gray-300' : 'bg-brand-600'}`}>
              <span className={`h-7 w-7 rounded-full bg-white shadow transition-transform ${muted ? '' : 'translate-x-7'}`} />
            </span>
            <span className="w-10 text-sm font-semibold">{muted ? t('s22.off') : t('s22.on')}</span>
          </button>
          <Link to="/voice-pick" className="block">
            <Button variant="soft">{t('s22.chooseVoice')}<ChevronRight size={20} /></Button>
          </Link>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-900">{t('s22.offlineTitle')}</h2>
          <p className="text-sm text-ink-soft">{t('s22.offlineBody')}</p>
          <Button variant="soft" icon={offline === 'done' ? Check : Download} onClick={download} disabled={offline === 'busy'} aria-live="polite">
            {t(`s22.offline.${offline}`)}
          </Button>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-900">{t('s22.clearTitle')}</h2>
          <p className="text-sm text-ink-soft">{t('s22.clearBody')}</p>
          {!confirm ? (
            <Button variant="outline" icon={Trash2} onClick={() => setConfirm(true)}>{t('s22.clear')}</Button>
          ) : (
            <div role="alertdialog" aria-label={t('s22.sure')} className="space-y-3 rounded-2xl bg-surface p-3">
              <p className="text-base font-semibold">{t('s22.sure')}</p>
              <Button variant="danger" onClick={clearAll}>{t('s22.yesClear')}</Button>
              <Button variant="soft" onClick={() => setConfirm(false)}>{t('s22.cancel')}</Button>
            </div>
          )}
        </Card>
        <Disclaimer>{t('common.disclaimer')}</Disclaimer>
      </div>
    </Screen>
  )
}
