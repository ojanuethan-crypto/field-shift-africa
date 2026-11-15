import { useTranslation } from 'react-i18next'
import { StatusIcon } from '../../components/ui'

/* A plan as a row of crop pictures by season, each with tick / triangle / cross. */
export default function CropRow({ plan, size = 'md' }) {
  const { t } = useTranslation()
  const big = size === 'md'
  return (
    <ol className="flex items-start justify-around gap-1">
      {plan.sequence.map((s, i) => (
        <li key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
          <span className="text-xs text-muted">{t('plans.season', { n: i + 1 })}</span>
          <span className={big ? 'text-5xl' : 'text-4xl'} aria-hidden>{s.emoji}</span>
          <span className="max-w-full truncate text-sm font-medium">{t(`crops.${s.crop}`)}</span>
          <StatusIcon status={s.status} label={t(`plans.status.${s.status}`)} />
        </li>
      ))}
    </ol>
  )
}
