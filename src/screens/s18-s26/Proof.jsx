import { useTranslation } from 'react-i18next'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import ScreenHeader from '../../components/ScreenHeader'
import { Card, Disclaimer } from '../../components/ui'
import { PROOF_EVENTS, NDVI_SERIES } from '../../mock/evidence'

/* S21 Proof / backtest (SHOULD): "Did it work in the past?" Hit rate vs chance, honest misses, NDVI check.
   Loaded lazily (recharts is heavy). Numbers are placeholders from mock/evidence.js. */
function Bar({ label, value, tone, pattern }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-20 shrink-0 text-muted">{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{
            width: `${value}%`,
            backgroundImage: pattern ? 'repeating-linear-gradient(45deg,rgba(255,255,255,.55) 0 4px,transparent 4px 8px)' : undefined,
          }}
        />
      </div>
      <span className="w-12 shrink-0 text-right font-bold">{value}%</span>
    </div>
  )
}

export default function Proof() {
  const { t } = useTranslation()
  return (
    <main>
      <ScreenHeader title={t('proof.title')} speak={t('proof.speak')} />
      <div className="space-y-4 px-4">
        <span className="inline-block rounded-full bg-amber px-3 py-1 text-sm font-semibold text-ink">
          {t('common.sample')}
        </span>
        <p className="text-base text-muted">{t('proof.intro')}</p>

        {PROOF_EVENTS.map((e) => (
          <Card key={e.id} className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-primary">{t(`proof.events.${e.id}`)}</h2>
              <p className="text-sm text-muted">{e.years}</p>
            </div>
            <Bar label={t('proof.ours')} value={e.hit} tone="bg-accent" />
            <Bar label={t('proof.chance')} value={e.chance} tone="bg-muted" pattern />
            <p className="rounded-2xl bg-surface px-3 py-2 text-sm">
              <span aria-hidden>⚠️ </span>
              {t('proof.misses', { n: e.misses, of: e.of })}
            </p>
          </Card>
        ))}

        <Card>
          <h2 className="text-lg font-bold text-primary">{t('proof.ndviTitle')}</h2>
          <p className="mb-2 text-sm text-muted">{t('proof.ndviBody')}</p>
          <div className="h-56" role="img" aria-label={t('proof.ndviTitle')}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={NDVI_SERIES} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#d6ddd8" strokeDasharray="3 3" />
                <XAxis dataKey="m" tick={{ fontSize: 14 }} />
                <YAxis tick={{ fontSize: 14 }} domain={[0, 100]} />
                <Legend wrapperStyle={{ fontSize: 14 }} />
                {/* solid vs dashed: never colour alone */}
                <Line type="monotone" dataKey="hazard" name={t('proof.hazard')} stroke="#b3261e" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="ndvi" name="NDVI" stroke="#2d6a4f" strokeWidth={3} strokeDasharray="6 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="text-sm">
          <h2 className="font-bold text-primary">{t('proof.reviewTitle')}</h2>
          <p className="mt-1 text-muted">{t('proof.review')}</p>
        </Card>
        <Disclaimer>{t('common.disclaimer')}</Disclaimer>
      </div>
    </main>
  )
}
