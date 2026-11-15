import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import ComingSoon from './components/ComingSoon'

/*
 * ROUTES ARE AUTO-REGISTERED. Each screen group has its own file: src/screens/<group>/routes.jsx
 * that default-exports an array like [{ path: '/share', element: <Share /> }].
 * Nobody edits App.jsx => no merge conflicts. (Three groups: S0-S8, S9-S17, S18-S26.)
 */
const groups = import.meta.glob('./screens/*/routes.jsx', { eager: true })
const routes = Object.values(groups).flatMap((m) => m.default)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {routes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
