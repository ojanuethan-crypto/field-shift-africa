import { Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { speakText } from '../../components/speech.js'
import { useFarm } from '../../state/FarmContext.jsx'

// Small building blocks used only by S18-S26. Colours come from the shared tokens in index.css.

export const Card = ({ className = '', children, ...p }) => (
  <section className={`rounded-3xl bg-white p-4 shadow-sm ${className}`} {...p}>
    {children}
  </section>
)

// Big pill button (48px+). variant: solid | soft | outline | danger
export function Button({ variant = 'solid', className = '', icon: Icon, children, ...p }) {
  const styles = {
    solid: 'bg-brand-700 text-white shadow',
    soft: 'bg-brand-100 text-brand-900',
    outline: 'border-2 border-brand-700 bg-white text-brand-700',
    danger: 'bg-red-700 text-white',
  }[variant]
  return (
    <button
      type="button"
      className={`tap flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-lg font-medium transition active:scale-[.98] disabled:opacity-40 ${styles} ${className}`}
      {...p}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  )
}

export const Disclaimer = ({ children }) => (
  <p className="px-4 text-center text-sm leading-snug text-ink-soft">{children}</p>
)

// Speaker for a card. Respects the shared mute switch. (Screen-level speaker is <Screen speak=...>.)
export function Listen({ text, className = '' }) {
  const { t, i18n } = useTranslation()
  const { muted } = useFarm()
  return (
    <button
      type="button"
      aria-label={t('common.listen')}
      onClick={() => !muted && speakText(text, i18n.language)}
      className={`tap grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700 ${className}`}
    >
      <Volume2 size={24} />
    </button>
  )
}

export const SampleBadge = () => {
  const { t } = useTranslation()
  return (
    <span className="inline-block rounded-full bg-amber-accent px-3 py-1 text-sm font-semibold text-ink">
      {t('s18s26.sample')}
    </span>
  )
}

// Water summary for a ranked plan: worst water level across seasons, as good | warn | bad.
export function planWater(plan) {
  const all = plan.sequence.flatMap((s) => s.water)
  if (all.includes('not_enough')) return 'bad'
  if (all.includes('risky')) return 'warn'
  return 'good'
}
export const WATER_LABEL = { good: 's8.waterEnough', warn: 's8.waterRisky', bad: 's8.waterNot' }
