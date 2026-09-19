import { Star } from 'lucide-react'

import { cn } from '@/utils/cn'

export function StarRating({ rating, size = 14, showValue = true }: { rating: number; size?: number; showValue?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star size={size} className="fill-sand text-sand" />
      {showValue && <span className="tabular text-sm font-medium text-ink">{rating.toFixed(1)}</span>}
    </span>
  )
}

export function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} stars`}>
          <Star size={22} className={cn(n <= value ? 'fill-sand text-sand' : 'text-line')} />
        </button>
      ))}
    </div>
  )
}
