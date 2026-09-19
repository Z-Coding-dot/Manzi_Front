import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface CustomerUser {
  id: string
  name: string
  email: string
  language: string
}

interface AuthState {
  user: CustomerUser | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<CustomerUser>) {
      state.user = action.payload
      state.isAuthenticated = true
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
