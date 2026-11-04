import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'

const createSchema = z.object({
  name: z.string().min(2),
  nameBn: z.string().optional(),
  categoryId: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  capital: z.number().int().default(0),
  licenseNo: z.string().optional(),
  taxId: z.string().optional(),
  startedAt: z.string().optional(),
})

export async function businessRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/businesses/categories
  fastify.get('/categories', { preHandler: [authenticate] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const cats = await fastify.prisma.businessCategory.findMany({ orderBy: { name: 'asc' } })
      return sendSuccess(reply, cats)
    }
  )

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
            _count: { select: { projects: true, employees: true } },
          },
        }),
        fastify.prisma.business.count({ where }),
      ])

      const data = businesses.map(biz => ({
        id: biz.id, name: biz.name, nameBn: biz.nameBn,
        category: biz.category?.nameBn ?? biz.category?.name ?? 'অন্যান্য',
        status: biz.status,
        capital: biz.capital,
        projectCount: biz._count.projects,
        employeeCount: biz._count.employees,
        startedAt: biz.startedAt?.toISOString() ?? null,
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
          projects: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, name: true, nameBn: true, status: true, progressPercent: true, budget: true } },
          employees: {
            where: { deletedAt: null }, take: 10,
            include: { user: { select: { fullName: true, fullNameBn: true } }, designation: { select: { name: true, nameBn: true } } },
          },
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

      const { startedAt, ...rest } = body.data

      const category = await fastify.prisma.businessCategory.findUnique({ where: { id: rest.categoryId } })
      if (!category) return sendError(reply, 'Category not found', 'ক্যাটাগরি পাওয়া যায়নি', 404)

      const business = await fastify.prisma.business.create({
        data: {
          ...rest,
          startedAt: startedAt ? new Date(startedAt) : undefined,
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
