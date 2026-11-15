import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { launch } from '../../state/launch.js'
import SciFarmLogoAnimation from '../../components/SciFarmLogoAnimation.jsx'

// Loading screen shown every time the web app is opened: the orbit draws around the leaf, then the
// SciFarm wordmark appears. When it finishes we hold a moment, then continue to the requested page.
export default function Splash() {
  const nav = useNavigate()
  const { state } = useLocation()
  const timer = useRef(null)

  // Must be stable, otherwise the logo animation restarts on every render.
  const onComplete = useCallback(() => {
    timer.current = setTimeout(() => {
      launch.splashDone = true
      const from = state?.from && state.from !== '/splash' ? state.from : '/'
      nav(from, { replace: true }) // Home decides: voice question, language, or the map
    }, 900) // lets the wordmark fade in
  }, [nav, state])

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className="grid h-full w-full place-items-center bg-white">
      <SciFarmLogoAnimation showReplayButton={false} onComplete={onComplete} />
    </div>
  )
}
