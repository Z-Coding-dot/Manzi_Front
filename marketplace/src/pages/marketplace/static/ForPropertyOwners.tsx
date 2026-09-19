import { motion } from 'framer-motion'
import { BarChart3, CloudOff, ShieldCheck, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PublicLayout } from '@/components/layout/PublicLayout'

const BENEFITS = [
  { icon: Users, title: 'Reach real travelers', body: 'Get discovered by travelers, students and business guests searching for Kabul stays right now.' },
  { icon: ShieldCheck, title: 'Built on trust', body: 'Verified badges and transparent reviews mean guests book with confidence — and come back.' },
  { icon: CloudOff, title: 'Works without the internet', body: 'The property management system keeps working through outages — reservations, check-in and check-out never stop.' },
  { icon: BarChart3, title: 'See your business clearly', body: 'Occupancy, revenue and guest reports in one dashboard, without spreadsheets.' },
]

export default function ForPropertyOwners() {
  const { t } = useTranslation()

  return (
    <PublicLayout>
      <section className="bg-forest">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display text-4xl text-white sm:text-5xl"
          >
            {t('home.forOwnersTitle')}
          </motion.h1>
          <p className="mx-auto mt-4 max-w-xl text-white/80">{t('home.forOwnersSubtitle')}</p>
          <Link to="/provider-onboarding-info">
            <button className="mt-8 rounded-lg bg-white px-6 py-3 text-sm font-medium text-forest-deep hover:bg-white/90">
              {t('home.forOwnersCta')}
            </button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {BENEFITS.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="rounded-xl border border-line p-6"
            >
              <Icon className="h-6 w-6 text-forest" />
              <h3 className="mt-3 text-base">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-paper py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2>How onboarding works</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 text-start sm:grid-cols-3">
            {[
              { n: 1, t: 'Create your account', d: 'Sign up as a property owner and tell us about your hotel, hostel or dormitory.' },
              { n: 2, t: 'Add your rooms', d: 'Set up rooms or beds, pricing, and photos using the property dashboard.' },
              { n: 3, t: 'Get verified', d: 'Our team reviews your property, then your listing goes live on the marketplace.' },
            ].map((step) => (
              <div key={step.n}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">
                  {step.n}
                </div>
                <p className="mt-3 font-medium text-ink">{step.t}</p>
                <p className="mt-1 text-sm text-muted">{step.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-muted">
            Property management happens in the separate Manzil Provider dashboard, not on this site.
          </p>
        </div>
      </section>
    </PublicLayout>
  )
}
