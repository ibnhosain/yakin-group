import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../middleware/auth'
import { sendSuccess, sendPaginated } from '../utils/response'

export async function notificationRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/notifications
  fastify.get('/', { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Querystring: { limit?: string; unreadOnly?: string } }>, reply: FastifyReply) => {
      const { limit = '30', unreadOnly } = req.query
      const l = Math.min(parseInt(limit), 100)
      const where: Record<string, unknown> = {
        OR: [{ userId: req.user.sub }, { userId: null }],
      }
      if (unreadOnly === 'true') where.isRead = false

      const [notifications, total] = await Promise.all([
        fastify.prisma.notification.findMany({
          where, take: l,
          orderBy: { createdAt: 'desc' },
        }),
        fastify.prisma.notification.count({ where }),
      ])

      const data = notifications.map(n => ({
        id: n.id, type: n.type, title: n.title, titleBn: n.titleBn,
        body: n.body, bodyBn: n.bodyBn, isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }))

      return sendPaginated(reply, data, total, 1, l)
    }
  )

  // PATCH /api/notifications/:id/read
  fastify.patch('/:id/read', { preHandler: [authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await fastify.prisma.notification.updateMany({
        where: { id: req.params.id, OR: [{ userId: req.user.sub }, { userId: null }] },
        data: { isRead: true, readAt: new Date() },
      })
      return sendSuccess(reply, null, 'Marked as read', 'পঠিত চিহ্নিত হয়েছে')
    }
  )

  // PATCH /api/notifications/mark-all-read
  fastify.patch('/mark-all-read', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      await fastify.prisma.notification.updateMany({
        where: { OR: [{ userId: req.user.sub }, { userId: null }], isRead: false },
        data: { isRead: true, readAt: new Date() },
      })
      return sendSuccess(reply, null, 'All marked as read', 'সব বিজ্ঞপ্তি পঠিত হয়েছে')
    }
  )
}
