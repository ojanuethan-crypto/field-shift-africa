import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { launch } from '../../state/launch.js'
import logo from '../../assets/scifarm-logo.png'

// Loading screen shown every time the web app is opened: the SciFarm logo jiggles for 2 seconds.
export default function Splash() {
  const nav = useNavigate()
  const { state } = useLocation()

  useEffect(() => {
    const id = setTimeout(() => {
      launch.splashDone = true
      const from = state?.from && state.from !== '/splash' ? state.from : '/'
      nav(from, { replace: true }) // Home decides: voice question, language, or the map
    }, 2000)
    return () => clearTimeout(id)
  }, [nav, state])

  return (
    <div className="mx-auto grid h-full w-full max-w-md place-items-center bg-white">
      {/* Crop the logo's empty margins so it fills the frame */}
      <div className="h-72 w-72 overflow-hidden" role="img" aria-label="SciFarm">
        <img
          src={logo}
          alt=""
          className="sf-jiggle max-w-none"
          style={{ width: 690, marginLeft: -199, marginTop: -44 }}
        />
      </div>
    </div>
  )
}
