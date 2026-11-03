import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'

const decideSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'UNDER_REVIEW']),
  decisionNote: z.string().optional(),
})

export async function approvalRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/approvals
  fastify.get('/', { preHandler: [authenticate, requirePermission('approvals:read')] },
    async (request: FastifyRequest<{ Querystring: { status?: string; type?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
      const { status, type, page = '1', limit = '20' } = request.query
      const p = parseInt(page); const l = parseInt(limit)
      const where: Record<string, unknown> = {}
      if (status) where.status = status
      if (type) where.type = type

      const [approvals, total] = await Promise.all([
        fastify.prisma.approval.findMany({
          where, skip: (p-1)*l, take: l,
          orderBy: { requestedAt: 'desc' },
          include: {
            requester: { select: { fullName: true, fullNameBn: true } },
            reviewer: { select: { fullName: true, fullNameBn: true } },
          },
        }),
        fastify.prisma.approval.count({ where }),
      ])

      const data = approvals.map(a => ({
        id: a.id, type: a.type, status: a.status,
        requesterName: a.requester.fullName,
        reviewerName: a.reviewer?.fullName ?? null,
        requestNote: a.requestNote,
        decisionNote: a.decisionNote,
        requestedAt: a.requestedAt.toISOString(),
        decidedAt: a.decidedAt?.toISOString() ?? null,
      }))

      return sendPaginated(reply, data, total, p, l)
    }
  )

  // PATCH /api/approvals/:id/decide
  fastify.patch('/:id/decide', { preHandler: [authenticate, requirePermission('approvals:manage')] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const body = decideSchema.safeParse(request.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const approval = await fastify.prisma.approval.findUnique({ where: { id: request.params.id } })
      if (!approval) return sendError(reply, 'Approval not found', 'অনুমোদন পাওয়া যায়নি', 404)
      if (approval.status !== 'PENDING' && approval.status !== 'UNDER_REVIEW') {
        return sendError(reply, 'Approval already decided', 'ইতিমধ্যে সিদ্ধান্ত নেওয়া হয়েছে', 400)
      }

      const updated = await fastify.prisma.$transaction(async (tx) => {
        const a = await tx.approval.update({
          where: { id: approval.id },
          data: {
            status: body.data.status,
            reviewerId: request.user.sub,
            decisionNote: body.data.decisionNote,
            decidedAt: ['APPROVED', 'REJECTED'].includes(body.data.status) ? new Date() : undefined,
          },
        })

        // Auto-update related record based on decision
        if (body.data.status === 'APPROVED' && approval.refId) {
          if (approval.type === 'NEW_MEMBERSHIP') {
            await tx.member.updateMany({ where: { id: approval.refId, status: 'PENDING' }, data: { status: 'ACTIVE' } })
          } else if (approval.type === 'LEAVE_REQUEST') {
            await tx.leaveRequest.updateMany({ where: { approvalId: approval.id }, data: { status: 'APPROVED' } })
          } else if (approval.type === 'SALARY_PAYMENT') {
            await tx.payrollRecord.updateMany({ where: { approvalId: approval.id }, data: { status: 'APPROVED' } })
          }
        } else if (body.data.status === 'REJECTED' && approval.refId) {
          if (approval.type === 'NEW_MEMBERSHIP') {
            await tx.member.updateMany({ where: { id: approval.refId, status: 'PENDING' }, data: { status: 'REJECTED' } })
          } else if (approval.type === 'LEAVE_REQUEST') {
            await tx.leaveRequest.updateMany({ where: { approvalId: approval.id }, data: { status: 'REJECTED' } })
          }
        }

        return a
      })

      await writeAuditLog(fastify.prisma, {
        userId: request.user.sub,
        action: `APPROVAL_${body.data.status}`,
        tableName: 'approvals',
        recordId: approval.id,
        oldData: { status: approval.status },
        newData: { status: body.data.status, note: body.data.decisionNote },
        ipAddress: request.ip,
      })

      const msgBn = body.data.status === 'APPROVED' ? 'অনুমোদন দেওয়া হয়েছে' : body.data.status === 'REJECTED' ? 'প্রত্যাখ্যান করা হয়েছে' : 'পর্যালোচনাধীন'
      return sendSuccess(reply, { status: updated.status }, `Decision recorded: ${body.data.status}`, msgBn)
    }
  )
}
