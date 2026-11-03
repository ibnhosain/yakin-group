import { FastifyRequest, FastifyReply } from 'fastify'
import { hasPermission } from '@yakin/utils'

// Factory: returns a preHandler hook that checks the required permission
export function requirePermission(permission: string) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      reply.code(401).send({ success: false, message: 'Unauthorized', messageBn: 'অনুমোদিত নয়' })
      return
    }
    if (!hasPermission(request.user.permissions, permission)) {
      reply.code(403).send({
        success: false,
        message: `Forbidden: requires permission '${permission}'`,
        messageBn: 'অ্যাক্সেস নিষিদ্ধ — প্রয়োজনীয় অনুমতি নেই',
      })
    }
  }
}

// Roles that automatically have super access
export function requireRole(...roleNames: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      reply.code(401).send({ success: false, message: 'Unauthorized', messageBn: 'অনুমোদিত নয়' })
      return
    }
    if (!roleNames.includes(request.user.roleName) && request.user.roleName !== 'super_admin') {
      reply.code(403).send({
        success: false,
        message: 'Forbidden: insufficient role',
        messageBn: 'অ্যাক্সেস নিষিদ্ধ — পদমর্যাদা অপর্যাপ্ত',
      })
    }
  }
}
