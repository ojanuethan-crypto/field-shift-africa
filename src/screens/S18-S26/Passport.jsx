import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Languages } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import { useFarm } from '../../state/FarmContext.jsx'
import { PASSPORT_ROWS } from './evidence.js'
import { Button, Card, Disclaimer, SampleBadge } from './parts.jsx'

// S20 Data Passport (MUST): every number -> dataset, version, resolution, period, access date, method.
// Rows come from evidence.js until the data team provides the real ones.
export default function S20Passport() {
  const { t, i18n } = useTranslation()
  const { update } = useFarm()
  const other = i18n.language === 'fr' ? 'en' : 'fr'

  return (
    <Screen title={t('s20.title')} speak={t('s20.speak')}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SampleBadge />
          <button
            type="button"
            onClick={() => update({ lang: other })}
            className="tap flex items-center gap-2 rounded-full bg-white px-4 font-semibold text-brand-700 shadow-sm"
          >
            <Languages size={20} />
            {t('s20.switch')}
          </button>
        </div>

        <p className="text-base text-ink-soft">{t('s20.intro')}</p>

        {PASSPORT_ROWS.map((r) => (
          <Card key={r.id} className="space-y-3">
            <h2 className="text-lg font-semibold text-brand-900">{t(`s20.rows.${r.id}.label`)}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-ink-soft">{t('s20.dataset')}</dt>
              <dd className="font-semibold">{r.dataset} <span className="font-normal text-ink-soft">{r.version}</span></dd>
              <dt className="text-ink-soft">{t('s20.resolution')}</dt>
              <dd>{r.resolution}</dd>
              <dt className="text-ink-soft">{t('s20.period')}</dt>
              <dd>{r.period}</dd>
              <dt className="text-ink-soft">{t('s20.accessed')}</dt>
              <dd>{r.accessed}</dd>
              <dt className="text-ink-soft">{t('s20.method')}</dt>
              <dd>{t(`s20.rows.${r.id}.method`)}</dd>
            </dl>
          </Card>
        ))}

        <Card>
          <h2 className="text-lg font-semibold text-brand-900">{t('s20.limitsTitle')}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-snug">
            {t('s20.limits', { returnObjects: true }).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Card>

        <Link to="/proof" className="block">
          <Button variant="soft">{t('s20.toProof')}<ChevronRight size={20} /></Button>
        </Link>
        <Disclaimer>{t('common.disclaimer')}</Disclaimer>
      </div>
    </Screen>
  )
}
