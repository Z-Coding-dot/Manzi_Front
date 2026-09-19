import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PublicLayout } from '@/components/layout/PublicLayout'
import { mockProperties, type AccommodationType } from '@/data/mock/properties'

const TYPES: AccommodationType[] = ['hotel', 'hostel', 'dormitory', 'guesthouse', 'room', 'apartment']

export default function Stays() {
  const { t } = useTranslation()

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl text-ink">Browse stays by type</h1>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((type) => {
            const props = mockProperties.filter((p) => p.type === type)
            if (!props.length) return null
            return (
              <Link key={type} to={`/search?type=${type}`} className="group overflow-hidden rounded-xl border border-line">
                <div className="relative aspect-[16/9]">
                  <img src={props[0].images[0]} alt={t(`categories.${type}`)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-medium text-white">{t(`categories.${type}`)}</p>
                    <p className="text-xs text-white/75">{props.length} {props.length === 1 ? 'stay' : 'stays'}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </PublicLayout>
  )
}
