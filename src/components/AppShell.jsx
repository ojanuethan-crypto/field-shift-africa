import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

/* Mobile frame: content column (max 448px) + persistent bottom nav. Screens render inside <Outlet />. */
export default function AppShell() {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-surface pb-32">
      <Outlet />
      <BottomNav />
    </div>
  )
}
