import { Mail, MapPin, Phone } from 'lucide-react'

import { PublicLayout } from '@/components/layout/PublicLayout'

export default function Contact() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl text-ink">Contact us</h1>
        <p className="mt-3 text-sm text-body">Have a question about a booking or a property? Reach out and we'll help.</p>
        <div className="mt-8 space-y-4 text-sm text-body">
          <p className="flex items-center gap-3"><Phone className="h-4 w-4 text-forest" /> +93 70 000 1122</p>
          <p className="flex items-center gap-3"><Mail className="h-4 w-4 text-forest" /> support@manzil.af</p>
          <p className="flex items-center gap-3"><MapPin className="h-4 w-4 text-forest" /> Shahr-e-Naw, Kabul, Afghanistan</p>
        </div>
      </div>
    </PublicLayout>
  )
}
