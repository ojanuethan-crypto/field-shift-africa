import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ScreenHeader from './ScreenHeader'

/* Fallback for routes nobody has built yet (also acts as a friendly 404). */
export default function ComingSoon() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  return (
    <main>
      <ScreenHeader title={t('common.soon')} />
      <p className="px-6 pt-10 text-center text-lg text-muted">
        <span className="block text-6xl" aria-hidden>🚧</span>
        <span className="mt-4 block">{pathname}</span>
      </p>
    </main>
  )
}
