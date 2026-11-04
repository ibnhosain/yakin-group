import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { sendSuccess, sendError, sendPaginated } from '../utils/response'
import { writeAuditLog } from '../utils/audit'

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().int().default(0),
  mimeType: z.string().default('application/octet-stream'),
  ownerType: z.string().optional(),
  ownerId: z.string().optional(),
  expiresAt: z.string().optional(),
})

export async function documentRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/documents/categories
  fastify.get('/categories', { preHandler: [authenticate] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const cats = await fastify.prisma.documentCategory.findMany({ orderBy: { name: 'asc' } })
      return sendSuccess(reply, cats)
    }
  )

  // GET /api/documents
  fastify.get('/', { preHandler: [authenticate, requirePermission('documents:read')] },
    async (req: FastifyRequest<{ Querystring: { search?: string; categoryId?: string; ownerType?: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
      const { search, categoryId, ownerType, page = '1', limit = '20' } = req.query
      const p = parseInt(page); const l = parseInt(limit)
      const where: Record<string, unknown> = { deletedAt: null }
      if (categoryId) where.categoryId = categoryId
      if (ownerType) where.ownerType = ownerType
      if (search) where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ]

      const [docs, total] = await Promise.all([
        fastify.prisma.document.findMany({
          where, skip: (p - 1) * l, take: l,
          orderBy: { createdAt: 'desc' },
          include: {
            category: { select: { name: true, nameBn: true } },
            uploadedBy: { select: { fullName: true } },
          },
        }),
        fastify.prisma.document.count({ where }),
      ])

      const data = docs.map(d => ({
        id: d.id, title: d.title, description: d.description,
        categoryName: d.category?.nameBn ?? d.category?.name ?? '—',
        fileName: d.fileName, fileSize: d.fileSize, mimeType: d.mimeType,
        fileUrl: d.fileUrl, ownerType: d.ownerType, ownerId: d.ownerId,
        uploadedByName: d.uploadedBy.fullName, expiresAt: d.expiresAt?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
      }))

      return sendPaginated(reply, data, total, p, l)
    }
  )

  // GET /api/documents/:id
  fastify.get('/:id', { preHandler: [authenticate, requirePermission('documents:read')] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const doc = await fastify.prisma.document.findFirst({
        where: { id: req.params.id, deletedAt: null },
        include: {
          category: { select: { name: true, nameBn: true } },
          uploadedBy: { select: { fullName: true } },
        },
      })
      if (!doc) return sendError(reply, 'Document not found', 'দলিল পাওয়া যায়নি', 404)
      return sendSuccess(reply, {
        id: doc.id, title: doc.title, description: doc.description,
        categoryName: doc.category?.nameBn ?? doc.category?.name ?? '—',
        fileName: doc.fileName, fileSize: doc.fileSize, mimeType: doc.mimeType,
        fileUrl: doc.fileUrl, ownerType: doc.ownerType, ownerId: doc.ownerId,
        uploadedByName: doc.uploadedBy.fullName,
        expiresAt: doc.expiresAt?.toISOString() ?? null,
        createdAt: doc.createdAt.toISOString(),
      })
    }
  )

  // POST /api/documents
  fastify.post('/', { preHandler: [authenticate, requirePermission('documents:create')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = createSchema.safeParse(req.body)
      if (!body.success) return sendError(reply, body.error.errors[0].message, body.error.errors[0].message, 400)

      const { expiresAt, ...rest } = body.data
      const doc = await fastify.prisma.document.create({
        data: {
          ...rest,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          uploadedById: req.user.sub,
        },
      })

      await writeAuditLog(fastify.prisma, {
        userId: req.user.sub, action: 'UPLOAD_DOCUMENT',
        tableName: 'documents', recordId: doc.id,
        newData: { title: body.data.title, fileName: body.data.fileName }, ipAddress: req.ip,
      })

      return sendSuccess(reply, { id: doc.id }, 'Document uploaded', 'দলিল আপলোড হয়েছে', 201)
    }
  )

  // DELETE /api/documents/:id  — soft delete
  fastify.delete('/:id', { preHandler: [authenticate, requirePermission('documents:delete')] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const doc = await fastify.prisma.document.findFirst({ where: { id: req.params.id, deletedAt: null } })
      if (!doc) return sendError(reply, 'Document not found', 'দলিল পাওয়া যায়নি', 404)

      await fastify.prisma.document.update({ where: { id: doc.id }, data: { deletedAt: new Date() } })
      return sendSuccess(reply, null, 'Document deleted', 'দলিল মুছে ফেলা হয়েছে')
    }
  )
}
