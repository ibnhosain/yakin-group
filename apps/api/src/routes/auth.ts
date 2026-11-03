import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'
import { signAccessToken, signRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } from '../utils/jwt'
import { sendSuccess, sendError } from '../utils/response'
import { writeAuditLog } from '../utils/audit'
import { authenticate } from '../middleware/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    'Password must contain uppercase, lowercase, number, and special character'),
})

const setup2FASchema = z.object({
  totpCode: z.string().length(6),
})

export async function authRoutes(fastify: FastifyInstance): Promise<void> {

  // POST /api/auth/login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.safeParse(request.body)
    if (!body.success) {
      return sendError(reply, 'Invalid input', 'অবৈধ ইনপুট', 400, body.error.message)
    }
    const { email, password, totpCode } = body.data
    const ip = request.ip
    const ua = request.headers['user-agent']

    const user = await fastify.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    })

    // Account not found
    if (!user || user.deletedAt) {
      await fastify.prisma.loginHistory.create({ data: { userId: user?.id ?? 'unknown', ipAddress: ip, userAgent: ua, status: 'FAILED_PASSWORD' } }).catch(() => {})
      return sendError(reply, 'Invalid email or password', 'ইমেইল বা পাসওয়ার্ড ভুল', 401)
    }

    // Account locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await fastify.prisma.loginHistory.create({ data: { userId: user.id, ipAddress: ip, userAgent: ua, status: 'FAILED_ACCOUNT_LOCKED' } }).catch(() => {})
      return sendError(reply, 'Account locked. Try again later.', 'অ্যাকাউন্ট লক। পরে আবার চেষ্টা করুন।', 423)
    }

    // Account inactive
    if (!user.isActive) {
      await fastify.prisma.loginHistory.create({ data: { userId: user.id, ipAddress: ip, userAgent: ua, status: 'FAILED_ACCOUNT_INACTIVE' } }).catch(() => {})
      return sendError(reply, 'Account inactive', 'অ্যাকাউন্ট নিষ্ক্রিয়', 403)
    }

    // Wrong password
    const passwordOk = await bcrypt.compare(password, user.passwordHash)
    if (!passwordOk) {
      const fails = user.failedLoginCount + 1
      const lockUntil = fails >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : undefined
      await fastify.prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: fails, lockedUntil: lockUntil } })
      await fastify.prisma.loginHistory.create({ data: { userId: user.id, ipAddress: ip, userAgent: ua, status: 'FAILED_PASSWORD' } }).catch(() => {})
      return sendError(reply, 'Invalid email or password', 'ইমেইল বা পাসওয়ার্ড ভুল', 401)
    }

    // 2FA check
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return reply.code(200).send({ success: true, requiresTwoFactor: true, message: '2FA required', messageBn: 'দুই-ধাপ যাচাই প্রয়োজন' })
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: totpCode,
        window: 1,
      })
      if (!verified) {
        await fastify.prisma.loginHistory.create({ data: { userId: user.id, ipAddress: ip, userAgent: ua, status: 'FAILED_2FA' } }).catch(() => {})
        return sendError(reply, 'Invalid 2FA code', 'দুই-ধাপ কোড ভুল', 401)
      }
    }

    // Reset failed count
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: ip },
    })

    // Create refresh token record
    const tokenId = createId()
    const expiresAt = getRefreshTokenExpiry()
    const refreshTokenStr = signRefreshToken({ sub: user.id, tokenId })
    await fastify.prisma.refreshToken.create({ data: { id: tokenId, userId: user.id, token: refreshTokenStr, expiresAt, userAgent: ua, ipAddress: ip } })

    // Log success
    await fastify.prisma.loginHistory.create({ data: { userId: user.id, ipAddress: ip, userAgent: ua, status: 'SUCCESS' } }).catch(() => {})
    await writeAuditLog(fastify.prisma, { userId: user.id, action: 'LOGIN', tableName: 'users', recordId: user.id, ipAddress: ip })

    const permissions = (user.role.permissions as string[])
    const accessToken = signAccessToken({ sub: user.id, email: user.email, roleId: user.roleId, roleName: user.role.name, permissions })

    return sendSuccess(reply, {
      user: {
        id: user.id, email: user.email, phone: user.phone, fullName: user.fullName, fullNameBn: user.fullNameBn,
        avatarUrl: user.avatarUrl, roleId: user.roleId, roleName: user.role.name, permissions,
        isActive: user.isActive, twoFactorEnabled: user.twoFactorEnabled,
      },
      tokens: { accessToken, refreshToken: refreshTokenStr, expiresIn: 900 },
    }, 'Login successful', 'লগইন সফল')
  })

  // POST /api/auth/refresh
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = refreshSchema.safeParse(request.body)
    if (!body.success) return sendError(reply, 'Invalid input', 'অবৈধ ইনপুট', 400)

    let payload
    try {
      payload = verifyRefreshToken(body.data.refreshToken)
    } catch {
      return sendError(reply, 'Invalid or expired refresh token', 'টোকেন অবৈধ', 401)
    }

    const tokenRecord = await fastify.prisma.refreshToken.findUnique({ where: { id: payload.tokenId } })
    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      return sendError(reply, 'Refresh token revoked or expired', 'টোকেন বাতিল বা মেয়াদোত্তীর্ণ', 401)
    }

    const user = await fastify.prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } })
    if (!user || !user.isActive) return sendError(reply, 'User not found or inactive', 'ব্যবহারকারী পাওয়া যায়নি', 401)

    // Rotate: revoke old, issue new
    await fastify.prisma.refreshToken.update({ where: { id: payload.tokenId }, data: { isRevoked: true } })

    const tokenId = createId()
    const expiresAt = getRefreshTokenExpiry()
    const newRefreshToken = signRefreshToken({ sub: user.id, tokenId })
    await fastify.prisma.refreshToken.create({ data: { id: tokenId, userId: user.id, token: newRefreshToken, expiresAt, userAgent: request.headers['user-agent'], ipAddress: request.ip } })

    const permissions = user.role.permissions as string[]
    const accessToken = signAccessToken({ sub: user.id, email: user.email, roleId: user.roleId, roleName: user.role.name, permissions })

    return sendSuccess(reply, { accessToken, refreshToken: newRefreshToken, expiresIn: 900 }, 'Token refreshed', 'টোকেন নবায়ন হয়েছে')
  })

  // POST /api/auth/logout
  fastify.post('/logout', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = refreshSchema.safeParse(request.body)
    if (body.success) {
      const tokenRecord = await fastify.prisma.refreshToken.findUnique({ where: { token: body.data.refreshToken } })
      if (tokenRecord) {
        await fastify.prisma.refreshToken.update({ where: { id: tokenRecord.id }, data: { isRevoked: true } })
      }
    }
    await writeAuditLog(fastify.prisma, { userId: request.user.sub, action: 'LOGOUT', tableName: 'users', recordId: request.user.sub, ipAddress: request.ip })
    return sendSuccess(reply, null, 'Logged out', 'লগআউট সফল')
  })

  // GET /api/auth/me
  fastify.get('/me', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.sub },
      include: { role: true },
      select: { id: true, email: true, phone: true, fullName: true, fullNameBn: true, avatarUrl: true, roleId: true, isActive: true, twoFactorEnabled: true, role: { select: { name: true, displayName: true, displayNameEn: true, permissions: true } } }
    })
    if (!user) return sendError(reply, 'User not found', 'ব্যবহারকারী পাওয়া যায়নি', 404)
    return sendSuccess(reply, user)
  })

  // POST /api/auth/change-password
  fastify.post('/change-password', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = changePasswordSchema.safeParse(request.body)
    if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

    const user = await fastify.prisma.user.findUnique({ where: { id: request.user.sub } })
    if (!user) return sendError(reply, 'User not found', 'ব্যবহারকারী পাওয়া যায়নি', 404)

    const ok = await bcrypt.compare(body.data.currentPassword, user.passwordHash)
    if (!ok) return sendError(reply, 'Current password incorrect', 'বর্তমান পাসওয়ার্ড ভুল', 400)

    const newHash = await bcrypt.hash(body.data.newPassword, 12)
    await fastify.prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })

    // Revoke all refresh tokens
    await fastify.prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { isRevoked: true } })
    await writeAuditLog(fastify.prisma, { userId: user.id, action: 'CHANGE_PASSWORD', tableName: 'users', recordId: user.id, ipAddress: request.ip })

    return sendSuccess(reply, null, 'Password changed', 'পাসওয়ার্ড পরিবর্তন হয়েছে')
  })

  // POST /api/auth/setup-2fa  — generate secret
  fastify.post('/setup-2fa', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const secret = speakeasy.generateSecret({ name: `Yakin Group (${request.user.email})`, length: 20 })
    await fastify.prisma.user.update({ where: { id: request.user.sub }, data: { twoFactorSecret: secret.base32 } })
    return sendSuccess(reply, { secret: secret.base32, otpauthUrl: secret.otpauth_url }, 'Scan QR with authenticator app', 'অথেনটিকেটর অ্যাপ দিয়ে QR স্ক্যান করুন')
  })

  // POST /api/auth/enable-2fa  — verify and enable
  fastify.post('/enable-2fa', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = setup2FASchema.safeParse(request.body)
    if (!body.success) return sendError(reply, 'Invalid code', 'কোড অবৈধ', 400)

    const user = await fastify.prisma.user.findUnique({ where: { id: request.user.sub } })
    if (!user?.twoFactorSecret) return sendError(reply, 'Setup 2FA first', 'আগে 2FA সেটআপ করুন', 400)

    const ok = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: body.data.totpCode, window: 1 })
    if (!ok) return sendError(reply, 'Invalid code', 'কোড ভুল', 400)

    await fastify.prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } })
    await writeAuditLog(fastify.prisma, { userId: user.id, action: 'ENABLE_2FA', tableName: 'users', recordId: user.id })

    return sendSuccess(reply, null, '2FA enabled', 'দুই-ধাপ যাচাই চালু হয়েছে')
  })

  // POST /api/auth/disable-2fa
  fastify.post('/disable-2fa', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = setup2FASchema.safeParse(request.body)
    if (!body.success) return sendError(reply, 'Invalid code', 'কোড অবৈধ', 400)

    const user = await fastify.prisma.user.findUnique({ where: { id: request.user.sub } })
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) return sendError(reply, '2FA not enabled', 'দুই-ধাপ যাচাই চালু নেই', 400)

    const ok = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: body.data.totpCode, window: 1 })
    if (!ok) return sendError(reply, 'Invalid code', 'কোড ভুল', 400)

    await fastify.prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
    await writeAuditLog(fastify.prisma, { userId: user.id, action: 'DISABLE_2FA', tableName: 'users', recordId: user.id })

    return sendSuccess(reply, null, '2FA disabled', 'দুই-ধাপ যাচাই বন্ধ হয়েছে')
  })
}
