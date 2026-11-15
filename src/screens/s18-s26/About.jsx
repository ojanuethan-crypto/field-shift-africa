import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, X, ChevronRight } from 'lucide-react'
import ScreenHeader from '../../components/ScreenHeader'
import { Card, Button, Disclaimer } from '../../components/ui'

/* S23 About and privacy (MUST): team, partners, what data is and is not collected, licences. */
const list = (t, key) => t(key, { returnObjects: true })

export default function About() {
  const { t } = useTranslation()
  return (
    <main>
      <ScreenHeader title={t('about.title')} speak={t('about.speak')} />
      <div className="space-y-4 px-4">
        <div className="rounded-3xl bg-primary p-5 text-white">
          <p className="text-sm text-white/80">NASA Space Apps Challenge 2026 · Field Shift</p>
          <h2 className="mt-1 text-2xl font-bold">Field Navigator</h2>
          <p className="mt-2 text-base text-white/90">{t('about.pitch')}</p>
        </div>

        <Card>
          <h2 className="text-lg font-bold text-primary">{t('about.team')}</h2>
          <p className="mt-1 text-base">Logical Prowess</p>
          <p className="mt-3 text-sm font-semibold text-primary">{t('about.partners')}</p>
          <p className="text-sm text-muted">{t('about.partnersNone')}</p>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-bold text-primary">{t('about.privacy')}</h2>
          <ul className="space-y-2">
            {list(t, 'about.notCollected').map((x) => (
              <li key={x} className="flex items-start gap-2 text-base">
                <X size={20} className="mt-0.5 shrink-0 text-danger" aria-label={t('about.no')} />
                {x}
              </li>
            ))}
          </ul>
          <ul className="space-y-2 border-t border-line pt-3">
            {list(t, 'about.collected').map((x) => (
              <li key={x} className="flex items-start gap-2 text-base">
                <Check size={20} className="mt-0.5 shrink-0 text-accent" aria-label={t('about.yes')} />
                {x}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-primary">{t('about.licences')}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {list(t, 'about.licenceList').map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Card>

        <Link to="/passport" className="block">
          <Button variant="soft">{t('about.sources')}<ChevronRight size={20} /></Button>
        </Link>
        <Link to="/proof" className="block">
          <Button variant="soft">{t('about.proof')}<ChevronRight size={20} /></Button>
        </Link>
        <Disclaimer>{t('common.disclaimer')}</Disclaimer>
      </div>
    </main>
  )
}
