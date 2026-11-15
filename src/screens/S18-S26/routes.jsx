// Owner: S18-S26. Paths follow docs/TEAM_SETUP.md.
import { lazy, Suspense } from 'react'
import './textSize.js' // applies the saved text size (S22) when the app loads

// Lazy-load so these screens stay out of the first bundle (Proof pulls in the charts library).
const S18 = lazy(() => import('./Share.jsx'))
const S19 = lazy(() => import('./Compare.jsx'))
const S20 = lazy(() => import('./Passport.jsx'))
const S21 = lazy(() => import('./Proof.jsx'))
const S22 = lazy(() => import('./Settings.jsx'))
const S23 = lazy(() => import('./About.jsx'))
const S24 = lazy(() => import('./Help.jsx'))
const S25 = lazy(() => import('./Feedback.jsx'))
const S26 = lazy(() => import('./States.jsx'))
const wrap = (el) => <Suspense fallback={null}>{el}</Suspense>

export const routesS18S26 = [
  { path: '/share/:id', element: wrap(<S18 />) },
  { path: '/compare', element: wrap(<S19 />) },
  { path: '/passport', element: wrap(<S20 />) },
  { path: '/proof', element: wrap(<S21 />) },
  { path: '/settings', element: wrap(<S22 />) },
  { path: '/about', element: wrap(<S23 />) },
  { path: '/help', element: wrap(<S24 />) },
  { path: '/feedback', element: wrap(<S25 />) },
  { path: '/states/:type', element: wrap(<S26 />) },
]
