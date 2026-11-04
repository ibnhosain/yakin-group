import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'
import { generateEmployeeNo } from '@yakin/utils'

const createSchema = z.object({
  // User fields
  fullName: z.string().min(2),
  fullNameBn: z.string().optional(),
  phone: z.string().min(11),
  email: z.string().email().optional(),
  password: z.string().min(8).default('Yakin@2024'),
  // Employee fields
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  nidNumber: z.string().optional(),
  joiningDate: z.string(),
  basicSalary: z.number().int().positive(),
  address: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankName: z.string().optional(),
})

export async function employeeRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/hr/employees
  fastify.get('/', { preHandler: [authenticate, requirePermission('employees:read')] },
    async (req: FastifyRequest<{ Querystring: { search?: string; status?: string; departmentId?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
      const { search, status, departmentId, page = '1', limit = '20' } = req.query
      const p = parseInt(page); const l = parseInt(limit)
      const where: Record<string, unknown> = { deletedAt: null }
      if (status) where.status = status
      if (departmentId) where.departmentId = departmentId
      if (search) where.OR = [
        { employeeNo: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { fullNameBn: { contains: search } } },
        { user: { phone: { contains: search } } },
      ]

      const [employees, total] = await Promise.all([
        fastify.prisma.employee.findMany({
          where, skip: (p-1)*l, take: l,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { fullName: true, fullNameBn: true, phone: true, email: true } },
            department: { select: { name: true, nameBn: true } },
            designation: { select: { name: true, nameBn: true } },
          },
        }),
        fastify.prisma.employee.count({ where }),
      ])

      const data = employees.map(emp => ({
        id: emp.id,
        employeeNo: emp.employeeNo,
        fullName: emp.user.fullName,
        fullNameBn: emp.user.fullNameBn,
        phone: emp.user.phone,
        department: emp.department?.nameBn ?? emp.department?.name ?? '—',
        designation: emp.designation?.nameBn ?? emp.designation?.name ?? '—',
        basicSalary: emp.basicSalary,
        status: emp.status,
        joiningDate: emp.joiningDate.toISOString(),
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
          user: { select: { fullName: true, fullNameBn: true, email: true, phone: true } },
          department: { select: { name: true, nameBn: true } },
          designation: { select: { name: true, nameBn: true } },
          attendance: { take: 15, orderBy: { date: 'desc' } },
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

      const { fullName, fullNameBn, phone, email, password, joiningDate, ...empData } = body.data

      const existing = await fastify.prisma.user.findFirst({
        where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
      })
      if (existing) return sendError(reply, 'Phone or email already registered', 'ফোন বা ইমেইল ইতিমধ্যে নিবন্ধিত', 409)

      const employeeRole = await fastify.prisma.role.findUnique({ where: { name: 'employee' } })
      if (!employeeRole) return sendError(reply, 'Role not configured', 'ভূমিকা কনফিগার করা হয়নি', 500)

      const passwordHash = await bcrypt.hash(password, 12)
      const employeeNo = generateEmployeeNo()

      const result = await fastify.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { roleId: employeeRole.id, fullName, fullNameBn, phone, email, passwordHash },
        })
        const employee = await tx.employee.create({
          data: {
            userId: user.id,
            employeeNo,
            joiningDate: new Date(joiningDate),
            ...empData,
          },
        })
        return employee
      })

      await writeAuditLog(fastify.prisma, {
        userId: req.user.sub, action: 'CREATE_EMPLOYEE',
        tableName: 'employees', recordId: result.id,
        newData: { fullName, phone, employeeNo }, ipAddress: req.ip,
      })

      return sendSuccess(reply, { id: result.id, employeeNo }, 'Employee created', 'কর্মী যুক্ত হয়েছে', 201)
    }
  )

  // PATCH /api/hr/employees/:id
  fastify.patch('/:id', { preHandler: [authenticate, requirePermission('employees:update')] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const updateSchema = z.object({
        fullName: z.string().min(2).optional(),
        fullNameBn: z.string().optional(),
        phone: z.string().min(11).optional(),
        email: z.string().email().optional().nullable(),
        departmentId: z.string().optional().nullable(),
        designationId: z.string().optional().nullable(),
        basicSalary: z.number().int().positive().optional(),
        address: z.string().optional().nullable(),
        emergencyPhone: z.string().optional().nullable(),
        bankAccountNo: z.string().optional().nullable(),
        bankName: z.string().optional().nullable(),
        status: z.enum(['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'TERMINATED']).optional(),
      })
      const body = updateSchema.safeParse(req.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const emp = await fastify.prisma.employee.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { user: true } })
      if (!emp) return sendError(reply, 'Employee not found', 'কর্মী পাওয়া যায়নি', 404)

      const { fullName, fullNameBn, phone, email, ...empFields } = body.data

      await fastify.prisma.$transaction(async (tx) => {
        if (fullName || fullNameBn !== undefined || phone || email !== undefined) {
          await tx.user.update({
            where: { id: emp.userId },
            data: { ...(fullName && { fullName }), ...(fullNameBn !== undefined && { fullNameBn }), ...(phone && { phone }), ...(email !== undefined && { email }) },
          })
        }
        await tx.employee.update({ where: { id: emp.id }, data: empFields })
      })

      await writeAuditLog(fastify.prisma, { userId: req.user.sub, action: 'UPDATE_EMPLOYEE', tableName: 'employees', recordId: emp.id, newData: body.data, ipAddress: req.ip })
      return sendSuccess(reply, null, 'Employee updated', 'কর্মীর তথ্য আপডেট হয়েছে')
    }
  )
}
