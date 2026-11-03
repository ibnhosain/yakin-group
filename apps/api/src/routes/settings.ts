import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import { sendSuccess } from '../utils/response'
import { writeAuditLog } from '../utils/audit'

export async function settingsRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/settings
  fastify.get('/', { preHandler: [authenticate, requireRole('SUPER_ADMIN', 'ADMIN')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const settings = await fastify.prisma.systemSetting.findMany({
        orderBy: [{ group: 'asc' }, { key: 'asc' }],
      })
      return sendSuccess(reply, settings, 'Settings fetched', 'সেটিংস পাওয়া গেছে')
    }
  )

  // PATCH /api/settings
  fastify.patch('/', { preHandler: [authenticate, requireRole('SUPER_ADMIN', 'ADMIN')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as { settings: Record<string, string> }
      if (!body?.settings || typeof body.settings !== 'object') {
        return sendSuccess(reply, null, 'No settings to update', 'কোনো আপডেট নেই')
      }

      const updates = await Promise.all(
        Object.entries(body.settings).map(([key, value]) =>
          fastify.prisma.systemSetting.updateMany({ where: { key }, data: { value } })
        )
      )

      await writeAuditLog(fastify.prisma, {
        userId: req.user.sub, action: 'UPDATE_SETTINGS',
        tableName: 'system_settings', recordId: 'bulk',
        newData: body.settings, ipAddress: req.ip,
      })

      return sendSuccess(reply, { updated: updates.length }, 'Settings updated', 'সেটিংস আপডেট হয়েছে')
    }
  )
}
