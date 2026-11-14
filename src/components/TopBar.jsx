import { ArrowLeft, Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LangSwitch from './LangSwitch'

// Persistent top bar: Back + Home buttons on the left, language switch on the right.
export default function TopBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <header className="flex items-center gap-2 bg-brand-900 p-2 text-white">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label={t('back')}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-700"
      >
        <ArrowLeft />
      </button>
      <Link
        to="/"
        aria-label={t('home')}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-700"
      >
        <Home />
      </Link>
      <div className="flex-1" />
      <LangSwitch />
    </header>
  )
}
