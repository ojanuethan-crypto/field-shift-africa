import { useTranslation } from 'react-i18next'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { TriangleAlert } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import { USE_MOCK } from '../../api/config.js'
import QueryState from '../S9-S17/components/QueryState.jsx'
import { NDVI_SERIES, PROOF_EVENTS } from './evidence.js'
import { Card, Disclaimer, SampleBadge } from './parts.jsx'
import { useProof } from './useEvidence.js'

// S21 Proof / backtest (SHOULD): "Did it work in the past?" Hit rate vs chance, honest misses, NDVI check.
// Real API: events come from the database backtest (GET /api/proof), misses included. Mock mode: sample numbers from evidence.js.
// Lazy-loaded (recharts is heavy).
function Bar({ label, value, tone, pattern }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-20 shrink-0 text-ink-soft">{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{
            width: `${value}%`,
            backgroundImage: pattern
              ? 'repeating-linear-gradient(45deg,rgba(255,255,255,.55) 0 4px,transparent 4px 8px)'
              : undefined,
          }}
        />
      </div>
      <span className="w-12 shrink-0 text-right font-bold">{value}%</span>
    </div>
  )
}

const pct = (x) => (typeof x === 'number' ? Math.round(x * 100) : null)

export default function S21Proof() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
  const query = useProof()
  const live = !USE_MOCK
  const events = live
    ? (query.data?.events ?? []).map((e) => ({
        id: e.id, title: e.name[lang], years: e.years, hit: pct(e.hit_rate), chance: pct(e.baseline),
        misses: e.misses, of: e.cells_total, note: e.misses_note?.[lang],
      }))
    : PROOF_EVENTS.map((e) => ({ ...e, title: t(`s21.events.${e.id}`) }))
  return (
    <Screen title={t('s21.title')} speak={t('s21.speak')}>
      <div className="space-y-4">
        {!live && <SampleBadge />}
        <p className="text-base text-ink-soft">{t('s21.intro')}</p>
        {live && <QueryState query={query} />}

        {events.map((e) => (
          <Card key={e.id} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-brand-900">{e.title}</h2>
              <p className="text-sm text-ink-soft">{e.years}</p>
            </div>
            {e.hit != null && <Bar label={t('s21.ours')} value={e.hit} tone="bg-brand-700" />}
            {e.chance != null && <Bar label={t('s21.chance')} value={e.chance} tone="bg-ink-soft" pattern />}
            {e.misses != null && e.of != null && (
              <p className="rounded-2xl bg-surface px-3 py-2 text-sm">
                <TriangleAlert size={16} aria-hidden className="mr-1 inline" />
                {t('s21.misses', { n: e.misses, of: e.of })}
              </p>
            )}
            {e.note && <p className="text-sm text-ink-soft">{e.note}</p>}
          </Card>
        ))}

        <Card>
          <h2 className="text-lg font-semibold text-brand-900">{t('s21.ndviTitle')}</h2>
          <p className="mb-2 text-sm text-ink-soft">{t('s21.ndviBody')}</p>
          {live || NDVI_SERIES.length === 0 ? (
            <p className="rounded-2xl bg-surface px-3 py-2 text-sm">{t('s21.ndviNone')}</p>
          ) : (
          <div className="h-56" role="img" aria-label={t('s21.ndviTitle')}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={NDVI_SERIES} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#d9dedb" strokeDasharray="3 3" />
                <XAxis dataKey="m" tick={{ fontSize: 14 }} />
                <YAxis tick={{ fontSize: 14 }} domain={[0, 100]} />
                <Legend wrapperStyle={{ fontSize: 14 }} />
                {/* solid vs dashed: never colour alone */}
                <Line type="monotone" dataKey="hazard" name={t('s21.hazard')} stroke="#b3261e" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="ndvi" name="NDVI" stroke="#2d6a4f" strokeWidth={3} strokeDasharray="6 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          )}
        </Card>

        <Card className="text-sm">
          <h2 className="font-semibold text-brand-900">{t('s21.reviewTitle')}</h2>
          <p className="mt-1 text-ink-soft">{t('s21.review')}</p>
        </Card>
        <Disclaimer>{t('common.disclaimer')}</Disclaimer>
      </div>
    </Screen>
  )
}
