import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useAppSelector } from '@/redux/hooks'
import { cn } from '@/utils/cn'

const LINKS = [
  { to: '/', label: 'nav.home', end: true },
  { to: '/search', label: 'nav.search' },
  { to: '/stays', label: 'nav.stays' },
  { to: '/map', label: 'nav.map' },
]

export function Navbar() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const user = useAppSelector((s) => s.auth.user)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-sm font-bold text-white">M</div>
          <span className="font-display text-lg text-ink">{t('app.name')}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn('rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'text-forest' : 'text-body hover:text-ink')
              }
            >
              {t(link.label)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <Link to="/for-property-owners" className="px-3 text-sm font-medium text-body hover:text-ink">
            {t('nav.forProperties')}
          </Link>
          {isAuthenticated ? (
            <Link to="/account">
              <Button variant="secondary" size="sm">
                {user?.name?.split(' ')[0] ?? t('nav.account')}
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="secondary" size="sm">
                {t('nav.login')}
              </Button>
            </Link>
          )}
        </div>

        <button className="text-body md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-surface px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-body hover:bg-paper"
              >
                {t(link.label)}
              </NavLink>
            ))}
            <Link to="/for-property-owners" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-body hover:bg-paper">
              {t('nav.forProperties')}
            </Link>
            <div className="mt-2 flex items-center gap-2 px-3">
              <LanguageSwitcher />
              <Link to={isAuthenticated ? '/account' : '/login'} onClick={() => setOpen(false)} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">
                  {isAuthenticated ? (user?.name?.split(' ')[0] ?? t('nav.account')) : t('nav.login')}
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
