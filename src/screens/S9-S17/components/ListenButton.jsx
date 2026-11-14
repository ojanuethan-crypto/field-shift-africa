import { Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { speakText } from '../../../components/speech.js'

// Small speaker button for a card (shared voice engine). The screen-level speaker is <Screen speak=...>.
export default function ListenButton({ text }) {
  const { t, i18n } = useTranslation()
  return (
    <button
      type="button"
      onClick={() => speakText(text, i18n.language)}
      aria-label={t('common.listen')}
      className="tap grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-600 text-white"
    >
      <Volume2 size={24} />
    </button>
  )
}
