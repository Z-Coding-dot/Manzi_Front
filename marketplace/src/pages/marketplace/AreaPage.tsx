import { useParams } from 'react-router-dom'

import { PublicLayout } from '@/components/layout/PublicLayout'
import { EmptyState } from '@/components/ui/EmptyState'
import { PropertyCard } from '@/components/ui/PropertyCard'
import { mockProperties } from '@/data/mock/properties'

export default function AreaPage() {
  const { area } = useParams<{ area: string }>()
  const decoded = area ? decodeURIComponent(area) : ''
  const properties = mockProperties.filter((p) => p.area.toLowerCase() === decoded.toLowerCase())

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl text-ink">Stays in {decoded}</h1>
        <p className="mt-1 text-sm text-muted">{properties.length} {properties.length === 1 ? 'property' : 'properties'} found</p>

        {!properties.length ? (
          <div className="mt-10">
            <EmptyState title="No properties in this area yet" />
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
