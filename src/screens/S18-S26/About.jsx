import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, ChevronRight, X } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import { Button, Card, Disclaimer } from './parts.jsx'

// S23 About and privacy (MUST): team, partners, what data is and is not collected, licences.
const list = (t, key) => t(key, { returnObjects: true })

export default function S23About() {
  const { t } = useTranslation()
  return (
    <Screen title={t('s23.title')} speak={t('s23.speak')}>
      <div className="space-y-4">
        <div className="rounded-3xl bg-brand-900 p-5 text-white">
          <p className="text-sm opacity-80">NASA Space Apps Challenge 2026 · Field Shift</p>
          <h2 className="mt-1 text-2xl font-semibold">Field Navigator</h2>
          <p className="mt-2 text-base opacity-90">{t('s23.pitch')}</p>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-brand-900">{t('s23.team')}</h2>
          <p className="mt-1 text-base">Logical Prowess</p>
          <p className="mt-3 text-sm font-semibold text-brand-900">{t('s23.partners')}</p>
          <p className="text-sm text-ink-soft">{t('s23.partnersNone')}</p>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-900">{t('s23.privacy')}</h2>
          <ul className="space-y-2">
            {list(t, 's23.notCollected').map((x) => (
              <li key={x} className="flex items-start gap-2 text-base">
                <X size={20} className="mt-0.5 shrink-0 text-red-700" aria-label={t('s23.no')} />
                {x}
              </li>
            ))}
          </ul>
          <ul className="space-y-2 border-t border-gray-200 pt-3">
            {list(t, 's23.collected').map((x) => (
              <li key={x} className="flex items-start gap-2 text-base">
                <Check size={20} className="mt-0.5 shrink-0 text-brand-700" aria-label={t('s23.yes')} />
                {x}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-brand-900">{t('s23.licences')}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {list(t, 's23.licenceList').map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Card>

        <Link to="/passport" className="block">
          <Button variant="soft">{t('s23.sources')}<ChevronRight size={20} /></Button>
        </Link>
        <Link to="/proof" className="block">
          <Button variant="soft">{t('s23.proof')}<ChevronRight size={20} /></Button>
        </Link>
        <Disclaimer>{t('common.disclaimer')}</Disclaimer>
      </div>
    </Screen>
  )
}
