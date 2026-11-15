import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleAlert, Globe, SearchX, Waves, WifiOff } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import Pic from '../../components/Pic.jsx'
import { Button, Listen } from './parts.jsx'

// S26 States: one friendly, spoken screen per case with a clear next action.
// Reusable by any screen:  import StateScreen from '../S18-S26/StateScreen.jsx'
//   <StateScreen type="offline" embedded />   types: offline | error | desert | ocean | outside | nodata
// embedded = no Screen wrapper (use inside a screen you already render).
const CASES = {
  offline: { Icon: WifiOff, action: 'retry' },
  error: { Icon: CircleAlert, action: 'retry' },
  desert: { pic: 'zone-arid', emoji: '🏜️', action: 'pick' },
  ocean: { Icon: Waves, action: 'pick' },
  outside: { Icon: Globe, action: 'pick' },
  nodata: { Icon: SearchX, action: 'pick' },
}

export default function StateScreen({ type = 'error', embedded = false }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const key = CASES[type] ? type : 'error'
  const c = CASES[key]
  const title = t(`s26.${key}.title`)
  const body = t(`s26.${key}.body`)

  const content = (
    <>
      <div className="rounded-3xl bg-brand-900 px-6 py-10 text-center text-white">
        <div className="flex justify-center" aria-hidden>
          {c.pic ? (
            <span className="grid h-24 w-24 place-items-center rounded-3xl bg-white"><Pic name={c.pic} emoji={c.emoji} size={72} /></span>
          ) : (
            <c.Icon size={72} strokeWidth={1.5} />
          )}
        </div>
        <h2 className="mt-5 text-2xl font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-xs text-lg leading-snug opacity-90">{body}</p>
        {embedded && (
          <div className="mt-4 flex justify-center"><Listen text={`${title}. ${body}`} /></div>
        )}
      </div>
      <div className="mt-5 space-y-3">
        {c.action === 'retry' ? (
          <Button onClick={() => window.location.reload()}>{t('s26.retry')}</Button>
        ) : (
          <Button onClick={() => navigate('/')}>{t('s26.pickAnother')}</Button>
        )}
        <Link to="/" className="block"><Button variant="soft">{t('home')}</Button></Link>
      </div>
    </>
  )

  if (embedded) return <div>{content}</div>
  return <Screen title={t('s26.header')} speak={`${title}. ${body}`}>{content}</Screen>
}
