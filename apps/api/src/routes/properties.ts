import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'

const createSchema = z.object({
  name: z.string().min(2),
  nameBn: z.string().optional(),
  propertyType: z.enum(['LAND', 'BUILDING', 'APARTMENT', 'COMMERCIAL', 'AGRICULTURAL', 'OTHER']).default('LAND'),
  location: z.string().min(2),
  locationBn: z.string().optional(),
  totalArea: z.number().positive(),
  areaUnit: z.enum(['DECIMAL', 'KATHA', 'BIGHA', 'ACRE', 'SQFT', 'SQMETER']).default('DECIMAL'),
  purchasePrice: z.number().int().positive(),
  currentValue: z.number().int().positive(),
  purchaseDate: z.string(),
  registrationNo: z.string().optional(),
  mutationNo: z.string().optional(),
  sellerName: z.string().optional(),
  sellerPhone: z.string().optional(),
  notes: z.string().optional(),
})

const PROPERTY_ID_PREFIX = 'YGP'
let _propCounter = 1

function generatePropertyNo() {
  const year = new Date().getFullYear()
  return `${PROPERTY_ID_PREFIX}-${year}-${String(_propCounter++).padStart(3, '0')}`
}

export async function propertyRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/properties
  fastify.get('/', { preHandler: [authenticate, requirePermission('properties:read')] },
    async (req: FastifyRequest<{ Querystring: { search?: string; status?: string; type?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
      const { search, status, type, page = '1', limit = '20' } = req.query
      const p = parseInt(page); const l = parseInt(limit)
      const where: Record<string, unknown> = { deletedAt: null }
      if (status) where.status = status
      if (type) where.propertyType = type
      if (search) where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameBn: { contains: search } },
        { location: { contains: search, mode: 'insensitive' } },
        { propertyNo: { contains: search, mode: 'insensitive' } },
      ]

      const [props, total] = await Promise.all([
        fastify.prisma.property.findMany({
          where, skip: (p - 1) * l, take: l,
          orderBy: { createdAt: 'desc' },
        }),
        fastify.prisma.property.count({ where }),
      ])

      const data = props.map(pr => ({
        id: pr.id, propertyNo: pr.propertyNo, name: pr.name, nameBn: pr.nameBn,
        propertyType: pr.propertyType, location: pr.location, locationBn: pr.locationBn,
        totalArea: pr.totalArea, areaUnit: pr.areaUnit,
        purchasePrice: pr.purchasePrice, currentValue: pr.currentValue,
        purchaseDate: pr.purchaseDate.toISOString(), status: pr.status,
      }))

      return sendPaginated(reply, data, total, p, l)
    }
  )

  // GET /api/properties/:id
  fastify.get('/:id', { preHandler: [authenticate, requirePermission('properties:read')] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const prop = await fastify.prisma.property.findFirst({
        where: { id: req.params.id, deletedAt: null },
        include: {
          owners: true,
          transactions: { orderBy: { date: 'desc' } },
        },
      })
      if (!prop) return sendError(reply, 'Property not found', 'সম্পত্তি পাওয়া যায়নি', 404)
      return sendSuccess(reply, prop)
    }
  )

  // POST /api/properties
  fastify.post('/', { preHandler: [authenticate, requirePermission('properties:create')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = createSchema.safeParse(req.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const count = await fastify.prisma.property.count()
      const propertyNo = `YGP-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

      const property = await fastify.prisma.property.create({
        data: {
          ...body.data,
          propertyNo,
          purchaseDate: new Date(body.data.purchaseDate),
        },
      })

      await writeAuditLog(fastify.prisma, {
        userId: req.user.sub, action: 'CREATE_PROPERTY',
        tableName: 'properties', recordId: property.id,
        newData: body.data, ipAddress: req.ip,
      })

      return sendSuccess(reply, { id: property.id, propertyNo }, 'Property added', 'সম্পত্তি যুক্ত হয়েছে', 201)
    }
  )
}
