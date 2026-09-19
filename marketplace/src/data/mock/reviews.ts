export interface Review {
  id: string
  propertyId: string
  guestName: string
  rating: number
  comment: string
  date: string
}

export const mockReviews: Review[] = [
  { id: 'rv1', propertyId: 'p1', guestName: 'Sarah W.', rating: 5, comment: 'Quiet, clean, and the staff were incredibly welcoming. The garden was a lovely surprise.', date: '2026-08-02' },
  { id: 'rv2', propertyId: 'p1', guestName: 'Rohullah S.', rating: 4, comment: 'Good value for the price. Breakfast could have more variety.', date: '2026-07-15' },
  { id: 'rv3', propertyId: 'p2', guestName: 'James C.', rating: 5, comment: 'Best hotel I have stayed at in Kabul. Central location and excellent service.', date: '2026-08-20' },
  { id: 'rv4', propertyId: 'p3', guestName: 'Mirwais A.', rating: 4, comment: 'Great for students, close to campus. Wi-Fi could be faster during peak hours.', date: '2026-06-30' },
  { id: 'rv5', propertyId: 'p4', guestName: 'Elena P.', rating: 5, comment: 'Felt very safe and the generator backup meant we never lost power.', date: '2026-08-10' },
]

export function getReviewsForProperty(propertyId: string) {
  return mockReviews.filter((r) => r.propertyId === propertyId)
}
