import { PublicLayout } from '@/components/layout/PublicLayout'

export default function Terms() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl text-ink">Terms of service</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-body">
          <p>
            These terms govern your use of Manzil to search, reserve and pay for accommodation listed by independent
            property owners across Kabul. By creating an account or making a reservation, you agree to these terms.
          </p>
          <p>
            Manzil facilitates the connection between guests and properties; the property itself is responsible for
            the accommodation provided. Reservation terms, including cancellation windows, are set per property and
            shown before you confirm a booking.
          </p>
          <p className="text-xs text-muted">
            This is placeholder content for the demo build — a real terms of service needs review by legal counsel
            before publishing.
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}
