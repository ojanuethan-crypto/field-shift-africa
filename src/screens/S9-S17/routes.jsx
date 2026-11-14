// Owner: S9-S17. Paths follow docs/TEAM_SETUP.md. S13 (What if?) is a tab inside S8 (built there).
import { lazy, Suspense } from 'react'

// Lazy-load so these screens stay out of the first bundle.
const S9 = lazy(() => import('./S9SeeFromSpace.jsx'))
const S10 = lazy(() => import('./S10ZoneLegend.jsx'))
const S11 = lazy(() => import('./S11ClimateTwins.jsx'))
const S12 = lazy(() => import('./S12MonthsToWatch.jsx'))
const S14 = lazy(() => import('./S14Advisor.jsx'))
const S15 = lazy(() => import('./S15CommonQuestions.jsx'))
const S16 = lazy(() => import('./S16SourceViewer.jsx'))
const S17 = lazy(() => import('./S17MyFarms.jsx'))
const wrap = (el) => <Suspense fallback={null}>{el}</Suspense>

export const routesS9S17 = [
  { path: '/space', element: wrap(<S9 />) },
  { path: '/zones', element: wrap(<S10 />) },
  { path: '/twins', element: wrap(<S11 />) },
  { path: '/months', element: wrap(<S12 />) },
  { path: '/advisor', element: wrap(<S14 />) },
  { path: '/faq', element: wrap(<S15 />) },
  { path: '/sources', element: wrap(<S16 />) },
  { path: '/farms', element: wrap(<S17 />) },
]
