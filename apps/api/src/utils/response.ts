import { FastifyReply } from 'fastify'

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  message = 'Success',
  messageBn = 'সফল',
  statusCode = 200
) {
  return reply.code(statusCode).send({ success: true, message, messageBn, data })
}

export function sendError(
  reply: FastifyReply,
  message: string,
  messageBn: string,
  statusCode = 400,
  error?: string
) {
  return reply.code(statusCode).send({ success: false, message, messageBn, error })
}

export function sendPaginated<T>(
  reply: FastifyReply,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
) {
  return reply.send({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}
