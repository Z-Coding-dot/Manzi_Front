import { useTranslation } from 'react-i18next'

import { AccountLayout } from '@/components/layout/AccountLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { cancelBooking } from '@/redux/slices/bookingSlice'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

export default function AccountReservations() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const reservations = useAppSelector((s) => s.bookings.reservations)

  return (
    <AccountLayout>
      <h1 className="text-2xl text-ink">{t('account.reservations')}</h1>

      {!reservations.length ? (
        <div className="mt-6">
          <EmptyState title={t('common.noResults')} />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{r.propertyName}</p>
                  <p className="text-sm text-muted">{r.roomName}</p>
                  <p className="tabular mt-1 text-sm text-body">
                    {formatDate(r.checkIn, i18n.language)} → {formatDate(r.checkOut, i18n.language)}
                  </p>
                </div>
                <div className="text-end">
                  <Badge tone={r.status === 'confirmed' ? 'success' : 'danger'}>
                    {r.status === 'cancelled' ? t('account.cancelled') : r.status}
                  </Badge>
                  <p className="tabular mt-1.5 font-medium text-ink">{formatCurrency(r.total, 'AFN', i18n.language)}</p>
                </div>
              </div>
              {r.status === 'confirmed' && (
                <div className="mt-3 border-t border-line pt-3">
                  <Button size="sm" variant="secondary" onClick={() => dispatch(cancelBooking(r.id))}>
                    {t('account.cancelReservation')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AccountLayout>
  )
}
