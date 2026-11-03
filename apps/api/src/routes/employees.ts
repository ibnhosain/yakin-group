import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'
import { generateEmployeeNo } from '@yakin/utils'

const createSchema = z.object({
  userId: z.string().optional(),
  fullName: z.string().min(2),
  fullNameBn: z.string().optional(),
  phone: z.string(),
  email: z.string().email().optional(),
  nidNo: z.string().optional(),
  department: z.string(),
  designation: z.string(),
  joinDate: z.string(),
  basicSalary: z.number().int().positive(),
  bankAccount: z.string().optional(),
  address: z.string().optional(),
  addressBn: z.string().optional(),
  emergencyContact: z.string().optional(),
})

export async function employeeRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/hr/employees
  fastify.get('/', { preHandler: [authenticate, requirePermission('employees:read')] },
    async (req: FastifyRequest<{ Querystring: { search?: string; status?: string; department?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
      const { search, status, department, page = '1', limit = '20' } = req.query
      const p = parseInt(page); const l = parseInt(limit)
      const where: Record<string, unknown> = { deletedAt: null }
      if (status) where.status = status
      if (department) where.department = department
      if (search) where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { fullNameBn: { contains: search } },
        { employeeNo: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]

      const [employees, total] = await Promise.all([
        fastify.prisma.employee.findMany({
          where, skip: (p-1)*l, take: l,
          orderBy: { createdAt: 'desc' },
        }),
        fastify.prisma.employee.count({ where }),
      ])

      const data = employees.map(emp => ({
        id: emp.id,
        employeeNo: emp.employeeNo,
        fullName: emp.fullName,
        fullNameBn: emp.fullNameBn,
        department: emp.department,
        designation: emp.designation,
        basicSalary: emp.basicSalary,
        status: emp.status,
        joinDate: emp.joinDate.toISOString(),
        createdAt: emp.createdAt.toISOString(),
      }))

      return sendPaginated(reply, data, total, p, l)
    }
  )

  // GET /api/hr/employees/:id
  fastify.get('/:id', { preHandler: [authenticate, requirePermission('employees:read')] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const emp = await fastify.prisma.employee.findFirst({
        where: { id: req.params.id, deletedAt: null },
        include: {
          attendances: { take: 30, orderBy: { date: 'desc' } },
          leaveRequests: { take: 10, orderBy: { createdAt: 'desc' } },
          payrollRecords: { take: 12, orderBy: { year: 'desc' } },
        },
      })
      if (!emp) return sendError(reply, 'Employee not found', 'কর্মী পাওয়া যায়নি', 404)
      return sendSuccess(reply, emp, 'Employee fetched', 'কর্মীর তথ্য পাওয়া গেছে')
    }
  )

  // POST /api/hr/employees
  fastify.post('/', { preHandler: [authenticate, requirePermission('employees:create')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = createSchema.safeParse(req.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const employeeNo = generateEmployeeNo()
      const employee = await fastify.prisma.employee.create({
        data: {
          ...body.data,
          employeeNo,
          joinDate: new Date(body.data.joinDate),
          createdById: req.user.sub,
        },
      })

      await writeAuditLog(fastify.prisma, {
        userId: req.user.sub, action: 'CREATE_EMPLOYEE',
        tableName: 'employees', recordId: employee.id,
        newData: body.data, ipAddress: req.ip,
      })

      return sendSuccess(reply, { id: employee.id, employeeNo }, 'Employee created', 'কর্মী যুক্ত হয়েছে', 201)
    }
  )
}
