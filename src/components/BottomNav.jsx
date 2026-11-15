import { NavLink } from 'react-router-dom'
import { Newspaper, Leaf, Sprout, Bookmark, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/* Floating bottom bar: raised round centre button, grey icons,
   green active icon with a dot underneath. */
const items = [
  { to: '/help', icon: Newspaper, label: 's1.nav.help' },
  { to: '/routes', icon: Leaf, label: 's7.title' },
  { to: '/', icon: Sprout, label: 'common.home', center: true },
  { to: '/farms', icon: Bookmark, label: 's1.nav.farms' },
  { to: '/settings', icon: Wrench, label: 's1.nav.settings' },
]

export default function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav aria-label="Main" className="relative z-[700] shrink-0 bg-surface px-3 pb-3 pt-6">
      <ul className="relative flex h-[68px] items-center justify-between rounded-[28px] bg-white px-3 shadow-[0_6px_24px_rgba(20,38,28,0.12)]">
        {items.map(({ to, icon: Icon, label, center }) => (
          <li key={to} className="flex flex-1 justify-center">
            <NavLink
              to={to}
              end={to === '/'}
              aria-label={t(label)}
              className="group flex min-h-12 min-w-12 flex-col items-center justify-center"
            >
              {({ isActive }) =>
                center ? (
                  <span className="relative -mt-9 flex flex-col items-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_6px_14px_rgba(47,143,95,0.45)] ring-[6px] ring-surface">
                      <Icon size={30} strokeWidth={1.8} />
                    </span>
                    <span className={`mt-2 h-1.5 w-1.5 rounded-full ${isActive ? 'bg-brand-600' : 'bg-transparent'}`} />
                  </span>
                ) : (
                  <>
                    <Icon size={28} strokeWidth={1.8} className={isActive ? 'text-brand-600' : 'text-[#a9b0ab]'} />
                    <span className={`mt-1 h-1.5 w-1.5 rounded-full ${isActive ? 'bg-brand-600' : 'bg-transparent'}`} />
                  </>
                )
              }
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
