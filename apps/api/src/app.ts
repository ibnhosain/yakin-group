import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import multipart from '@fastify/multipart'
import prismaPlugin from './plugins/prisma'
import { authRoutes } from './routes/auth'
import { dashboardRoutes } from './routes/dashboard'
import { memberRoutes } from './routes/members'
import { accountingRoutes } from './routes/accounting'
import { approvalRoutes } from './routes/approvals'
import { investorRoutes } from './routes/investors'
import { employeeRoutes } from './routes/employees'
import { businessRoutes } from './routes/businesses'
import { notificationRoutes } from './routes/notifications'
import { settingsRoutes } from './routes/settings'
import { hrRoutes } from './routes/hr'
import { projectRoutes } from './routes/projects'
import { propertyRoutes } from './routes/properties'
import { meetingRoutes } from './routes/meetings'
import { documentRoutes } from './routes/documents'
import { config } from './config'

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: config.isDev ? 'info' : 'warn',
      transport: config.isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
    },
    trustProxy: true,
  })

  // Register plugins
  await fastify.register(sensible)

  await fastify.register(cors, {
    origin: config.cors.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: () => ({
      success: false,
      message: 'Too many requests',
      messageBn: 'অনেক বেশি অনুরোধ — কিছুক্ষণ পরে আবার চেষ্টা করুন',
    }),
  })

  await fastify.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file upload
  })

  // Database
  await fastify.register(prismaPlugin)

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString(), app: 'Yakin Group API' }))

  // Routes
  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(dashboardRoutes, { prefix: '/api/dashboard' })
  await fastify.register(memberRoutes, { prefix: '/api/members' })
  await fastify.register(accountingRoutes, { prefix: '/api/accounting' })
  await fastify.register(approvalRoutes, { prefix: '/api/approvals' })
  await fastify.register(investorRoutes, { prefix: '/api/investors' })
  await fastify.register(hrRoutes, { prefix: '/api/hr' })
  await fastify.register(employeeRoutes, { prefix: '/api/hr/employees' })
  await fastify.register(businessRoutes, { prefix: '/api/businesses' })
  await fastify.register(notificationRoutes, { prefix: '/api/notifications' })
  await fastify.register(settingsRoutes, { prefix: '/api/settings' })
  await fastify.register(projectRoutes, { prefix: '/api/projects' })
  await fastify.register(propertyRoutes, { prefix: '/api/properties' })
  await fastify.register(meetingRoutes, { prefix: '/api/meetings' })
  await fastify.register(documentRoutes, { prefix: '/api/documents' })

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({ success: false, message: `Route ${request.method} ${request.url} not found`, messageBn: 'পথ পাওয়া যায়নি' })
  })

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error)
    const statusCode = error.statusCode ?? 500
    reply.code(statusCode).send({
      success: false,
      message: config.isDev ? error.message : 'Internal server error',
      messageBn: 'সার্ভার ত্রুটি',
      ...(config.isDev && { stack: error.stack }),
    })
  })

  return fastify
}
