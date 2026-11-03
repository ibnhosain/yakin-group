import jwt from 'jsonwebtoken'
import { config } from '../config'

export interface AccessTokenPayload {
  sub: string        // user id
  email: string
  roleId: string
  roleName: string
  permissions: string[]
  type: 'access'
}

export interface RefreshTokenPayload {
  sub: string
  tokenId: string    // RefreshToken.id for revocation
  type: 'refresh'
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as string,
  })
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as string,
  })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload
}

export function getAccessTokenExpiry(): Date {
  const match = config.jwt.accessExpiresIn.match(/^(\d+)([smhd])$/)
  if (!match) return new Date(Date.now() + 15 * 60 * 1000)
  const [, n, unit] = match
  const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit as 's'|'m'|'h'|'d']!
  return new Date(Date.now() + parseInt(n) * ms)
}

export function getRefreshTokenExpiry(): Date {
  const match = config.jwt.refreshExpiresIn.match(/^(\d+)([smhd])$/)
  if (!match) return new Date(Date.now() + 7 * 86400 * 1000)
  const [, n, unit] = match
  const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit as 's'|'m'|'h'|'d']!
  return new Date(Date.now() + parseInt(n) * ms)
}
