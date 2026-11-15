import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { appRoutes } from './routes.jsx'
import { launch } from './state/launch.js'

export default function App() {
  const location = useLocation()

  // Every time the web app is entered (any URL), play the logo splash first, then continue to that URL.
  if (!launch.splashDone && location.pathname !== '/splash') {
    return <Navigate to="/splash" replace state={{ from: location.pathname + location.search }} />
  }

  return (
    <Routes>
      {appRoutes.map((r) => (
        <Route key={r.path} path={r.path} element={r.element} />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
