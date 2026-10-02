import { clearSession, sessionStorageForAuth } from './session'
import axios, { type InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? '/api/v1'
export const httpClient = axios.create({ baseURL, timeout: 15000 })
let refreshing: Promise<void> | null = null
export function refreshSession(): Promise<void> {
  if (refreshing) return refreshing
  const storage = sessionStorageForAuth();
  const refreshToken = storage.getItem('manzil_refresh_token')
  if (!refreshToken) return Promise.reject(new Error('Sign in required'))
  refreshing = axios.post<{ accessToken: string; refreshToken: string }>(`${baseURL}/auth/refresh`, { refreshToken }, { timeout: 15000 }).then(({ data }) => {
    // A sign-out or account switch during the request must never restore the old session.
    if (storage.getItem('manzil_refresh_token') !== refreshToken) throw new Error('Session changed')
    storage.setItem('manzil_access_token', data.accessToken)
    storage.setItem('manzil_refresh_token', data.refreshToken)
  }).catch(error => {
    if (storage.getItem('manzil_refresh_token') === refreshToken && axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
      storage.removeItem('manzil_access_token')
      storage.removeItem('manzil_refresh_token')
      window.dispatchEvent(new Event('manzil:session-expired'))
    }
    throw error
  }).finally(() => { refreshing = null })
  return refreshing
}
httpClient.interceptors.request.use(config => {
  const token = sessionStorageForAuth().getItem('manzil_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
httpClient.interceptors.response.use(response => response, async error => {
  const config = error.config as (InternalAxiosRequestConfig & { retried?: boolean }) | undefined
  if (error.response?.status !== 401 || !config || config.retried || config.url?.startsWith('/auth/')) throw error
  if (!sessionStorageForAuth().getItem('manzil_refresh_token')) {
    clearSession();
    window.dispatchEvent(new Event('manzil:session-expired'));
    throw error;
  }
  config.retried = true
  const latest = sessionStorageForAuth().getItem('manzil_access_token')
  if (config.headers.Authorization === `Bearer ${latest}`) await refreshSession()
  config.headers.Authorization = `Bearer ${sessionStorageForAuth().getItem('manzil_access_token')}`
  return httpClient.request(config)
})
