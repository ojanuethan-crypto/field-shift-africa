import { useTranslation } from 'react-i18next'

export default function LangSwitch() {
  const { i18n } = useTranslation()
  const next = i18n.language.startsWith('fr') ? 'en' : 'fr'
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      className="h-12 rounded-full border-2 border-white px-4 font-bold uppercase text-white"
    >
      {next}
    </button>
  )
}
