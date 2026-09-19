import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PublicLayout } from '@/components/layout/PublicLayout'
import { StarRating } from '@/components/ui/StarRating'
import { mockProperties } from '@/data/mock/properties'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'

// Kabul bounding box, roughly — used only to place mock pins proportionally.
const BOUNDS = { latMin: 34.505, latMax: 34.555, lngMin: 69.12, lngMax: 69.2 }

function toPercent(lat: number, lng: number) {
  const x = ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * 100
  const y = 100 - ((lat - BOUNDS.latMin) / (BOUNDS.latMax - BOUNDS.latMin)) * 100
  return { x: Math.min(96, Math.max(4, x)), y: Math.min(96, Math.max(4, y)) }
}

export default function MapView() {
  const { t, i18n } = useTranslation()
  const [activeId, setActiveId] = useState<string | null>(null)

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl text-ink">{t('search.title')}</h1>
        <p className="mt-1 text-sm text-muted">
          Approximate positions shown for orientation — this is a lightweight placeholder, not a real interactive
          map (that needs a maps API integration).
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* List */}
          <div className="scroll-thin max-h-[560px] space-y-3 overflow-y-auto pe-1">
            {mockProperties.map((p) => (
              <div
                key={p.id}
                onMouseEnter={() => setActiveId(p.id)}
                className={cn(
                  'flex gap-3 rounded-xl border p-3 transition-colors',
                  activeId === p.id ? 'border-forest bg-forest-soft/40' : 'border-line',
                )}
              >
                <img src={p.images[0]} alt={p.name} className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/property/${p.slug}`} className="truncate font-medium text-ink hover:underline">
                    {p.name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    <StarRating rating={p.rating} size={12} />
                    <span>{p.area}</span>
                  </div>
                  <p className="tabular mt-1 text-sm font-medium text-ink">{formatCurrency(p.fromPrice, p.currency, i18n.language)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pseudo-map */}
          <div className="relative min-h-[400px] overflow-hidden rounded-xl border border-line bg-[linear-gradient(0deg,transparent_24%,var(--color-line)_25%,var(--color-line)_26%,transparent_27%,transparent_74%,var(--color-line)_75%,var(--color-line)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,var(--color-line)_25%,var(--color-line)_26%,transparent_27%,transparent_74%,var(--color-line)_75%,var(--color-line)_76%,transparent_77%,transparent)] bg-[length:24px_24px] bg-paper">
            {mockProperties.map((p) => {
              const { x, y } = toPercent(p.latitude, p.longitude)
              const active = activeId === p.id
              return (
                <button
                  key={p.id}
                  onMouseEnter={() => setActiveId(p.id)}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className={cn(
                    'absolute -translate-x-1/2 -translate-y-full rounded-full border px-2 py-1 text-xs font-medium shadow-sm transition-transform',
                    active ? 'z-10 scale-110 border-forest bg-forest text-white' : 'border-line bg-white text-ink',
                  )}
                >
                  {formatCurrency(p.fromPrice, p.currency, i18n.language)}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
