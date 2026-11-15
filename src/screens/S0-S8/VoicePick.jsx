import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Volume2 } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import Pic from '../../components/Pic.jsx'
import PrimaryButton from '../../components/PrimaryButton.jsx'
import { VOICES, speakText } from '../../components/speech.js'
import { useFarm } from '../../state/FarmContext.jsx'

// "Choose a voice": 2 feminine (Iris, Jarvis) + 2 masculine (Marc, Clark). Tap to hear and select.
// Two modes:
//  - first run (no language chosen yet): bilingual, and Continue goes on to the language screen;
//  - opened from Settings (language already chosen): one language, picking a voice also turns the
//    voice on, and Done goes back to Settings (no onboarding flow).
export default function VoicePick() {
  const { t, i18n } = useTranslation()
  const { voice, lang, update } = useFarm()
  const nav = useNavigate()
  const fromSettings = !!lang
  const fr = i18n.getFixedT('fr')
  const en = i18n.getFixedT('en')
  const phoneLang = i18n.language.startsWith('fr') ? 'fr' : 'en'

  const pick = (v) => {
    update(fromSettings ? { voice: v.id, muted: false } : { voice: v.id })
    speakText(i18n.getFixedT(phoneLang)('intro.sample', { name: v.name }), phoneLang, v.id)
  }

  const groupTitle = (gender) => {
    const key = `intro.${gender === 'f' ? 'feminine' : 'masculine'}`
    return fromSettings ? t(key) : `${fr(key)} · ${en(key)}`
  }

  const group = (gender) => (
    <section>
      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-ink-soft">{groupTitle(gender)}</h2>
      <div className="grid grid-cols-2 gap-3">
        {VOICES.filter((v) => v.gender === gender).map((v) => (
          <button key={v.id} type="button" aria-pressed={voice === v.id} onClick={() => pick(v)}
            className={`tap flex flex-col items-center gap-1 rounded-3xl border-2 bg-white py-5 shadow-sm transition active:scale-[.97] ${
              voice === v.id ? 'border-brand-700 bg-brand-50' : 'border-transparent'
            }`}>
            <Pic name={`voice-${v.id}`} emoji={gender === 'f' ? '👩' : '👨'} size={64} />
            <span className="text-lg font-medium text-ink">{v.name}</span>
            <Volume2 size={18} className="text-brand-600" strokeWidth={1.8} />
          </button>
        ))}
      </div>
    </section>
  )

  const footer = fromSettings ? (
    <PrimaryButton onClick={() => nav('/settings')}>{t('common.done')}</PrimaryButton>
  ) : (
    <PrimaryButton onClick={() => nav('/language')}>{fr('common.continue')} / {en('common.continue')} →</PrimaryButton>
  )

  return (
    <Screen footer={footer}>
      <div className="space-y-5">
        {fromSettings ? (
          <h1 className="text-3xl font-semibold text-brand-900">{t('intro.pickVoice')}</h1>
        ) : (
          <div>
            <h1 className="text-3xl font-semibold text-brand-900">{fr('intro.pickVoice')}</h1>
            <p className="text-xl text-ink-soft">{en('intro.pickVoice')}</p>
          </div>
        )}
        {group('f')}
        {group('m')}
        {!fromSettings && (
          <p className="text-center text-sm text-ink-soft">
            {fr('intro.voiceNote')}
            <br />
            {en('intro.voiceNote')}
          </p>
        )}
      </div>
    </Screen>
  )
}
