import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'

const createSchema = z.object({
  name: z.string().min(2),
  nameBn: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  descriptionBn: z.string().optional(),
  address: z.string().optional(),
  addressBn: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  tradeLicense: z.string().optional(),
  establishedDate: z.string().optional(),
})

export async function businessRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/businesses
  fastify.get('/', { preHandler: [authenticate, requirePermission('businesses:read')] },
    async (req: FastifyRequest<{ Querystring: { search?: string; status?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
      const { search, status, page = '1', limit = '20' } = req.query
      const p = parseInt(page); const l = parseInt(limit)
      const where: Record<string, unknown> = { deletedAt: null }
      if (status) where.status = status
      if (search) where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameBn: { contains: search } },
      ]

      const [businesses, total] = await Promise.all([
        fastify.prisma.business.findMany({
          where, skip: (p-1)*l, take: l,
          orderBy: { createdAt: 'desc' },
          include: {
            category: { select: { name: true, nameBn: true } },
            _count: { select: { investments: true } },
            investments: { select: { amount: true } },
          },
        }),
        fastify.prisma.business.count({ where }),
      ])

      const data = businesses.map(biz => ({
        id: biz.id, name: biz.name, nameBn: biz.nameBn,
        category: biz.category?.nameBn ?? biz.category?.name ?? 'অন্যান্য',
        status: biz.status,
        totalInvestment: biz.investments.reduce((s, i) => s + i.amount, 0),
        establishedDate: biz.establishedDate?.toISOString() ?? null,
        createdAt: biz.createdAt.toISOString(),
      }))

      return sendPaginated(reply, data, total, p, l)
    }
  )

  // GET /api/businesses/:id
  fastify.get('/:id', { preHandler: [authenticate, requirePermission('businesses:read')] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const biz = await fastify.prisma.business.findFirst({
        where: { id: req.params.id, deletedAt: null },
        include: {
          category: true,
          investments: { include: { investor: { select: { fullName: true, fullNameBn: true } } } },
        },
      })
      if (!biz) return sendError(reply, 'Business not found', 'ব্যবসা পাওয়া যায়নি', 404)
      return sendSuccess(reply, biz, 'Business fetched', 'ব্যবসার তথ্য পাওয়া গেছে')
    }
  )

  // POST /api/businesses
  fastify.post('/', { preHandler: [authenticate, requirePermission('businesses:create')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = createSchema.safeParse(req.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const business = await fastify.prisma.business.create({
        data: {
          ...body.data,
          establishedDate: body.data.establishedDate ? new Date(body.data.establishedDate) : null,
          createdById: req.user.sub,
        },
      })

      await writeAuditLog(fastify.prisma, {
        userId: req.user.sub, action: 'CREATE_BUSINESS',
        tableName: 'businesses', recordId: business.id,
        newData: body.data, ipAddress: req.ip,
      })

      return sendSuccess(reply, { id: business.id }, 'Business created', 'ব্যবসা যুক্ত হয়েছে', 201)
    }
  )
}
