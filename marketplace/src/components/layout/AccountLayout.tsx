import { Bookmark, LayoutDashboard, LogOut, Settings, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'

import { PublicLayout } from '@/components/layout/PublicLayout'
import { useAppDispatch } from '@/redux/hooks'
import { logout } from '@/redux/slices/authSlice'
import { cn } from '@/utils/cn'

const TABS = [
  { to: '/account', icon: LayoutDashboard, label: 'account.dashboard', end: true },
  { to: '/account/reservations', icon: Bookmark, label: 'account.reservations' },
  { to: '/account/saved', icon: Bookmark, label: 'account.saved' },
  { to: '/account/profile', icon: User, label: 'account.profile' },
  { to: '/account/settings', icon: Settings, label: 'account.settings' },
]

export function AccountLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {TABS.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium',
                    isActive ? 'bg-forest-soft text-forest-deep' : 'text-body hover:bg-paper',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {t(label)}
              </NavLink>
            ))}
            <button
              onClick={() => {
                dispatch(logout())
                navigate('/')
              }}
              className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-body hover:bg-paper"
            >
              <LogOut className="h-4 w-4" />
              {t('account.logout')}
            </button>
          </aside>
          <div>{children}</div>
        </div>
      </div>
    </PublicLayout>
  )
}
