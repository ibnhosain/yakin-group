import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'

const createSchema = z.object({
  title: z.string().min(2),
  titleBn: z.string().optional(),
  type: z.enum(['BOARD', 'GENERAL', 'EMERGENCY', 'COMMITTEE', 'TEAM']).default('BOARD'),
  scheduledAt: z.string(),
  venue: z.string().optional(),
  agenda: z.string().optional(),
  agendaBn: z.string().optional(),
})

export async function meetingRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/meetings
  fastify.get('/', { preHandler: [authenticate, requirePermission('meetings:read')] },
    async (req: FastifyRequest<{ Querystring: { status?: string; type?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
      const { status, type, page = '1', limit = '20' } = req.query
      const p = parseInt(page); const l = parseInt(limit)
      const where: Record<string, unknown> = {}
      if (status) where.status = status
      if (type) where.type = type

      const [meetings, total] = await Promise.all([
        fastify.prisma.meeting.findMany({
          where, skip: (p - 1) * l, take: l,
          orderBy: { scheduledAt: 'desc' },
          include: {
            organizer: { select: { fullName: true } },
            _count: { select: { attendees: true } },
          },
        }),
        fastify.prisma.meeting.count({ where }),
      ])

      const data = meetings.map(m => ({
        id: m.id, title: m.title, titleBn: m.titleBn, type: m.type,
        status: m.status, scheduledAt: m.scheduledAt.toISOString(),
        venue: m.venue, organizerName: m.organizer.fullName,
        attendeeCount: m._count.attendees,
      }))

      return sendPaginated(reply, data, total, p, l)
    }
  )

  // GET /api/meetings/:id
  fastify.get('/:id', { preHandler: [authenticate, requirePermission('meetings:read')] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const meeting = await fastify.prisma.meeting.findUnique({
        where: { id: req.params.id },
        include: {
          organizer: { select: { fullName: true, fullNameBn: true } },
          attendees: { include: { user: { select: { fullName: true, fullNameBn: true } } } },
        },
      })
      if (!meeting) return sendError(reply, 'Meeting not found', 'সভা পাওয়া যায়নি', 404)
      return sendSuccess(reply, meeting)
    }
  )

  // POST /api/meetings
  fastify.post('/', { preHandler: [authenticate, requirePermission('meetings:create')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = createSchema.safeParse(req.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const meeting = await fastify.prisma.meeting.create({
        data: {
          ...body.data,
          scheduledAt: new Date(body.data.scheduledAt),
          organizerId: req.user.sub,
        },
      })

      await writeAuditLog(fastify.prisma, {
        userId: req.user.sub, action: 'CREATE_MEETING',
        tableName: 'meetings', recordId: meeting.id,
        newData: body.data, ipAddress: req.ip,
      })

      return sendSuccess(reply, { id: meeting.id }, 'Meeting scheduled', 'সভা নির্ধারিত হয়েছে', 201)
    }
  )

  // PATCH /api/meetings/:id/status
  fastify.patch('/:id/status', { preHandler: [authenticate, requirePermission('meetings:manage')] },
    async (req: FastifyRequest<{ Params: { id: string }; Body: { status: string; minutes?: string; decisions?: string } }>, reply: FastifyReply) => {
      const { status, minutes, decisions } = req.body as { status: string; minutes?: string; decisions?: string }
      const meeting = await fastify.prisma.meeting.findUnique({ where: { id: req.params.id } })
      if (!meeting) return sendError(reply, 'Meeting not found', 'সভা পাওয়া যায়নি', 404)

      const updated = await fastify.prisma.meeting.update({
        where: { id: meeting.id },
        data: { status: status as any, ...(minutes && { minutes }), ...(decisions && { decisions }) },
      })

      return sendSuccess(reply, { status: updated.status }, 'Meeting updated', 'সভা আপডেট হয়েছে')
    }
  )
}
