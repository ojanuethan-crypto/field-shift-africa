import { FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { USE_MOCK } from '../../../api/config.js'

// Honest label: shown whenever the screen is reading mock data.
export default function MockBadge() {
  const { t } = useTranslation()
  if (!USE_MOCK) return null
  return (
    <p className="mb-4 flex items-center gap-2 rounded-2xl bg-brand-100 p-2 text-xs font-bold text-brand-900">
      <FlaskConical size={16} /> {t('s9s17.mock')}
    </p>
  )
}
