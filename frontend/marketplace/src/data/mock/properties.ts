export type AccommodationType = 'hotel' | 'hostel' | 'dormitory' | 'guesthouse' | 'room' | 'apartment'

export interface PropertyRoomOption {
  id: string
  name: string
  capacity: number
  price: number
  amenities: string[]
}

export interface Property {
  id: string
  slug: string
  name: string
  type: AccommodationType
  area: string
  address: string
  description: string
  rating: number
  reviewsCount: number
  fromPrice: number
  currency: 'AFN'
  verified: boolean
  amenities: string[]
  images: string[]
  checkInTime: string
  checkOutTime: string
  policies: string
  latitude: number
  longitude: number
  rooms: PropertyRoomOption[]
}

const img = (seed: string, n: number) => `https://picsum.photos/seed/manzil-${seed}-${n}/800/600`

export const mockProperties: Property[] = [
  {
    id: 'p1',
    slug: 'bagh-e-bala-guesthouse',
    name: 'Bagh-e-Bala Guesthouse',
    type: 'hotel',
    area: 'Bagh-e-Bala',
    address: 'Street 3, Bagh-e-Bala, Kabul',
    description:
      'A quiet family-run guesthouse near Bagh-e-Bala Palace, offering comfortable rooms for business and leisure travelers with a peaceful garden courtyard.',
    rating: 4.6,
    reviewsCount: 128,
    fromPrice: 1800,
    currency: 'AFN',
    verified: true,
    amenities: ['Free Wi-Fi', 'Breakfast included', 'Parking', 'Garden', '24h reception', 'Air conditioning'],
    images: [img('baghebala', 1), img('baghebala', 2), img('baghebala', 3)],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    policies: 'Free cancellation up to 24 hours before check-in. No pets. No smoking indoors.',
    latitude: 34.5470,
    longitude: 69.1660,
    rooms: [
      { id: 'p1r1', name: 'Standard Twin', capacity: 2, price: 1800, amenities: ['Wi-Fi', 'AC', 'Ensuite bathroom'] },
      { id: 'p1r2', name: 'Deluxe Double', capacity: 2, price: 2600, amenities: ['Wi-Fi', 'AC', 'Balcony'] },
      { id: 'p1r3', name: 'Family Suite', capacity: 4, price: 4200, amenities: ['Wi-Fi', 'AC', 'Living area'] },
    ],
  },
  {
    id: 'p2',
    slug: 'shahr-e-naw-boutique-hotel',
    name: 'Shahr-e-Naw Boutique Hotel',
    type: 'hotel',
    area: 'Shahr-e-Naw',
    address: 'Charahi Sedarat, Shahr-e-Naw, Kabul',
    description: 'Modern boutique hotel in the heart of Shahr-e-Naw, walking distance to restaurants, shops and Zarnegar Park.',
    rating: 4.8,
    reviewsCount: 214,
    fromPrice: 3200,
    currency: 'AFN',
    verified: true,
    amenities: ['Free Wi-Fi', 'Restaurant', 'Elevator', 'Gym', '24h reception', 'Airport transfer'],
    images: [img('shahrenaw', 1), img('shahrenaw', 2), img('shahrenaw', 3)],
    checkInTime: '15:00',
    checkOutTime: '12:00',
    policies: 'Free cancellation up to 48 hours before check-in. Pets not allowed.',
    latitude: 34.5390,
    longitude: 69.1780,
    rooms: [
      { id: 'p2r1', name: 'Business Single', capacity: 1, price: 3200, amenities: ['Wi-Fi', 'Work desk'] },
      { id: 'p2r2', name: 'Executive Double', capacity: 2, price: 4500, amenities: ['Wi-Fi', 'City view'] },
    ],
  },
  {
    id: 'p3',
    slug: 'karte-char-student-hostel',
    name: 'Karte Char Student Hostel',
    type: 'hostel',
    area: 'Karte Char',
    address: 'Near Kabul University, Karte Char, Kabul',
    description: 'Budget-friendly hostel popular with students and young travelers, five minutes from Kabul University.',
    rating: 4.2,
    reviewsCount: 96,
    fromPrice: 700,
    currency: 'AFN',
    verified: true,
    amenities: ['Free Wi-Fi', 'Shared kitchen', 'Laundry', 'Study room', '24h reception'],
    images: [img('kartechar', 1), img('kartechar', 2), img('kartechar', 3)],
    checkInTime: '13:00',
    checkOutTime: '11:00',
    policies: 'Free cancellation up to 24 hours before check-in. Quiet hours after 10pm.',
    latitude: 34.5140,
    longitude: 69.1330,
    rooms: [
      { id: 'p3r1', name: 'Shared Dorm Bed', capacity: 1, price: 700, amenities: ['Wi-Fi', 'Locker'] },
      { id: 'p3r2', name: 'Private Single', capacity: 1, price: 1400, amenities: ['Wi-Fi', 'Desk'] },
    ],
  },
  {
    id: 'p4',
    slug: 'wazir-akbar-khan-residence',
    name: 'Wazir Akbar Khan Residence',
    type: 'guesthouse',
    area: 'Wazir Akbar Khan',
    address: 'Street 10, Wazir Akbar Khan, Kabul',
    description: 'Secure, upscale guesthouse in the diplomatic quarter, favored by business travelers and NGO staff.',
    rating: 4.7,
    reviewsCount: 61,
    fromPrice: 3800,
    currency: 'AFN',
    verified: true,
    amenities: ['Free Wi-Fi', 'Generator backup', 'Security', 'Breakfast included', 'Parking'],
    images: [img('wazirakbarkhan', 1), img('wazirakbarkhan', 2), img('wazirakbarkhan', 3)],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    policies: 'Free cancellation up to 72 hours before check-in.',
    latitude: 34.5250,
    longitude: 69.1870,
    rooms: [
      { id: 'p4r1', name: 'Standard Room', capacity: 2, price: 3800, amenities: ['Wi-Fi', 'Generator'] },
      { id: 'p4r2', name: 'Executive Suite', capacity: 3, price: 5600, amenities: ['Wi-Fi', 'Living area'] },
    ],
  },
  {
    id: 'p5',
    slug: 'taimani-family-dormitory',
    name: 'Taimani Family Dormitory',
    type: 'dormitory',
    area: 'Taimani',
    address: 'Street 2, Taimani, Kabul',
    description: 'Affordable long-stay dormitory for students and workers, with monthly and daily pricing options.',
    rating: 4.0,
    reviewsCount: 43,
    fromPrice: 350,
    currency: 'AFN',
    verified: true,
    amenities: ['Wi-Fi', 'Shared kitchen', 'Laundry', 'Meals available'],
    images: [img('taimani', 1), img('taimani', 2), img('taimani', 3)],
    checkInTime: '12:00',
    checkOutTime: '11:00',
    policies: 'Monthly stays preferred. 7-day notice for move-out.',
    latitude: 34.5330,
    longitude: 69.1500,
    rooms: [
      { id: 'p5r1', name: 'Shared Bed (male)', capacity: 1, price: 350, amenities: ['Wi-Fi'] },
      { id: 'p5r2', name: 'Shared Bed (female)', capacity: 1, price: 350, amenities: ['Wi-Fi'] },
    ],
  },
  {
    id: 'p6',
    slug: 'qala-e-fatullah-apartments',
    name: 'Qala-e-Fatullah Serviced Apartments',
    type: 'apartment',
    area: 'Qala-e-Fatullah',
    address: 'Street 6, Qala-e-Fatullah, Kabul',
    description: 'Self-contained serviced apartments ideal for longer business stays, with kitchenettes and weekly cleaning.',
    rating: 4.5,
    reviewsCount: 37,
    fromPrice: 2900,
    currency: 'AFN',
    verified: false,
    amenities: ['Free Wi-Fi', 'Kitchenette', 'Weekly cleaning', 'Parking'],
    images: [img('qalaefatullah', 1), img('qalaefatullah', 2), img('qalaefatullah', 3)],
    checkInTime: '15:00',
    checkOutTime: '12:00',
    policies: 'Minimum stay 3 nights. Free cancellation up to 5 days before check-in.',
    latitude: 34.5300,
    longitude: 69.1690,
    rooms: [
      { id: 'p6r1', name: 'One-bedroom apartment', capacity: 2, price: 2900, amenities: ['Kitchenette', 'Wi-Fi'] },
      { id: 'p6r2', name: 'Two-bedroom apartment', capacity: 4, price: 4600, amenities: ['Kitchenette', 'Wi-Fi'] },
    ],
  },
]

export function getPropertyBySlug(slug: string) {
  return mockProperties.find((p) => p.slug === slug)
}
