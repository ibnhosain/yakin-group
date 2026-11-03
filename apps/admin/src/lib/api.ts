import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// Attach access token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('yakin_access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('yakin_refresh_token')
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken })
        localStorage.setItem('yakin_access_token', data.data.accessToken)
        localStorage.setItem('yakin_refresh_token', data.data.refreshToken)
        if (original.headers) original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('yakin_access_token')
        localStorage.removeItem('yakin_refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('yakin_access_token', accessToken)
  localStorage.setItem('yakin_refresh_token', refreshToken)
}

export function clearTokens() {
  localStorage.removeItem('yakin_access_token')
  localStorage.removeItem('yakin_refresh_token')
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('yakin_access_token')
}
