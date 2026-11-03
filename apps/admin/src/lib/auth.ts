'use client'
import { api, setTokens, clearTokens } from './api'
import { AuthUser, LoginRequest, LoginResponse } from '@yakin/types'

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<{ success: boolean; data: LoginResponse }>('/api/auth/login', credentials)
  if (data.data.tokens) {
    setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken)
  }
  return data.data
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('yakin_refresh_token')
  try { await api.post('/api/auth/logout', { refreshToken }) } catch {}
  clearTokens()
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<{ data: AuthUser }>('/api/auth/me')
  return data.data
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('yakin_access_token')
}
