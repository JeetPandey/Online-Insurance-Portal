import axios from 'axios'
import { tokenStorage } from './storage'

// In development, send API requests through Vite's proxy. This keeps the
// browser request same-origin and avoids localhost/127.0.0.1 CORS mismatches.
const baseURL = import.meta.env.VITE_API_URL || '/api'
export const api = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } })
export const authApi = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } })
api.interceptors.request.use((config) => { const token = tokenStorage.getAccess(); if (token) config.headers.Authorization = `Bearer ${token}`; return config })
let refreshPromise
api.interceptors.response.use((response) => response, async (error) => {
  const original = error.config
  if (error.response?.status !== 401 || !original || original._retried || original.url?.includes('fun_call=refresh_token')) return Promise.reject(error)
  const refresh = tokenStorage.getRefresh()
  if (!refresh) { tokenStorage.clear(); window.dispatchEvent(new Event('auth:expired')); return Promise.reject(error) }
  original._retried = true
  try {
    refreshPromise ||= authApi.post('/accounts/?fun_call=refresh_token', { refresh }).then(({ data }) => { const tokens = data.data; tokenStorage.set({ access: tokens.access, refresh: tokens.refresh || refresh }); return tokens.access }).finally(() => { refreshPromise = undefined })
    const access = await refreshPromise
    original.headers.Authorization = `Bearer ${access}`
    return api(original)
  } catch (refreshError) { tokenStorage.clear(); window.dispatchEvent(new Event('auth:expired')); return Promise.reject(refreshError) }
})
const unwrap = (response) => response.data.data
export const authService = {
  async login(credentials) { return unwrap(await authApi.post('/accounts/?fun_call=login', credentials)) },
  async register(values) { return unwrap(await authApi.post('/accounts/?fun_call=register', values)) },
  async currentUser() { return unwrap(await api.get('/accounts/?fun_call=current_user')) },
  async logout(refresh) { return authApi.post('/accounts/?fun_call=logout', { refresh }) },
  async requestPasswordReset(email) { return unwrap(await authApi.post('/accounts/?fun_call=password_reset', { email })) },
  async confirmPasswordReset(values) { return unwrap(await authApi.post('/accounts/?fun_call=password_reset_confirm', values)) },
}
