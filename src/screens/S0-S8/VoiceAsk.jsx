import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Volume2, VolumeX } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import { useFarm } from '../../state/FarmContext.jsx'

// Intro 2/3: "Continue with voice?" Shown in both languages because none is chosen yet.
export default function VoiceAsk() {
  const { i18n } = useTranslation()
  const { update } = useFarm()
  const nav = useNavigate()
  const fr = i18n.getFixedT('fr')
  const en = i18n.getFixedT('en')

  const answer = (voiceOn) => {
    update({ muted: !voiceOn, voiceSet: true })
    nav(voiceOn ? '/voice-pick' : '/language')
  }

  return (
    <Screen bare>
      <div className="flex min-h-full flex-col items-center justify-center gap-8 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-brand-700 text-white shadow-lg">
          <Volume2 size={48} strokeWidth={1.8} />
        </span>
        <div>
          <h1 className="text-3xl font-semibold text-brand-900">{fr('intro.voiceAsk')}</h1>
          <p className="mt-1 text-xl text-ink-soft">{en('intro.voiceAsk')}</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-4">
          <button type="button" onClick={() => answer(true)}
            className="tap flex flex-col items-center gap-2 rounded-3xl bg-brand-700 py-6 text-white shadow-lg active:scale-[.98]">
            <Volume2 size={34} strokeWidth={1.8} />
            <span className="text-xl font-medium">{fr('common.yes')} / {en('common.yes')}</span>
          </button>
          <button type="button" onClick={() => answer(false)}
            className="tap flex flex-col items-center gap-2 rounded-3xl bg-white py-6 text-brand-900 shadow-lg ring-2 ring-brand-700 active:scale-[.98]">
            <VolumeX size={34} strokeWidth={1.8} />
            <span className="text-xl font-medium">{fr('common.no')} / {en('common.no')}</span>
          </button>
        </div>

        <p className="max-w-xs text-sm text-ink-soft">
          {fr('intro.voiceNote')}
          <br />
          {en('intro.voiceNote')}
        </p>
      </div>
    </Screen>
  )
}
