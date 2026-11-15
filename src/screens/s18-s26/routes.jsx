import { lazy, Suspense } from 'react'
import Share from './Share'
import Compare from './Compare'
import Passport from './Passport'
import Settings from './Settings'
import About from './About'
import Help from './Help'
import Feedback from './Feedback'
import States from './States'

// Charts are heavy: load the Proof page on demand (performance budget, Frontend Guide 5.3).
const Proof = lazy(() => import('./Proof'))

// S18-S26 routes. Auto-registered by App.jsx.
export default [
  { path: '/share', element: <Share /> },                 // S18
  { path: '/compare', element: <Compare /> },             // S19
  { path: '/passport', element: <Passport /> },           // S20
  { path: '/proof', element: <Suspense fallback={null}><Proof /></Suspense> }, // S21
  { path: '/settings', element: <Settings /> },           // S22
  { path: '/about', element: <About /> },                 // S23
  { path: '/help', element: <Help /> },                   // S24
  { path: '/feedback', element: <Feedback /> },           // S25
  { path: '/states/:type', element: <States /> },         // S26
]
