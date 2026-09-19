import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { StarRating } from '@/components/ui/StarRating'
import type { Property } from '@/data/mock/properties'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { toggleSaved } from '@/redux/slices/savedSlice'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'

export function PropertyCard({ property, index = 0 }: { property: Property; index?: number }) {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const isSaved = useAppSelector((s) => s.saved.propertyIds.includes(property.id))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
    >
      <div className="group relative">
        <button
          onClick={(e) => {
            e.preventDefault()
            dispatch(toggleSaved(property.id))
          }}
          aria-label="Save property"
          className="absolute end-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <Heart className={cn('h-4 w-4', isSaved ? 'fill-danger text-danger' : 'text-ink')} />
        </button>
        <Link to={`/property/${property.slug}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-paper">
            <img
              src={property.images[0]}
              alt={property.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {property.verified && (
              <Badge tone="onDark" className="absolute start-3 top-3 backdrop-blur-sm">
                {t('common.verified')}
              </Badge>
            )}
          </div>
          <div className="mt-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{property.name}</p>
              <p className="text-sm text-muted">{property.area}</p>
            </div>
            <StarRating rating={property.rating} />
          </div>
          <p className="mt-1 text-sm text-body">
            <span className="text-muted">{t('common.from')} </span>
            <span className="tabular font-semibold text-ink">{formatCurrency(property.fromPrice, property.currency, i18n.language)}</span>
            <span className="text-muted"> / {t('common.night')}</span>
          </p>
        </Link>
      </div>
    </motion.div>
  )
}
