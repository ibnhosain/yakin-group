import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../middleware/auth'
import { sendSuccess } from '../utils/response'

export async function hrRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/hr/departments
  fastify.get('/departments', { preHandler: [authenticate] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const depts = await fastify.prisma.department.findMany({ orderBy: { name: 'asc' } })
      return sendSuccess(reply, depts)
    }
  )

  // GET /api/hr/designations
  fastify.get('/designations', { preHandler: [authenticate] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const desigs = await fastify.prisma.designation.findMany({ orderBy: { name: 'asc' } })
      return sendSuccess(reply, desigs)
    }
  )
}
