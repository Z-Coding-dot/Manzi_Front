import { clearSession, sessionStorageForAuth } from '@/api/session';
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  language: string;
}

interface AuthState {
  user: CustomerUser | null;
  isAuthenticated: boolean;
}

const storedUser = sessionStorageForAuth().getItem("manzil_marketplace_user");
const initialUser = storedUser
  ? (JSON.parse(storedUser) as CustomerUser)
  : null;

const initialState: AuthState = {
  user: initialUser,
  isAuthenticated: Boolean(
    sessionStorageForAuth().getItem("manzil_access_token") && initialUser,
  ),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<CustomerUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      sessionStorageForAuth().setItem(
        "manzil_marketplace_user",
        JSON.stringify(action.payload),
      );
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      clearSession();
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
