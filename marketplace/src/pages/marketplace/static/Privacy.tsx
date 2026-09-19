import { PublicLayout } from '@/components/layout/PublicLayout'

export default function Privacy() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl text-ink">Privacy policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-body">
          <p>
            Manzil collects the information needed to create your account and complete reservations — your name,
            phone number, email, and payment details — and shares only what's necessary with the property you book
            with.
          </p>
          <p>
            We do not sell personal information to third parties. You can request a copy of your data or ask us to
            delete your account at any time through Account → Settings.
          </p>
          <p className="text-xs text-muted">
            This is placeholder content for the demo build — a real privacy policy needs review by legal counsel
            before publishing.
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}
