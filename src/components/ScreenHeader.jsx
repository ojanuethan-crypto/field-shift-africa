import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SpeakButton from './SpeakButton'

/* Persistent Back + Home + title + speaker (design rule 7). `speak` = sentence read aloud. */
export default function ScreenHeader({ title, speak }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const circle =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm'
  return (
    <header className="flex items-center gap-2 px-4 pt-5 pb-3">
      <button type="button" onClick={() => navigate(-1)} aria-label={t('common.back')} className={circle}>
        <ArrowLeft size={22} />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-center text-xl font-semibold text-ink">{title}</h1>
      {speak ? (
        <SpeakButton text={speak} />
      ) : (
        <Link to="/" aria-label={t('common.home')} className={circle}>
          <Home size={22} />
        </Link>
      )}
    </header>
  )
}
