import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Languages, ChevronRight } from 'lucide-react'
import ScreenHeader from '../../components/ScreenHeader'
import { Card, Button, Disclaimer } from '../../components/ui'
import { useSettings } from '../../lib/settings'
import { PASSPORT_ROWS } from '../../mock/evidence'

/* S20 Data Passport (MUST): every number -> dataset, version, resolution, period, access date, method.
   This is the "Best Use of Data" proof. Rows come from mock/evidence.js until the data team provides real ones. */
export default function Passport() {
  const { t, i18n } = useTranslation()
  const [, setSettings] = useSettings()
  const other = i18n.language === 'fr' ? 'en' : 'fr'

  return (
    <main>
      <ScreenHeader title={t('passport.title')} speak={t('passport.speak')} />
      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-amber px-3 py-1 text-sm font-semibold text-ink">{t('common.sample')}</span>
          <button
            type="button"
            onClick={() => setSettings({ lang: other })}
            className="flex min-h-12 items-center gap-2 rounded-full bg-white px-4 font-semibold text-primary shadow-sm"
          >
            <Languages size={20} />
            {t('passport.switch')}
          </button>
        </div>

        <p className="text-base text-muted">{t('passport.intro')}</p>

        {PASSPORT_ROWS.map((r) => (
          <Card key={r.id} className="space-y-3">
            <h2 className="text-lg font-bold text-primary">{t(`passport.rows.${r.id}.label`)}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted">{t('passport.dataset')}</dt>
              <dd className="font-semibold">{r.dataset} <span className="font-normal text-muted">{r.version}</span></dd>
              <dt className="text-muted">{t('passport.resolution')}</dt>
              <dd>{r.resolution}</dd>
              <dt className="text-muted">{t('passport.period')}</dt>
              <dd>{r.period}</dd>
              <dt className="text-muted">{t('passport.accessed')}</dt>
              <dd>{r.accessed}</dd>
              <dt className="text-muted">{t('passport.method')}</dt>
              <dd>{t(`passport.rows.${r.id}.method`)}</dd>
            </dl>
          </Card>
        ))}

        <Card>
          <h2 className="text-lg font-bold text-primary">{t('passport.limitsTitle')}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-snug">
            {t('passport.limits', { returnObjects: true }).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Card>

        <Link to="/proof" className="block">
          <Button variant="soft">
            {t('passport.toProof')}
            <ChevronRight size={20} />
          </Button>
        </Link>
        <Disclaimer>{t('common.disclaimer')}</Disclaimer>
      </div>
    </main>
  )
}
