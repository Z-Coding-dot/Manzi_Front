import dayjs from 'dayjs'
import jalaliday from 'jalaliday'

dayjs.extend(jalaliday)

export function formatDate(date: string | Date, lang: string): string {
  const useJalali = lang !== 'en'
  const d = dayjs(date)
  if (useJalali) {
    return d.calendar('jalali').locale('fa').format('YYYY/MM/DD')
  }
  return d.format('MMM D, YYYY')
}
