import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'
import { generateJournalRefNo } from '@yakin/utils'

const journalEntrySchema = z.object({
  date: z.string(),
  description: z.string().min(3),
  descriptionBn: z.string().optional(),
  voucherType: z.enum(['JOURNAL', 'PAYMENT', 'RECEIPT', 'CONTRA']).default('JOURNAL'),
  attachmentUrl: z.string().url().optional(),
  lines: z.array(z.object({
    accountId: z.string().min(1),
    debit: z.number().int().min(0),
    credit: z.number().int().min(0),
    narration: z.string().optional(),
  })).min(2),
})

export async function accountingRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/accounting/accounts
  fastify.get('/accounts', { preHandler: [authenticate, requirePermission('accounting:read')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const accounts = await fastify.prisma.account.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
        include: { parent: { select: { name: true, nameBn: true } } },
      })
      return sendSuccess(reply, accounts)
    }
  )

  // POST /api/accounting/journal-entries
  fastify.post('/journal-entries', { preHandler: [authenticate, requirePermission('accounting:create')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = journalEntrySchema.safeParse(request.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const d = body.data

      // Enforce double-entry: debit total must equal credit total
      const totalDebit = d.lines.reduce((s, l) => s + l.debit, 0)
      const totalCredit = d.lines.reduce((s, l) => s + l.credit, 0)
      if (totalDebit !== totalCredit) {
        return sendError(reply, `Unbalanced entry: debit ${totalDebit} ≠ credit ${totalCredit}`, `ডেবিট ও ক্রেডিট সমান নয়`, 400)
      }
      if (totalDebit === 0) {
        return sendError(reply, 'Entry amounts cannot be zero', 'পরিমাণ শূন্য হতে পারবে না', 400)
      }

      // Validate all accounts exist
      const accountIds = d.lines.map(l => l.accountId)
      const accounts = await fastify.prisma.account.findMany({ where: { id: { in: accountIds }, isActive: true } })
      if (accounts.length !== accountIds.length) {
        return sendError(reply, 'One or more accounts not found', 'একটি বা একাধিক অ্যাকাউন্ট পাওয়া যায়নি', 404)
      }

      const count = await fastify.prisma.journalEntry.count()
      const refNo = generateJournalRefNo(count)

      const entry = await fastify.prisma.$transaction(async (tx) => {
        const je = await tx.journalEntry.create({
          data: {
            refNo, date: new Date(d.date), description: d.description, descriptionBn: d.descriptionBn,
            voucherType: d.voucherType, attachmentUrl: d.attachmentUrl, createdById: request.user.sub,
            lines: { createMany: { data: d.lines.map(l => ({ accountId: l.accountId, debit: l.debit, credit: l.credit, narration: l.narration })) } },
          },
          include: { lines: true },
        })
        return je
      })

      await writeAuditLog(fastify.prisma, { userId: request.user.sub, action: 'CREATE', tableName: 'journal_entries', recordId: entry.id, newData: entry, ipAddress: request.ip })

      return sendSuccess(reply, { id: entry.id, refNo: entry.refNo }, 'Journal entry created', 'জার্নাল এন্ট্রি তৈরি হয়েছে', 201)
    }
  )

  // POST /api/accounting/journal-entries/:id/post  — post (make immutable)
  fastify.post('/journal-entries/:id/post', { preHandler: [authenticate, requirePermission('accounting:post')] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const entry = await fastify.prisma.journalEntry.findUnique({ where: { id: request.params.id }, include: { lines: true } })
      if (!entry) return sendError(reply, 'Entry not found', 'এন্ট্রি পাওয়া যায়নি', 404)
      if (entry.isPosted) return sendError(reply, 'Already posted', 'ইতিমধ্যে পোস্ট করা হয়েছে', 400)

      await fastify.prisma.$transaction(async (tx) => {
        await tx.journalEntry.update({ where: { id: entry.id }, data: { isPosted: true, postedAt: new Date(), postedById: request.user.sub } })
        // Update account balances
        for (const line of entry.lines) {
          const account = await tx.account.findUnique({ where: { id: line.accountId } })
          if (!account) continue
          let delta = 0
          if (['ASSET', 'EXPENSE'].includes(account.type)) delta = line.debit - line.credit
          else delta = line.credit - line.debit
          await tx.account.update({ where: { id: account.id }, data: { balance: { increment: delta } } })
        }
      })

      await writeAuditLog(fastify.prisma, { userId: request.user.sub, action: 'POST_JOURNAL', tableName: 'journal_entries', recordId: entry.id, ipAddress: request.ip })

      return sendSuccess(reply, null, 'Journal entry posted', 'জার্নাল এন্ট্রি পোস্ট হয়েছে')
    }
  )

  // GET /api/accounting/journal-entries
  fastify.get('/journal-entries', { preHandler: [authenticate, requirePermission('accounting:read')] },
    async (request: FastifyRequest<{ Querystring: { page?: string; limit?: string; from?: string; to?: string; isPosted?: string } }>, reply: FastifyReply) => {
      const { page = '1', limit = '20', from, to, isPosted } = request.query
      const p = parseInt(page); const l = parseInt(limit)
      const where: Record<string, unknown> = {}
      if (from || to) where.date = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined }
      if (isPosted !== undefined) where.isPosted = isPosted === 'true'

      const [entries, total] = await Promise.all([
        fastify.prisma.journalEntry.findMany({ where, skip: (p-1)*l, take: l, orderBy: { date: 'desc' }, include: { lines: { include: { account: { select: { code: true, name: true, nameBn: true } } } } } }),
        fastify.prisma.journalEntry.count({ where }),
      ])

      return sendPaginated(reply, entries, total, p, l)
    }
  )

  // GET /api/accounting/ledger/:accountId
  fastify.get('/ledger/:accountId', { preHandler: [authenticate, requirePermission('accounting:read')] },
    async (request: FastifyRequest<{ Params: { accountId: string }; Querystring: { from?: string; to?: string } }>, reply: FastifyReply) => {
      const { from, to } = request.query
      const account = await fastify.prisma.account.findUnique({ where: { id: request.params.accountId } })
      if (!account) return sendError(reply, 'Account not found', 'অ্যাকাউন্ট পাওয়া যায়নি', 404)

      const lines = await fastify.prisma.journalLine.findMany({
        where: {
          accountId: account.id,
          entry: { isPosted: true, date: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } },
        },
        orderBy: { entry: { date: 'asc' } },
        include: { entry: { select: { refNo: true, date: true, description: true } } },
      })

      let runningBalance = 0
      const ledgerLines = lines.map(l => {
        const delta = ['ASSET','EXPENSE'].includes(account.type) ? l.debit - l.credit : l.credit - l.debit
        runningBalance += delta
        return { ...l, runningBalance }
      })

      return sendSuccess(reply, { account, lines: ledgerLines, closingBalance: runningBalance })
    }
  )

  // GET /api/accounting/trial-balance
  fastify.get('/trial-balance', { preHandler: [authenticate, requirePermission('accounting:read')] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const accounts = await fastify.prisma.account.findMany({
        where: { isActive: true, balance: { not: 0 } },
        orderBy: { code: 'asc' },
      })
      const totalDebit = accounts.filter(a => ['ASSET','EXPENSE'].includes(a.type)).reduce((s, a) => s + Math.max(0, a.balance), 0)
      const totalCredit = accounts.filter(a => ['LIABILITY','EQUITY','INCOME'].includes(a.type)).reduce((s, a) => s + Math.max(0, a.balance), 0)
      return sendSuccess(reply, { accounts, totalDebit, totalCredit, isBalanced: totalDebit === totalCredit })
    }
  )
}
