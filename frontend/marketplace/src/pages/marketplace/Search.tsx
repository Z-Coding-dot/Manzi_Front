import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { PublicLayout } from '@/components/layout/PublicLayout'
import { EmptyState } from '@/components/ui/EmptyState'
import { PropertyCard } from '@/components/ui/PropertyCard'
import { SearchBar } from '@/components/ui/SearchBar'
import { mockProperties, type AccommodationType } from '@/data/mock/properties'

const TYPES: AccommodationType[] = ['hotel', 'hostel', 'dormitory', 'guesthouse', 'room', 'apartment']
type SortKey = 'popular' | 'price' | 'rating'

export default function Search() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const locationQuery = params.get('location')?.toLowerCase() ?? ''
  const initialType = params.get('type') as AccommodationType | null

  const [types, setTypes] = useState<AccommodationType[]>(initialType ? [initialType] : [])
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [sort, setSort] = useState<SortKey>('popular')

  function toggleType(type: AccommodationType) {
    setTypes((prev) => (prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]))
  }

  const results = useMemo(() => {
    let list = mockProperties.filter((p) => {
      if (locationQuery && !p.area.toLowerCase().includes(locationQuery) && !p.name.toLowerCase().includes(locationQuery)) return false
      if (types.length && !types.includes(p.type)) return false
      if (verifiedOnly && !p.verified) return false
      if (p.rating < minRating) return false
      return true
    })
    if (sort === 'price') list = [...list].sort((a, b) => a.fromPrice - b.fromPrice)
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    if (sort === 'popular') list = [...list].sort((a, b) => b.reviewsCount - a.reviewsCount)
    return list
  }, [locationQuery, types, verifiedOnly, minRating, sort])

  return (
    <PublicLayout>
      <div className="border-b border-line bg-paper py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SearchBar compact />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside className="space-y-6">
            <div>
              <p className="text-sm font-medium text-ink">{t('search.filters')}</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-body">Type</p>
              <div className="space-y-1.5">
                {TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm text-body">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-line accent-forest"
                      checked={types.includes(type)}
                      onChange={() => toggleType(type)}
                    />
                    {t(`categories.${type}`)}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-body">{t('search.rating')}</p>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-forest"
              >
                <option value={0}>Any</option>
                <option value={4}>4.0+</option>
                <option value={4.5}>4.5+</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-body">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line accent-forest"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              {t('search.verifiedOnly')}
            </label>

            {(types.length > 0 || verifiedOnly || minRating > 0) && (
              <button
                onClick={() => {
                  setTypes([])
                  setVerifiedOnly(false)
                  setMinRating(0)
                }}
                className="text-sm font-medium text-forest hover:underline"
              >
                {t('search.clearFilters')}
              </button>
            )}
          </aside>

          {/* Results */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted">{t('search.resultsCount', { count: results.length })}</p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-forest"
              >
                <option value="popular">{t('search.sortPopular')}</option>
                <option value="price">{t('search.sortPrice')}</option>
                <option value="rating">{t('search.sortRating')}</option>
              </select>
            </div>

            {!results.length ? (
              <div className="py-16">
                <EmptyState title={t('common.noResults')} />
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((property, i) => (
                  <PropertyCard key={property.id} property={property} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
