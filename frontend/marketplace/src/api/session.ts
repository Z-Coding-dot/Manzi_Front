const KEYS = ['manzil_access_token', 'manzil_refresh_token', 'manzil_provider_user', 'manzil_marketplace_user', 'manzil_provider_property_id'];
export function sessionStorageForAuth(): Storage {
  return sessionStorage.getItem('manzil_access_token') ? sessionStorage : localStorage;
}
export function clearSession() {
  for (const storage of [localStorage, sessionStorage]) for (const key of KEYS) storage.removeItem(key);
}
export function saveSession(accessToken: string, refreshToken: string, remember: boolean) {
  clearSession();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('manzil_access_token', accessToken);
  storage.setItem('manzil_refresh_token', refreshToken);
}
