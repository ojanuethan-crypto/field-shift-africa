import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import SpeakButton from '../../components/SpeakButton'
import { Card, Button } from '../../components/ui'

/* S24 Help (COULD): 3 pictures with audio: pick your farm, say what matters, follow the route.
   Replace `src` on SpeakButton with the recorded audio file when voice lines are recorded (roadmap 5.1). */
const STEPS = [
  { id: 'farm', icon: '📍' },
  { id: 'matters', icon: '💚' },
  { id: 'route', icon: '🧭' },
]

export default function Help() {
  const { t } = useTranslation()
  return (
    <main>
      <ScreenHeader title={t('help.title')} />
      <div className="space-y-4 px-4">
        {STEPS.map((s, i) => (
          <Card key={s.id} className="flex items-center gap-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#dcebe2] text-5xl" aria-hidden>
              {s.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-accent">{t('help.step', { n: i + 1 })}</p>
              <p className="text-xl font-bold leading-tight text-primary">{t(`help.steps.${s.id}`)}</p>
            </div>
            <SpeakButton text={t(`help.steps.${s.id}`)} className="!bg-[#dcebe2]" />
          </Card>
        ))}
        <Link to="/" className="block">
          <Button>{t('help.start')}</Button>
        </Link>
      </div>
    </main>
  )
}
