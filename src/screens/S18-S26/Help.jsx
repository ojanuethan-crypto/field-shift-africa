import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Compass, Heart, MapPin } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import { Button, Card, Listen } from './parts.jsx'

// S24 Help (COULD): 3 pictures with audio: pick your farm, say what matters, follow the route.
// Audio uses the shared text-to-speech. Swap in recorded files later (roadmap 5.1).
const STEPS = [
  { id: 'farm', Icon: MapPin },
  { id: 'matters', Icon: Heart },
  { id: 'route', Icon: Compass },
]

export default function S24Help() {
  const { t } = useTranslation()
  return (
    <Screen title={t('s24.title')}>
      <div className="space-y-4">
        {STEPS.map((s, i) => (
          <Card key={s.id} className="flex items-center gap-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-brand-100 text-5xl" aria-hidden>
              <s.Icon size={40} strokeWidth={1.6} className="text-brand-700" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-700">{t('s24.step', { n: i + 1 })}</p>
              <p className="text-xl font-semibold leading-tight text-brand-900">{t(`s24.steps.${s.id}`)}</p>
            </div>
            <Listen text={t(`s24.steps.${s.id}`)} />
          </Card>
        ))}
        <Link to="/" className="block">
          <Button>{t('s24.start')}</Button>
        </Link>
      </div>
    </Screen>
  )
}
