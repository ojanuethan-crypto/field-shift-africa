import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sprout } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import { speakText } from '../../components/speech.js'
import { useFarm } from '../../state/FarmContext.jsx'

// S0 Language + voice. Two huge buttons, spoken hello. Skipped on later visits (see S1 redirect).
export default function S0Language() {
  const { t, i18n } = useTranslation()
  const { update, muted } = useFarm()
  const nav = useNavigate()

  // Greet in the phone's language (may be blocked until first tap; the speaker button works anyway).
  useEffect(() => {
    if (!muted) speakText(i18n.t('s0.hello'), i18n.language)
    return () => window.speechSynthesis?.cancel()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (lang) => {
    i18n.changeLanguage(lang)
    update({ lang })
    nav('/', { replace: true })
  }

  return (
    <Screen speak={t('s0.hello')}>
      <div className="flex min-h-full flex-col items-center justify-center gap-6 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-brand-700 text-white shadow-lg">
          <Sprout size={52} />
        </span>
        <p className="max-w-xs text-xl font-medium">{t('s0.hello')}</p>

        <div className="grid w-full gap-4">
          <button type="button" onClick={() => choose('fr')}
            className="tap flex items-center justify-center gap-4 rounded-3xl bg-brand-700 py-8 text-3xl font-semibold text-white shadow-lg active:scale-[.98]">
            <span aria-hidden>🇫🇷</span> Français
          </button>
          <button type="button" onClick={() => choose('en')}
            className="tap flex items-center justify-center gap-4 rounded-3xl bg-white py-8 text-3xl font-semibold text-brand-900 shadow-lg ring-2 ring-brand-700 active:scale-[.98]">
            <span aria-hidden>🇬🇧</span> English
          </button>
        </div>

        <p className="text-sm text-ink-soft">{t('s0.later')}</p>
        <p className="text-sm text-ink-soft">{t('s0.privacy')}</p>
      </div>
    </Screen>
  )
}
