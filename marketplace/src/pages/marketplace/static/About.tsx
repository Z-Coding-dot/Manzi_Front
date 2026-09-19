import { PublicLayout } from '@/components/layout/PublicLayout'

export default function About() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl text-ink">About Manzil</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-body">
          <p>
            Manzil is the trusted accommodation platform for Kabul, connecting travelers with verified hotels,
            hostels, guesthouses and dormitories across the city.
          </p>
          <p>
            Every property on Manzil is checked for real ownership, accurate location and genuine photos before it
            goes live, so you can book with confidence — whether you're a business traveler, a student looking for a
            dormitory bed, or a family visiting Kabul.
          </p>
          <p>
            Behind the scenes, Manzil also gives accommodation providers the tools to manage their rooms,
            reservations and guests day to day — even when the internet isn't reliable.
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}
