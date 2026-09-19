import { configureStore } from '@reduxjs/toolkit'

import authReducer from './slices/authSlice'
import bookingReducer from './slices/bookingSlice'
import savedReducer from './slices/savedSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    saved: savedReducer,
    bookings: bookingReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
