import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface BookingRecord {
  id: string
  propertySlug: string
  propertyName: string
  roomName: string
  checkIn: string
  checkOut: string
  guestsCount: number
  guestName: string
  guestPhone: string
  paymentMethod: 'cash' | 'hesabpay' | 'afpay'
  total: number
  status: 'confirmed' | 'cancelled'
  createdAt: string
}

interface BookingState {
  reservations: BookingRecord[]
}

const initialState: BookingState = { reservations: [] }

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    addBooking(state, action: PayloadAction<BookingRecord>) {
      state.reservations.unshift(action.payload)
    },
    cancelBooking(state, action: PayloadAction<string>) {
      const res = state.reservations.find((r) => r.id === action.payload)
      if (res) res.status = 'cancelled'
    },
  },
})

export const { addBooking, cancelBooking } = bookingSlice.actions
export default bookingSlice.reducer
