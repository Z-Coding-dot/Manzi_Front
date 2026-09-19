import { Check, MapPin, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StarRating } from '@/components/ui/StarRating'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { getPropertyBySlug } from '@/data/mock/properties'
import { getReviewsForProperty } from '@/data/mock/reviews'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

export default function PropertyDetails() {
  const { slug } = useParams<{ slug: string }>()
  const { t, i18n } = useTranslation()
  const property = slug ? getPropertyBySlug(slug) : undefined

  if (!property) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <EmptyState title="Property not found" action={<Link to="/search" className="text-sm text-forest hover:underline">Back to search</Link>} />
        </div>
      </PublicLayout>
    )
  }

  const reviews = getReviewsForProperty(property.id)

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Gallery */}
        <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-xl sm:h-96 sm:grid-cols-4 sm:grid-rows-2">
          <img src={property.images[0]} alt={property.name} className="h-56 w-full object-cover sm:col-span-2 sm:row-span-2 sm:h-full" />
          {property.images.slice(1, 3).map((src, i) => (
            <img key={i} src={src} alt="" className="hidden h-full w-full object-cover sm:block" />
          ))}
        </div>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-ink sm:text-3xl">{property.name}</h1>
              {property.verified && (
                <Badge tone="success">
                  <Check className="me-1 h-3 w-3" />
                  {t('property.verifiedProperty')}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted">
              <StarRating rating={property.rating} />
              <span>({property.reviewsCount} {t('property.reviews').toLowerCase()})</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {property.address}
              </span>
            </div>
          </div>
          <div className="text-start sm:text-end">
            <p className="text-sm text-muted">{t('common.from')}</p>
            <p className="tabular text-2xl font-semibold text-ink">
              {formatCurrency(property.fromPrice, property.currency, i18n.language)}
              <span className="text-sm font-normal text-muted"> {t('property.perNight')}</span>
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {/* About */}
            <section>
              <h2 className="text-lg">{t('property.aboutThisPlace')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-body">{property.description}</p>
            </section>

            {/* Amenities */}
            <section>
              <h2 className="text-lg">{t('property.amenities')}</h2>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {property.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm text-body">
                    <Check className="h-4 w-4 text-forest" />
                    {a}
                  </div>
                ))}
              </div>
            </section>

            {/* Rooms */}
            <section>
              <h2 className="text-lg">{t('property.availableRooms')}</h2>
              <div className="mt-3 space-y-3">
                {property.rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between gap-4 rounded-xl border border-line p-4">
                    <div>
                      <p className="font-medium text-ink">{room.name}</p>
                      <p className="text-sm text-muted">{t('property.capacity', { count: room.capacity })} · {room.amenities.join(', ')}</p>
                    </div>
                    <div className="text-end">
                      <p className="tabular font-semibold text-ink">{formatCurrency(room.price, property.currency, i18n.language)}</p>
                      <Link to={`/book/${property.slug}/${room.id}`}>
                        <Button size="sm" className="mt-1.5">
                          {t('property.reserveNow')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Policies */}
            <section>
              <h2 className="text-lg">{t('property.policies')}</h2>
              <p className="mt-2 text-sm text-body">{property.policies}</p>
              <div className="mt-3 flex gap-6 text-sm text-muted">
                <span>{t('property.checkInTime')}: {property.checkInTime}</span>
                <span>{t('property.checkOutTime')}: {property.checkOutTime}</span>
              </div>
            </section>

            {/* Reviews */}
            <section>
              <h2 className="text-lg">{t('property.reviews')}</h2>
              {!reviews.length ? (
                <p className="mt-2 text-sm text-muted">{t('property.noReviewsYet')}</p>
              ) : (
                <div className="mt-3 space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-line pb-4 last:border-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-ink">{review.guestName}</p>
                        <StarRating rating={review.rating} size={13} />
                      </div>
                      <p className="mt-1 text-xs text-muted">{formatDate(review.date, i18n.language)}</p>
                      <p className="mt-2 text-sm text-body">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="h-fit space-y-4 rounded-xl border border-line p-5">
            <div>
              <p className="text-sm font-medium text-ink">{t('property.contactHost')}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-body">
                <Phone className="h-4 w-4 text-muted" />
                +93 70 111 2233
              </p>
            </div>
            <div className="rounded-lg bg-paper p-3 text-xs text-muted">
              {t('property.location')}: {property.address}
            </div>
            <Link to={`/book/${property.slug}/${property.rooms[0]?.id}`}>
              <Button className="w-full">{t('property.reserveNow')}</Button>
            </Link>
          </aside>
        </div>
      </div>
    </PublicLayout>
  )
}
