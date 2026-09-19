import { PublicLayout } from '@/components/layout/PublicLayout'

const FAQS = [
  { q: 'How do I cancel a reservation?', a: 'Go to My account → My reservations and select "Cancel reservation" on any upcoming booking, subject to the property\u2019s cancellation policy.' },
  { q: 'What payment methods are accepted?', a: 'Most properties accept cash on arrival. Many also accept HesabPay and AfPay for online payment during booking.' },
  { q: 'Are all properties verified?', a: 'Properties marked "Verified" have had their ownership, location and photos checked by our team. We recommend filtering for verified-only listings.' },
  { q: 'Can I book a dormitory bed instead of a room?', a: 'Yes — dormitory listings let you reserve a single bed rather than a whole room, with gender-specific options where applicable.' },
]

export default function Help() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl text-ink">Help center</h1>
        <div className="mt-8 space-y-6">
          {FAQS.map((faq) => (
            <div key={faq.q} className="border-b border-line pb-6">
              <p className="font-medium text-ink">{faq.q}</p>
              <p className="mt-2 text-sm text-body">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  )
}
