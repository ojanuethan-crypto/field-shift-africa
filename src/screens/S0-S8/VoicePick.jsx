import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Volume2 } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import PrimaryButton from '../../components/PrimaryButton.jsx'
import { VOICES, speakText } from '../../components/speech.js'
import { useFarm } from '../../state/FarmContext.jsx'

// Intro 3/3: "Choose a voice": 2 feminine (Iris, Jarvis) + 2 masculine (Marc, Clark). Tap to hear and select.
export default function VoicePick() {
  const { i18n } = useTranslation()
  const { voice, update } = useFarm()
  const nav = useNavigate()
  const fr = i18n.getFixedT('fr')
  const en = i18n.getFixedT('en')
  const phoneLang = i18n.language.startsWith('fr') ? 'fr' : 'en'

  const pick = (v) => {
    update({ voice: v.id })
    speakText(i18n.getFixedT(phoneLang)('intro.sample', { name: v.name }), phoneLang, v.id)
  }

  const group = (gender) => (
    <section>
      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-ink-soft">
        {fr(`intro.${gender === 'f' ? 'feminine' : 'masculine'}`)} · {en(`intro.${gender === 'f' ? 'feminine' : 'masculine'}`)}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {VOICES.filter((v) => v.gender === gender).map((v) => (
          <button key={v.id} type="button" aria-pressed={voice === v.id} onClick={() => pick(v)}
            className={`tap flex flex-col items-center gap-1 rounded-3xl border-2 bg-white py-5 shadow-sm transition active:scale-[.97] ${
              voice === v.id ? 'border-brand-700 bg-brand-50' : 'border-transparent'
            }`}>
            <span className="text-4xl" aria-hidden>{gender === 'f' ? '👩' : '👨'}</span>
            <span className="text-lg font-medium text-ink">{v.name}</span>
            <Volume2 size={18} className="text-brand-600" strokeWidth={1.8} />
          </button>
        ))}
      </div>
    </section>
  )

  return (
    <Screen footer={<PrimaryButton onClick={() => nav('/language')}>{fr('common.continue')} / {en('common.continue')} →</PrimaryButton>}>
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-semibold text-brand-900">{fr('intro.pickVoice')}</h1>
          <p className="text-xl text-ink-soft">{en('intro.pickVoice')}</p>
        </div>
        {group('f')}
        {group('m')}
        <p className="text-center text-sm text-ink-soft">
          {fr('intro.voiceNote')}
          <br />
          {en('intro.voiceNote')}
        </p>
      </div>
    </Screen>
  )
}
