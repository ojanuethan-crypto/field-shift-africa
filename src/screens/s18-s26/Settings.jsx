import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Trash2, Volume2, VolumeX, Check } from 'lucide-react'
import ScreenHeader from '../../components/ScreenHeader'
import { Card, Button, Disclaimer } from '../../components/ui'
import { useSettings, clearMyData } from '../../lib/settings'

/* S22 Settings (SHOULD): language, text size, voice, offline download, clear my data.
   Everything is stored on this phone only (localStorage "fs.*"). */
function Choice({ on, onClick, children, label }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      className={`min-h-14 flex-1 rounded-2xl px-3 text-lg font-bold ${on ? 'bg-primary text-white' : 'bg-surface text-primary'}`}
    >
      {children}
    </button>
  )
}

export default function Settings() {
  const { t } = useTranslation()
  const [s, set] = useSettings()
  const [offline, setOffline] = useState('idle') // idle | busy | done | fail
  const [confirm, setConfirm] = useState(false)

  // TODO(F13): when the PWA service worker exists, precache the advice library + last plans here.
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

  return (
    <main>
      <ScreenHeader title={t('settings.title')} speak={t('settings.speak')} />
      <div className="space-y-4 px-4">
        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-primary">{t('settings.language')}</h2>
          <div className="flex gap-2">
            <Choice on={s.lang === 'fr'} onClick={() => set({ lang: 'fr' })}>Français</Choice>
            <Choice on={s.lang === 'en'} onClick={() => set({ lang: 'en' })}>English</Choice>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-primary">{t('settings.textSize')}</h2>
          <div className="flex items-end gap-2">
            <Choice on={s.textSize === 'normal'} onClick={() => set({ textSize: 'normal' })} label={t('settings.sizeNormal')}>
              <span className="text-base">A</span>
            </Choice>
            <Choice on={s.textSize === 'large'} onClick={() => set({ textSize: 'large' })} label={t('settings.sizeLarge')}>
              <span className="text-xl">A</span>
            </Choice>
            <Choice on={s.textSize === 'xlarge'} onClick={() => set({ textSize: 'xlarge' })} label={t('settings.sizeXlarge')}>
              <span className="text-3xl">A</span>
            </Choice>
          </div>
        </Card>

        <Card>
          <button
            type="button"
            role="switch"
            aria-checked={s.voice}
            onClick={() => set({ voice: !s.voice })}
            className="flex min-h-14 w-full items-center gap-3 text-left"
          >
            {s.voice ? <Volume2 size={28} className="text-accent" /> : <VolumeX size={28} className="text-muted" />}
            <span className="flex-1 text-lg font-bold text-primary">{t('settings.voice')}</span>
            <span className={`flex h-9 w-16 items-center rounded-full p-1 ${s.voice ? 'bg-brand' : 'bg-line'}`}>
              <span className={`h-7 w-7 rounded-full bg-white shadow transition-transform ${s.voice ? 'translate-x-7' : ''}`} />
            </span>
            <span className="w-10 text-sm font-semibold">{s.voice ? t('settings.on') : t('settings.off')}</span>
          </button>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-primary">{t('settings.offlineTitle')}</h2>
          <p className="text-sm text-muted">{t('settings.offlineBody')}</p>
          <Button variant="soft" icon={offline === 'done' ? Check : Download} onClick={download} disabled={offline === 'busy'} aria-live="polite">
            {t(`settings.offline.${offline}`)}
          </Button>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-primary">{t('settings.clearTitle')}</h2>
          <p className="text-sm text-muted">{t('settings.clearBody')}</p>
          {!confirm ? (
            <Button variant="outline" icon={Trash2} onClick={() => setConfirm(true)}>{t('settings.clear')}</Button>
          ) : (
            <div role="alertdialog" aria-label={t('settings.sure')} className="space-y-3 rounded-2xl bg-surface p-3">
              <p className="text-base font-semibold">{t('settings.sure')}</p>
              <Button
                className="!bg-danger"
                onClick={() => {
                  clearMyData()
                  setConfirm(false)
                }}
              >
                {t('settings.yesClear')}
              </Button>
              <Button variant="soft" onClick={() => setConfirm(false)}>{t('settings.cancel')}</Button>
            </div>
          )}
        </Card>
        <Disclaimer>{t('common.disclaimer')}</Disclaimer>
      </div>
    </main>
  )
}
