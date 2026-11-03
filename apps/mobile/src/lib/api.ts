import axios, { AxiosInstance } from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

const TOKEN_KEY = 'yakin_access_token'
const REFRESH_KEY = 'yakin_refresh_token'

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY)
        if (!refreshToken) throw new Error('no token')
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken })
        await SecureStore.setItemAsync(TOKEN_KEY, data.data.accessToken)
        await SecureStore.setItemAsync(REFRESH_KEY, data.data.refreshToken)
        original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY)
        await SecureStore.deleteItemAsync(REFRESH_KEY)
        // Redirect to login handled by Expo Router layout
      }
    }
    return Promise.reject(error)
  }
)

export async function setTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken)
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(REFRESH_KEY)
}

export async function hasToken(): Promise<boolean> {
  const t = await SecureStore.getItemAsync(TOKEN_KEY)
  return !!t
}
