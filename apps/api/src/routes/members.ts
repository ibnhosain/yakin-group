import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'
import { generateMemberNo } from '@yakin/utils'

const createMemberSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(11),
  password: z.string().min(8),
  fullName: z.string().min(2),
  fullNameBn: z.string().optional(),
  categoryId: z.string().min(1),
  nidNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  permanentAddress: z.string().optional(),
  nomineeName: z.string().optional(),
  nomineeRelation: z.string().optional(),
  nomineePhone: z.string().optional(),
  nomineeNid: z.string().optional(),
})

const updateMemberSchema = createMemberSchema.partial().omit({ email: true, password: true })
const updateStatusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED']), note: z.string().optional() })

export async function memberRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/members/categories
  fastify.get('/categories', { preHandler: [authenticate] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const categories = await fastify.prisma.memberCategory.findMany({ orderBy: { name: 'asc' } })
      return sendSuccess(reply, categories)
    }
  )

  // GET /api/members
  fastify.get('/', { preHandler: [authenticate, requirePermission('members:read')] },
    async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; status?: string; categoryId?: string } }>, reply: FastifyReply) => {
      const { page = '1', limit = '20', search, status, categoryId } = request.query
      const p = Math.max(1, parseInt(page))
      const l = Math.min(100, Math.max(1, parseInt(limit)))
      const skip = (p - 1) * l

      const where: Record<string, unknown> = { deletedAt: null }
      if (status) where.status = status
      if (categoryId) where.categoryId = categoryId
      if (search) {
        where.OR = [
          { memberNo: { contains: search, mode: 'insensitive' } },
          { user: { fullName: { contains: search, mode: 'insensitive' } } },
          { user: { phone: { contains: search } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ]
      }

      const [members, total] = await Promise.all([
        fastify.prisma.member.findMany({
          where, skip, take: l,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { fullName: true, fullNameBn: true, email: true, phone: true } },
            category: { select: { name: true, nameBn: true } },
          },
        }),
        fastify.prisma.member.count({ where }),
      ])

      const data = members.map(m => ({
        id: m.id, memberNo: m.memberNo, fullName: m.user.fullName, fullNameBn: m.user.fullNameBn,
        phone: m.user.phone, email: m.user.email, categoryName: m.category.nameBn ?? m.category.name,
        status: m.status, totalShares: m.totalShares, totalInvested: m.totalInvested,
        membershipDate: m.membershipDate.toISOString(),
      }))

      return sendPaginated(reply, data, total, p, l)
    }
  )

  // GET /api/members/:id
  fastify.get('/:id', { preHandler: [authenticate, requirePermission('members:read')] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const m = await fastify.prisma.member.findFirst({
        where: { id: request.params.id, deletedAt: null },
        include: {
          user: { select: { fullName: true, fullNameBn: true, email: true, phone: true } },
          category: true,
          shares: { where: { isActive: true }, orderBy: { purchaseDate: 'desc' } },
          payments: { orderBy: { paymentDate: 'desc' }, take: 20 },
        },
      })
      if (!m) return sendError(reply, 'Member not found', 'সদস্য পাওয়া যায়নি', 404)
      return sendSuccess(reply, m)
    }
  )

  // POST /api/members
  fastify.post('/', { preHandler: [authenticate, requirePermission('members:create')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createMemberSchema.safeParse(request.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const d = body.data

      // Check duplicate email/phone
      const existing = await fastify.prisma.user.findFirst({ where: { OR: [{ email: d.email }, { phone: d.phone }] } })
      if (existing) return sendError(reply, 'Email or phone already registered', 'ইমেইল বা ফোন ইতিমধ্যে নিবন্ধিত', 409)

      const category = await fastify.prisma.memberCategory.findUnique({ where: { id: d.categoryId } })
      if (!category) return sendError(reply, 'Category not found', 'ক্যাটাগরি পাওয়া যায়নি', 404)

      // Get member role
      const memberRole = await fastify.prisma.role.findUnique({ where: { name: 'member' } })
      if (!memberRole) return sendError(reply, 'Role not configured', 'ভূমিকা কনফিগার করা হয়নি', 500)

      const count = await fastify.prisma.member.count()
      const memberNo = generateMemberNo(count)
      const passwordHash = await bcrypt.hash(d.password, 12)

      const result = await fastify.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { roleId: memberRole.id, email: d.email, phone: d.phone, passwordHash, fullName: d.fullName, fullNameBn: d.fullNameBn }
        })
        const member = await tx.member.create({
          data: {
            userId: user.id, categoryId: d.categoryId, memberNo,
            nidNumber: d.nidNumber, dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : undefined,
            gender: d.gender, address: d.address, permanentAddress: d.permanentAddress,
            nomineeName: d.nomineeName, nomineeRelation: d.nomineeRelation, nomineePhone: d.nomineePhone, nomineeNid: d.nomineeNid,
            status: 'PENDING',
          }
        })
        // Create approval request
        await tx.approval.create({
          data: { type: 'NEW_MEMBERSHIP', refId: member.id, requesterId: request.user.sub, status: 'PENDING', requestNote: `New membership application: ${d.fullName}` }
        })
        return member
      })

      await writeAuditLog(fastify.prisma, { userId: request.user.sub, action: 'CREATE', tableName: 'members', recordId: result.id, newData: result, ipAddress: request.ip })

      return sendSuccess(reply, { id: result.id, memberNo: result.memberNo }, 'Member application submitted', 'সদস্যপদ আবেদন জমা দেওয়া হয়েছে', 201)
    }
  )

  // PATCH /api/members/:id
  fastify.patch('/:id', { preHandler: [authenticate, requirePermission('members:update')] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const body = updateMemberSchema.safeParse(request.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const old = await fastify.prisma.member.findFirst({ where: { id: request.params.id, deletedAt: null } })
      if (!old) return sendError(reply, 'Member not found', 'সদস্য পাওয়া যায়নি', 404)

      const updated = await fastify.prisma.member.update({ where: { id: old.id }, data: body.data })
      await writeAuditLog(fastify.prisma, { userId: request.user.sub, action: 'UPDATE', tableName: 'members', recordId: old.id, oldData: old, newData: updated, ipAddress: request.ip })

      return sendSuccess(reply, updated, 'Member updated', 'সদস্য আপডেট হয়েছে')
    }
  )

  // PATCH /api/members/:id/status
  fastify.patch('/:id/status', { preHandler: [authenticate, requirePermission('members:manage')] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const body = updateStatusSchema.safeParse(request.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const old = await fastify.prisma.member.findFirst({ where: { id: request.params.id, deletedAt: null } })
      if (!old) return sendError(reply, 'Member not found', 'সদস্য পাওয়া যায়নি', 404)

      const updated = await fastify.prisma.member.update({ where: { id: old.id }, data: { status: body.data.status } })
      await writeAuditLog(fastify.prisma, { userId: request.user.sub, action: 'STATUS_CHANGE', tableName: 'members', recordId: old.id, oldData: { status: old.status }, newData: { status: body.data.status, note: body.data.note }, ipAddress: request.ip })

      return sendSuccess(reply, { status: updated.status }, 'Status updated', 'স্ট্যাটাস আপডেট হয়েছে')
    }
  )

  // DELETE /api/members/:id  — soft delete only
  fastify.delete('/:id', { preHandler: [authenticate, requirePermission('members:delete')] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const m = await fastify.prisma.member.findFirst({ where: { id: request.params.id, deletedAt: null } })
      if (!m) return sendError(reply, 'Member not found', 'সদস্য পাওয়া যায়নি', 404)

      // Soft delete — data is NEVER permanently deleted
      await fastify.prisma.member.update({ where: { id: m.id }, data: { deletedAt: new Date(), status: 'SUSPENDED' } })
      await writeAuditLog(fastify.prisma, { userId: request.user.sub, action: 'SOFT_DELETE', tableName: 'members', recordId: m.id, oldData: m, ipAddress: request.ip })

      return sendSuccess(reply, null, 'Member deactivated', 'সদস্য নিষ্ক্রিয় করা হয়েছে')
    }
  )
}
