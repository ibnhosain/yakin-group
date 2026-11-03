import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess } from '../utils/response'

export async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/dashboard/stats
  fastify.get('/stats', {
    preHandler: [authenticate, requirePermission('dashboard:read')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = fastify.prisma

    const [
      totalMembers, activeMembers,
      totalInvestors, activeInvestors,
      totalEmployees,
      activeProjects,
      pendingApprovals,
      pendingInvestments,
    ] = await Promise.all([
      prisma.member.count({ where: { deletedAt: null } }),
      prisma.member.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.investor.count({ where: { deletedAt: null } }),
      prisma.investor.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.employee.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.project.count({ where: { status: 'IN_PROGRESS', deletedAt: null } }),
      prisma.approval.count({ where: { status: 'PENDING' } }),
      prisma.investment.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW', 'AGREEMENT_PENDING', 'PAYMENT_PENDING'] } } }),
    ])

    // Financial totals from chart of accounts
    const assetAccounts = await prisma.account.aggregate({
      where: { type: 'ASSET', isActive: true },
      _sum: { balance: true },
    })
    const liabilityAccounts = await prisma.account.aggregate({
      where: { type: 'LIABILITY', isActive: true },
      _sum: { balance: true },
    })

    // Current fiscal year income & expenses (from journal lines)
    const now = new Date()
    const fiscalStart = new Date(now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1, 6, 1) // July 1

    const incomeLines = await prisma.journalLine.aggregate({
      where: {
        account: { type: 'INCOME' },
        entry: { isPosted: true, date: { gte: fiscalStart } },
      },
      _sum: { credit: true },
    })
    const expenseLines = await prisma.journalLine.aggregate({
      where: {
        account: { type: 'EXPENSE' },
        entry: { isPosted: true, date: { gte: fiscalStart } },
      },
      _sum: { debit: true },
    })

    const totalAssets = assetAccounts._sum.balance ?? 0
    const totalLiabilities = liabilityAccounts._sum.balance ?? 0
    const totalIncome = incomeLines._sum.credit ?? 0
    const totalExpenses = expenseLines._sum.debit ?? 0

    // Total investments (active)
    const investmentTotal = await prisma.investment.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { principalAmount: true },
    })

    return sendSuccess(reply, {
      totalBusinessValue: totalAssets - totalLiabilities,
      totalInvestment: investmentTotal._sum.principalAmount ?? 0,
      totalAssets,
      totalLiabilities,
      totalIncome,
      totalExpenses,
      netProfitLoss: totalIncome - totalExpenses,
      activeProjects,
      totalMembers,
      activeMembers,
      totalInvestors,
      activeInvestors,
      totalEmployees,
      pendingApprovals,
      pendingInvestments,
    })
  })

  // GET /api/dashboard/monthly-financials
  fastify.get('/monthly-financials', {
    preHandler: [authenticate, requirePermission('dashboard:read')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const months: { month: string; income: number; expense: number; profit: number }[] = []

    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

      const [inc, exp] = await Promise.all([
        fastify.prisma.journalLine.aggregate({
          where: { account: { type: 'INCOME' }, entry: { isPosted: true, date: { gte: start, lte: end } } },
          _sum: { credit: true },
        }),
        fastify.prisma.journalLine.aggregate({
          where: { account: { type: 'EXPENSE' }, entry: { isPosted: true, date: { gte: start, lte: end } } },
          _sum: { debit: true },
        }),
      ])

      const income = inc._sum.credit ?? 0
      const expense = exp._sum.debit ?? 0
      months.push({
        month: start.toISOString().slice(0, 7),
        income,
        expense,
        profit: income - expense,
      })
    }

    return sendSuccess(reply, months)
  })

  // GET /api/dashboard/recent-activity
  fastify.get('/recent-activity', {
    preHandler: [authenticate, requirePermission('dashboard:read')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const logs = await fastify.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { fullName: true, fullNameBn: true } } },
    })
    return sendSuccess(reply, logs)
  })
}
