import { PublicLayout } from '@/components/layout/PublicLayout'

export default function CancellationPolicy() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl text-ink">Cancellation policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-body">
          <p>
            Each property sets its own cancellation window, shown on the property page and again during booking —
            typically between 24 and 72 hours before check-in for a full refund.
          </p>
          <p>
            Cancelling after the free-cancellation window may incur a charge from the property. Dormitory and
            monthly-stay bookings may have different notice requirements — check the specific listing.
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}
