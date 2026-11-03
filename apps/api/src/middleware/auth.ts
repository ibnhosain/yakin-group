import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt'

declare module 'fastify' {
  interface FastifyRequest {
    user: AccessTokenPayload
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({ success: false, message: 'Unauthorized', messageBn: 'অনুমোদিত নয়' })
    return
  }
  const token = authHeader.slice(7)
  try {
    const payload = verifyAccessToken(token)
    request.user = payload
  } catch {
    reply.code(401).send({ success: false, message: 'Invalid or expired token', messageBn: 'টোকেন অবৈধ বা মেয়াদোত্তীর্ণ' })
  }
}
