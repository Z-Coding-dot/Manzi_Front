import { translateCatalog } from '@/utils/translateCatalog';
import { useTranslation } from 'react-i18next'

import { AccountLayout } from '@/components/layout/AccountLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useState } from 'react'
import { useGetBookingsQuery, useCancelBookingMutation } from '@/services/marketplaceApi'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

export default function AccountReservations() {
  const { t, i18n } = useTranslation()
  const { data: reservations = [], isLoading, isError, refetch } = useGetBookingsQuery()
  const [cancel, { isLoading: isCancelling }] = useCancelBookingMutation()
  const [error, setError] = useState('')
  async function cancelReservation(id: string) { setError(''); try { await cancel(id).unwrap() } catch { setError(t('booking.saveError')) } }

  return (
    <AccountLayout>
      <h1 className="text-2xl text-ink">{t('account.reservations')}</h1>

      {error && <p role="alert" className="text-danger">{error}</p>}
      {isLoading ? <p role="status">{t('common.loading')}</p> : isError ? <div role="alert"><p>{t('booking.saveError')}</p><Button onClick={() => void refetch()}>{t('common.retry')}</Button></div> : !reservations.length ? (
        <div className="mt-6">
          <EmptyState title={t('common.noResults')} />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{r.property.name}</p>
                  <p className="text-sm text-muted">{r.room ? translateCatalog(r.room.roomType, t) : ''}</p>
                  <p className="tabular mt-1 text-sm text-body">
                    {formatDate(r.checkIn, i18n.language)} → {formatDate(r.checkOut, i18n.language)}
                  </p>
                </div>
                <div className="text-end">
                  <Badge tone={r.status === 'confirmed' ? 'success' : 'danger'}>
                    {t(`status.${r.status}`, { defaultValue: r.status })}
                  </Badge>
                  <p className="tabular mt-1.5 font-medium text-ink">{formatCurrency(r.total, r.currency, i18n.language)}</p>
                </div>
              </div>
              {r.status === 'confirmed' && (
                <div className="mt-3 border-t border-line pt-3">
                  <Button size="sm" variant="secondary" disabled={isCancelling} onClick={() => void cancelReservation(r.id)}>
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
