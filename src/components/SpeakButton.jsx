import { Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../lib/settings'

/* Speaker button (design rule 3 / F11). Uses phone text-to-speech for any text.
   Pre-recorded audio for fixed lines can replace this later: pass `src`. */
export default function SpeakButton({ text, src, className = '', tone = 'light' }) {
  const { t, i18n } = useTranslation()
  const [{ voice }] = useSettings()
  if (!voice) return null

  const play = () => {
    if (src) return new Audio(src).play().catch(() => {})
    if (!('speechSynthesis' in window) || !text) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = i18n.language === 'fr' ? 'fr-FR' : 'en-GB'
    window.speechSynthesis.speak(u)
  }

  const colors = tone === 'dark' ? 'bg-white/15 text-white' : 'bg-white text-primary'
  return (
    <button
      type="button"
      onClick={play}
      aria-label={t('common.listen')}
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${colors} shadow-sm ${className}`}
    >
      <Volume2 size={24} />
    </button>
  )
}
