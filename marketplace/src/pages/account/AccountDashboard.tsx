import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { AccountLayout } from '@/components/layout/AccountLayout'
import { Badge } from '@/components/ui/Badge'
import { PropertyCard } from '@/components/ui/PropertyCard'
import { mockProperties } from '@/data/mock/properties'
import { useAppSelector } from '@/redux/hooks'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

export default function AccountDashboard() {
  const { t, i18n } = useTranslation()
  const user = useAppSelector((s) => s.auth.user)
  const reservations = useAppSelector((s) => s.bookings.reservations)
  const savedIds = useAppSelector((s) => s.saved.propertyIds)

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = reservations.find((r) => r.status === 'confirmed' && r.checkIn >= today)
  const recent = reservations.slice(0, 3)
  const saved = mockProperties.filter((p) => savedIds.includes(p.id)).slice(0, 3)

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl text-ink">
            {t('account.dashboard')}
          </h1>
          <p className="text-sm text-muted">{user?.name}</p>
        </div>

        <section>
          <h2 className="text-base">{t('account.upcomingReservation')}</h2>
          {!upcoming ? (
            <p className="mt-2 text-sm text-muted">{t('account.noUpcoming')}</p>
          ) : (
            <div className="mt-3 rounded-xl border border-line p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-ink">{upcoming.propertyName}</p>
                  <p className="text-sm text-muted">{upcoming.roomName}</p>
                  <p className="tabular mt-1 text-sm text-body">
                    {formatDate(upcoming.checkIn, i18n.language)} → {formatDate(upcoming.checkOut, i18n.language)}
                  </p>
                </div>
                <Badge tone="success">{upcoming.status}</Badge>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-base">{t('account.recentReservations')}</h2>
            <Link to="/account/reservations" className="text-sm text-forest hover:underline">
              {t('common.seeAll')}
            </Link>
          </div>
          {!recent.length ? (
            <p className="mt-2 text-sm text-muted">{t('account.noUpcoming')}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-line p-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{r.propertyName}</p>
                    <p className="text-muted">{formatDate(r.checkIn, i18n.language)} → {formatDate(r.checkOut, i18n.language)}</p>
                  </div>
                  <span className="tabular font-medium text-ink">{formatCurrency(r.total, 'AFN', i18n.language)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-base">{t('account.savedProperties')}</h2>
            <Link to="/account/saved" className="text-sm text-forest hover:underline">
              {t('common.seeAll')}
            </Link>
          </div>
          {!saved.length ? (
            <p className="mt-2 text-sm text-muted">{t('account.noSaved')}</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {saved.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AccountLayout>
  )
}
