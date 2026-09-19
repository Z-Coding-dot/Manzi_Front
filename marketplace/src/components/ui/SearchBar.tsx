import { MapPin, Search, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [location, setLocation] = useState(params.get('location') ?? '')
  const [checkIn, setCheckIn] = useState(params.get('checkIn') ?? '')
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? '')
  const [guests, setGuests] = useState(params.get('guests') ?? '2')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next = new URLSearchParams()
    if (location) next.set('location', location)
    if (checkIn) next.set('checkIn', checkIn)
    if (checkOut) next.set('checkOut', checkOut)
    if (guests) next.set('guests', guests)
    navigate(`/search?${next.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? 'flex flex-col gap-2 rounded-xl border border-line bg-surface p-2 shadow-sm sm:flex-row sm:items-center'
          : 'flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-xl sm:flex-row sm:items-center'
      }
    >
      <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2.5 sm:border-e sm:border-line">
        <MapPin className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('home.locationPlaceholder')}
          className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </div>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 sm:border-e sm:border-line">
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full min-w-0 bg-transparent text-sm text-ink outline-none"
          aria-label={t('home.checkIn')}
        />
      </div>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 sm:border-e sm:border-line">
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full min-w-0 bg-transparent text-sm text-ink outline-none"
          aria-label={t('home.checkOut')}
        />
      </div>
      <div className="flex items-center gap-2 rounded-lg px-3 py-2.5">
        <Users className="h-4 w-4 shrink-0 text-muted" />
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="w-14 bg-transparent text-sm text-ink outline-none"
          aria-label={t('common.guests')}
        />
      </div>
      <Button type="submit" size="lg" className="shrink-0">
        <Search className="h-4 w-4" />
        {t('home.searchCta')}
      </Button>
    </form>
  )
}
