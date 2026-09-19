import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { PublicLayout } from '@/components/layout/PublicLayout'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { SelectField } from '@/components/ui/SelectField'
import { getPropertyBySlug } from '@/data/mock/properties'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { addBooking } from '@/redux/slices/bookingSlice'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'

const STEPS = ['step1', 'step2', 'step3'] as const

function todayIso(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export default function BookingFlow() {
  const { slug, roomId } = useParams<{ slug: string; roomId: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const property = slug ? getPropertyBySlug(slug) : undefined
  const room = property?.rooms.find((r) => r.id === roomId)

  const [step, setStep] = useState(0)
  const [checkIn, setCheckIn] = useState(todayIso(1))
  const [checkOut, setCheckOut] = useState(todayIso(2))
  const [guestsCount, setGuestsCount] = useState(2)
  const [guestName, setGuestName] = useState(user?.name ?? '')
  const [guestPhone, setGuestPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'hesabpay' | 'afpay'>('cash')
  const [done, setDone] = useState(false)

  if (!property || !room) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <p className="text-muted">Room not found.</p>
          <Link to="/search" className="mt-2 inline-block text-sm text-forest hover:underline">
            Back to search
          </Link>
        </div>
      </PublicLayout>
    )
  }

  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
  const total = room.price * nights

  function handleConfirm() {
    dispatch(
      addBooking({
        id: `bk_${Date.now()}`,
        propertySlug: property!.slug,
        propertyName: property!.name,
        roomName: room!.name,
        checkIn,
        checkOut,
        guestsCount,
        guestName,
        guestPhone,
        paymentMethod,
        total,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      }),
    )
    setDone(true)
  }

  if (done) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <CheckCircle2 className="mx-auto h-10 w-10 text-forest" />
          <h1 className="mt-4 text-2xl">{t('booking.confirmedTitle')}</h1>
          <p className="mt-2 text-sm text-muted">{t('booking.confirmedBody')}</p>
          <Link to="/account/reservations">
            <Button className="mt-6">{t('booking.backToAccount')}</Button>
          </Link>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl text-ink">{t('booking.title')}</h1>
        <p className="mt-1 text-sm text-muted">
          {property.name} · {room.name}
        </p>

        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((key, i) => (
            <div key={key} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                  i <= step ? 'bg-forest text-white' : 'bg-paper text-muted',
                )}
              >
                {i + 1}
              </div>
              <span className={cn('hidden text-xs sm:inline', i === step ? 'font-medium text-ink' : 'text-muted')}>
                {t(`booking.${key}`)}
              </span>
              {i < STEPS.length - 1 && <div className={cn('h-px flex-1', i < step ? 'bg-forest' : 'bg-line')} />}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-line p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('home.checkIn')} type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                <Field label={t('home.checkOut')} type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
              </div>
              <Field
                label={t('common.guests')}
                type="number"
                min={1}
                max={room.capacity}
                value={guestsCount}
                onChange={(e) => setGuestsCount(Number(e.target.value))}
              />
              <Field label={t('booking.guestName')} value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
              <Field label={t('booking.guestPhone')} type="tel" placeholder="+93 7X XXX XXXX" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} required />
              <div>
                <label className="block text-sm font-medium text-body">{t('booking.specialRequests')}</label>
                <textarea rows={2} className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-forest" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{property.name}</span>
                <span className="font-medium text-ink">{room.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('home.checkIn')} – {t('home.checkOut')}</span>
                <span className="tabular font-medium text-ink">{checkIn} → {checkOut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('booking.guestName')}</span>
                <span className="font-medium text-ink">{guestName || '—'}</span>
              </div>
              <div className="mt-3 space-y-1 border-t border-line pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{t('booking.priceBreakdown')}</p>
                <div className="flex justify-between">
                  <span className="text-body">
                    {t('booking.baseRate')} × {t(nights === 1 ? 'booking.nights' : 'booking.nights_other', { count: nights })}
                  </span>
                  <span className="tabular text-body">{formatCurrency(total, property.currency, i18n.language)}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-2">
                  <span className="font-medium text-ink">{t('booking.total')}</span>
                  <span className="tabular text-lg font-semibold text-forest-deep">{formatCurrency(total, property.currency, i18n.language)}</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <SelectField label={t('booking.paymentMethod')} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}>
              <option value="cash">Cash on arrival</option>
              <option value="hesabpay">HesabPay</option>
              <option value="afpay">AfPay</option>
            </SelectField>
          )}

          <div className="mt-6 flex justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && (!guestName || !guestPhone)}
              >
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleConfirm}>
                {t('booking.confirmBooking')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
