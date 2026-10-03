import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PublicLayout } from '@/components/layout/PublicLayout'
import type { AccommodationType } from '@/data/mock/properties'
import { useGetPublishedPropertiesQuery } from '@/services/marketplaceApi'
import { DEFAULT_PROPERTY_PLACEHOLDER } from '@/utils/placeholderImage'

const TYPES: AccommodationType[] = ['hotel', 'hostel', 'dormitory', 'guesthouse', 'room', 'apartment']

export default function Stays() {
  const { data: publishedProperties = [] } = useGetPublishedPropertiesQuery()
  const { t } = useTranslation()

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl text-ink">{t('stays.title')}</h1>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((type) => {
            const props = publishedProperties.filter((p) => p.type === type)
            if (!props.length) return null
            return (
              <Link key={type} to={`/search?type=${type}`} className="group overflow-hidden rounded-xl border border-line">
                <div className="relative aspect-[16/9]">
                  <img
                    src={props[0].images?.[0] || DEFAULT_PROPERTY_PLACEHOLDER}
                    alt={t(`categories.${type}`)}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_PROPERTY_PLACEHOLDER;
                    }}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-medium text-white">{t(`categories.${type}`)}</p>
                    <p className="text-xs text-white/75">{t('common.stayCount', { count: props.length })}</p>
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
