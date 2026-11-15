import Splash from './Splash.jsx'
import VoiceAsk from './VoiceAsk.jsx'
import VoicePick from './VoicePick.jsx'
import S0Language from './S0Language.jsx'
import S1Home from './S1Home.jsx'
import S2Confirm from './S2Confirm.jsx'
import S3Land from './S3Land.jsx'
import S4LastCrop from './S4LastCrop.jsx'
import S5Priorities from './S5Priorities.jsx'
import S6Conditions from './S6Conditions.jsx'
import S7Routes from './S7Routes.jsx'
import S8RouteDetail from './S8RouteDetail.jsx'

// Owner: S0-S8. Other screens link to these paths (see docs/ROUTES.md).
export const routesS0S8 = [
  { path: '/splash', element: <Splash /> },
  { path: '/voice', element: <VoiceAsk /> },
  { path: '/voice-pick', element: <VoicePick /> },
  { path: '/language', element: <S0Language /> },
  { path: '/', element: <S1Home /> },
  { path: '/confirm', element: <S2Confirm /> },
  { path: '/land', element: <S3Land /> },
  { path: '/last-crop', element: <S4LastCrop /> },
  { path: '/priorities', element: <S5Priorities /> },
  { path: '/conditions', element: <S6Conditions /> },
  { path: '/routes', element: <S7Routes /> },
  { path: '/routes/:id', element: <S8RouteDetail /> },
]
