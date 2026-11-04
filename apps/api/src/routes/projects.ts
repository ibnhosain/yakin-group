import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'

const createSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(2),
  nameBn: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  budget: z.number().int().default(0),
  estimatedCost: z.number().int().default(0),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
})

export async function projectRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/projects
  fastify.get('/', { preHandler: [authenticate, requirePermission('projects:read')] },
    async (req: FastifyRequest<{ Querystring: { search?: string; status?: string; businessId?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
      const { search, status, businessId, page = '1', limit = '20' } = req.query
      const p = parseInt(page); const l = parseInt(limit)
      const where: Record<string, unknown> = { deletedAt: null }
      if (status) where.status = status
      if (businessId) where.businessId = businessId
      if (search) where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameBn: { contains: search } },
      ]

      const [projects, total] = await Promise.all([
        fastify.prisma.project.findMany({
          where, skip: (p - 1) * l, take: l,
          orderBy: { createdAt: 'desc' },
          include: {
            business: { select: { name: true, nameBn: true } },
            _count: { select: { tasks: true } },
          },
        }),
        fastify.prisma.project.count({ where }),
      ])

      const data = projects.map(proj => ({
        id: proj.id, name: proj.name, nameBn: proj.nameBn,
        businessName: proj.business.nameBn ?? proj.business.name,
        status: proj.status, progressPercent: proj.progressPercent,
        budget: proj.budget, actualExpenses: proj.actualExpenses,
        taskCount: proj._count.tasks,
        startDate: proj.startDate?.toISOString() ?? null,
        expectedEndDate: proj.expectedEndDate?.toISOString() ?? null,
        createdAt: proj.createdAt.toISOString(),
      }))

      return sendPaginated(reply, data, total, p, l)
    }
  )

  // GET /api/projects/:id
  fastify.get('/:id', { preHandler: [authenticate, requirePermission('projects:read')] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const proj = await fastify.prisma.project.findFirst({
        where: { id: req.params.id, deletedAt: null },
        include: {
          business: { select: { id: true, name: true, nameBn: true } },
          tasks: { orderBy: { createdAt: 'desc' }, include: { assignedTo: { select: { fullName: true } } } },
          milestones: { orderBy: { targetDate: 'asc' } },
        },
      })
      if (!proj) return sendError(reply, 'Project not found', 'প্রজেক্ট পাওয়া যায়নি', 404)
      return sendSuccess(reply, proj)
    }
  )

  // POST /api/projects
  fastify.post('/', { preHandler: [authenticate, requirePermission('projects:create')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = createSchema.safeParse(req.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const { startDate, expectedEndDate, ...rest } = body.data
      const project = await fastify.prisma.project.create({
        data: {
          ...rest,
          startDate: startDate ? new Date(startDate) : undefined,
          expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : undefined,
        },
      })

      await writeAuditLog(fastify.prisma, {
        userId: req.user.sub, action: 'CREATE_PROJECT',
        tableName: 'projects', recordId: project.id,
        newData: body.data, ipAddress: req.ip,
      })

      return sendSuccess(reply, { id: project.id }, 'Project created', 'প্রজেক্ট তৈরি হয়েছে', 201)
    }
  )

  // PATCH /api/projects/:id
  fastify.patch('/:id', { preHandler: [authenticate, requirePermission('projects:update')] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const body = createSchema.partial().safeParse(req.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const proj = await fastify.prisma.project.findFirst({ where: { id: req.params.id, deletedAt: null } })
      if (!proj) return sendError(reply, 'Project not found', 'প্রজেক্ট পাওয়া যায়নি', 404)

      const { startDate, expectedEndDate, ...rest } = body.data
      const updated = await fastify.prisma.project.update({
        where: { id: proj.id },
        data: {
          ...rest,
          startDate: startDate ? new Date(startDate) : undefined,
          expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : undefined,
        },
      })

      await writeAuditLog(fastify.prisma, {
        userId: req.user.sub, action: 'UPDATE_PROJECT',
        tableName: 'projects', recordId: proj.id,
        oldData: proj, newData: body.data, ipAddress: req.ip,
      })

      return sendSuccess(reply, updated, 'Project updated', 'প্রজেক্ট আপডেট হয়েছে')
    }
  )
}
