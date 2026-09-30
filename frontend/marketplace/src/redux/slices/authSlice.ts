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

const storedUser = localStorage.getItem("manzil_marketplace_user");
const initialUser = storedUser
  ? (JSON.parse(storedUser) as CustomerUser)
  : null;

const initialState: AuthState = {
  user: initialUser,
  isAuthenticated: Boolean(
    localStorage.getItem("manzil_access_token") && initialUser,
  ),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<CustomerUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem(
        "manzil_marketplace_user",
        JSON.stringify(action.payload),
      );
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("manzil_access_token");
      localStorage.removeItem("manzil_refresh_token");
      localStorage.removeItem("manzil_marketplace_user");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
