import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'
import { generateInvestorNo } from '@yakin/utils'

const createSchema = z.object({
  userId: z.string().optional(),
  fullName: z.string().min(2),
  fullNameBn: z.string().optional(),
  phone: z.string(),
  email: z.string().email().optional(),
  nidNo: z.string().optional(),
  address: z.string().optional(),
  addressBn: z.string().optional(),
})

export async function investorRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/investors
  fastify.get('/', { preHandler: [authenticate, requirePermission('investors:read')] },
    async (req: FastifyRequest<{ Querystring: { search?: string; status?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
      const { search, status, page = '1', limit = '20' } = req.query
      const p = parseInt(page); const l = parseInt(limit)
      const where: Record<string, unknown> = { deletedAt: null }
      if (status) where.status = status
      if (search) where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { fullNameBn: { contains: search } },
        { investorNo: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]

      const [investors, total] = await Promise.all([
        fastify.prisma.investor.findMany({
          where, skip: (p-1)*l, take: l,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { investments: { where: { status: 'ACTIVE' } } } },
            investments: { where: { status: 'ACTIVE' }, select: { amount: true } },
          },
        }),
        fastify.prisma.investor.count({ where }),
      ])

      const data = investors.map(inv => ({
        id: inv.id,
        investorNo: inv.investorNo,
        fullName: inv.fullName,
        fullNameBn: inv.fullNameBn,
        phone: inv.phone,
        status: inv.status,
        totalInvestment: inv.investments.reduce((s, i) => s + i.amount, 0),
        activeInvestments: inv._count.investments,
        createdAt: inv.createdAt.toISOString(),
      }))

      return sendPaginated(reply, data, total, p, l)
    }
  )

  // GET /api/investors/:id
  fastify.get('/:id', { preHandler: [authenticate, requirePermission('investors:read')] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const inv = await fastify.prisma.investor.findFirst({
        where: { id: req.params.id, deletedAt: null },
        include: {
          investments: {
            include: { plan: { select: { name: true, nameBn: true, returnRate: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
      if (!inv) return sendError(reply, 'Investor not found', 'বিনিয়োগকারী পাওয়া যায়নি', 404)
      return sendSuccess(reply, inv, 'Investor fetched', 'বিনিয়োগকারীর তথ্য পাওয়া গেছে')
    }
  )

  // POST /api/investors
  fastify.post('/', { preHandler: [authenticate, requirePermission('investors:create')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = createSchema.safeParse(req.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const investorNo = generateInvestorNo()
      const investor = await fastify.prisma.investor.create({
        data: { ...body.data, investorNo, createdById: req.user.sub },
      })

      await writeAuditLog(fastify.prisma, {
        userId: req.user.sub, action: 'CREATE_INVESTOR',
        tableName: 'investors', recordId: investor.id,
        newData: body.data, ipAddress: req.ip,
      })

      return sendSuccess(reply, { id: investor.id, investorNo }, 'Investor created', 'বিনিয়োগকারী যুক্ত হয়েছে', 201)
    }
  )

  // PATCH /api/investors/:id/status
  fastify.patch('/:id/status', { preHandler: [authenticate, requirePermission('investors:update')] },
    async (req: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>, reply: FastifyReply) => {
      const { status } = req.body as { status: string }
      const inv = await fastify.prisma.investor.findFirst({ where: { id: req.params.id, deletedAt: null } })
      if (!inv) return sendError(reply, 'Investor not found', 'বিনিয়োগকারী পাওয়া যায়নি', 404)

      await fastify.prisma.investor.update({ where: { id: inv.id }, data: { status: status as any } })
      await writeAuditLog(fastify.prisma, {
        userId: req.user.sub, action: 'UPDATE_INVESTOR_STATUS',
        tableName: 'investors', recordId: inv.id,
        oldData: { status: inv.status }, newData: { status }, ipAddress: req.ip,
      })

      return sendSuccess(reply, { status }, 'Status updated', 'স্ট্যাটাস আপডেট হয়েছে')
    }
  )
}
