import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'
import { generateInvestorNo } from '@yakin/utils'

const createSchema = z.object({
  fullName: z.string().min(2),
  fullNameBn: z.string().optional(),
  phone: z.string().min(11),
  email: z.string().email().optional(),
  password: z.string().min(8).default('Yakin@2024'),
  nidNumber: z.string().optional(),
  address: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankBranch: z.string().optional(),
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
        { investorNo: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { fullNameBn: { contains: search } } },
        { user: { phone: { contains: search } } },
      ]

      const [investors, total] = await Promise.all([
        fastify.prisma.investor.findMany({
          where, skip: (p-1)*l, take: l,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { fullName: true, fullNameBn: true, phone: true, email: true } },
            _count: { select: { investments: { where: { status: 'ACTIVE' } } } },
            investments: { where: { status: 'ACTIVE' }, select: { principalAmount: true } },
          },
        }),
        fastify.prisma.investor.count({ where }),
      ])

      const data = investors.map(inv => ({
        id: inv.id,
        investorNo: inv.investorNo,
        fullName: inv.user.fullName,
        fullNameBn: inv.user.fullNameBn,
        phone: inv.user.phone,
        email: inv.user.email,
        status: inv.status,
        totalInvestment: inv.investments.reduce((s, i) => s + i.principalAmount, 0),
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
          user: { select: { fullName: true, fullNameBn: true, email: true, phone: true } },
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

      const { fullName, fullNameBn, phone, email, password, ...investorData } = body.data

      // Check duplicate phone/email
      const existing = await fastify.prisma.user.findFirst({
        where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
      })
      if (existing) return sendError(reply, 'Phone or email already registered', 'ফোন বা ইমেইল ইতিমধ্যে নিবন্ধিত', 409)

      const investorRole = await fastify.prisma.role.findUnique({ where: { name: 'investor' } })
      if (!investorRole) return sendError(reply, 'Role not configured', 'ভূমিকা কনফিগার করা হয়নি', 500)

      const passwordHash = await bcrypt.hash(password, 12)
      const investorNo = generateInvestorNo()

      const result = await fastify.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { roleId: investorRole.id, fullName, fullNameBn, phone, email, passwordHash },
        })
        const investor = await tx.investor.create({
          data: { userId: user.id, investorNo, ...investorData },
        })
        return investor
      })

      await writeAuditLog(fastify.prisma, {
        userId: req.user.sub, action: 'CREATE_INVESTOR',
        tableName: 'investors', recordId: result.id,
        newData: { fullName, phone, investorNo }, ipAddress: req.ip,
      })

      return sendSuccess(reply, { id: result.id, investorNo }, 'Investor created', 'বিনিয়োগকারী যুক্ত হয়েছে', 201)
    }
  )

  // PATCH /api/investors/:id
  fastify.patch('/:id', { preHandler: [authenticate, requirePermission('investors:update')] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const updateSchema = z.object({
        fullName: z.string().min(2).optional(),
        fullNameBn: z.string().optional(),
        phone: z.string().min(11).optional(),
        email: z.string().email().optional().nullable(),
        nidNumber: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        bankName: z.string().optional().nullable(),
        bankAccount: z.string().optional().nullable(),
        bankBranch: z.string().optional().nullable(),
      })
      const body = updateSchema.safeParse(req.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const inv = await fastify.prisma.investor.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { user: true } })
      if (!inv) return sendError(reply, 'Investor not found', 'বিনিয়োগকারী পাওয়া যায়নি', 404)

      const { fullName, fullNameBn, phone, email, ...investorFields } = body.data

      await fastify.prisma.$transaction(async (tx) => {
        if (fullName || fullNameBn !== undefined || phone || email !== undefined) {
          await tx.user.update({
            where: { id: inv.userId },
            data: { ...(fullName && { fullName }), ...(fullNameBn !== undefined && { fullNameBn }), ...(phone && { phone }), ...(email !== undefined && { email }) },
          })
        }
        await tx.investor.update({ where: { id: inv.id }, data: investorFields })
      })

      await writeAuditLog(fastify.prisma, { userId: req.user.sub, action: 'UPDATE_INVESTOR', tableName: 'investors', recordId: inv.id, newData: body.data, ipAddress: req.ip })
      return sendSuccess(reply, null, 'Investor updated', 'বিনিয়োগকারীর তথ্য আপডেট হয়েছে')
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
