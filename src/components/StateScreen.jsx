import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ScreenHeader from './ScreenHeader'
import SpeakButton from './SpeakButton'
import { Button } from './ui'

/* S26: one friendly, spoken screen per case with a clear next action. Reusable by every screen:
   <StateScreen type="offline" embedded />   types: offline | error | desert | ocean | outside | nodata */
const CASES = {
  offline: { icon: '📡', action: 'retry' },
  error: { icon: '🙈', action: 'retry' },
  desert: { icon: '🏜️', action: 'pick' },
  ocean: { icon: '🌊', action: 'pick' },
  outside: { icon: '🌍', action: 'pick' },
  nodata: { icon: '🔍', action: 'pick' },
}

export default function StateScreen({ type = 'error', embedded = false }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const c = CASES[type] || CASES.error
  const key = CASES[type] ? type : 'error'
  const title = t(`states.${key}.title`)
  const body = t(`states.${key}.body`)
  return (
    <main>
      {!embedded && <ScreenHeader title={t('states.header')} speak={`${title}. ${body}`} />}
      <div className="px-4 pt-6">
        <div className="rounded-3xl bg-primary px-6 py-10 text-center text-white">
          <div className="text-7xl" aria-hidden>{c.icon}</div>
          <h2 className="mt-5 text-2xl font-bold">{title}</h2>
          <p className="mx-auto mt-2 max-w-xs text-lg leading-snug text-white/90">{body}</p>
          {embedded && (
            <div className="mt-4 flex justify-center">
              <SpeakButton text={`${title}. ${body}`} tone="dark" />
            </div>
          )}
        </div>
        <div className="mt-5 space-y-3">
          {c.action === 'retry' ? (
            <Button onClick={() => window.location.reload()}>{t('states.retry')}</Button>
          ) : (
            <Button onClick={() => navigate('/')}>{t('states.pickAnother')}</Button>
          )}
          <Link to="/" className="block">
            <Button variant="soft">{t('common.home')}</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
