import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import bookingReducer from "./slices/bookingSlice";
import savedReducer from "./slices/savedSlice";
import { marketplaceApi } from "@/services/marketplaceApi";
const sessionListener = createListenerMiddleware();
sessionListener.startListening({ predicate: action => action.type === 'auth/logout' || action.type === 'auth/loginSuccess', effect: (_action, api) => { api.dispatch(marketplaceApi.util.resetApiState()); } });

export const store = configureStore({
  reducer: {
    auth: authReducer,
    saved: savedReducer,
    bookings: bookingReducer,
    [marketplaceApi.reducerPath]: marketplaceApi.reducer,
  },
  middleware: (getDefault) => getDefault().prepend(sessionListener.middleware).concat(marketplaceApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
window.addEventListener('manzil:session-expired', () => { store.dispatch({ type: 'auth/logout' }); });
