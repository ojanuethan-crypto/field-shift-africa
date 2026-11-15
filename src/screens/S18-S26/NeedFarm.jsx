import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import { Button } from './parts.jsx'

// Friendly stop (never a silent redirect) for screens that need a farm before they can show anything.
// Usage:  if (!farm) return <NeedFarm title={t('s7.title')} />
export default function NeedFarm({ title }) {
  const { t } = useTranslation()
  const msg = t('s18s26.needFarm')
  return (
    <Screen title={title} speak={msg}>
      <div className="rounded-3xl bg-white px-6 py-10 text-center shadow-sm">
        <MapPin size={72} strokeWidth={1.5} className="mx-auto text-brand-700" aria-hidden />
        <p className="mt-4 text-xl font-semibold text-brand-900">{msg}</p>
      </div>
      <Link to="/" className="mt-5 block">
        <Button>{t('s18s26.pickFarm')}</Button>
      </Link>
    </Screen>
  )
}
