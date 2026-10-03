import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { PublicLayout } from '@/components/layout/PublicLayout'
import { EmptyState } from '@/components/ui/EmptyState'
import { PropertyCard } from '@/components/ui/PropertyCard'
import { useGetPublishedPropertiesQuery } from '@/services/marketplaceApi'

export default function AreaPage() {
  const { t } = useTranslation()
  const { data: publishedProperties = [] } = useGetPublishedPropertiesQuery()
  const { area } = useParams<{ area: string }>()
  const decoded = area ? decodeURIComponent(area) : ''
  const properties = publishedProperties.filter((p) => p.area.toLowerCase() === decoded.toLowerCase())

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl text-ink">{t('stays.inArea', { area: decoded })}</h1>
        <p className="mt-1 text-sm text-muted">{t('search.resultsCount', { count: properties.length })}</p>

        {!properties.length ? (
          <div className="mt-10">
            <EmptyState title={t('stays.emptyArea')} />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
