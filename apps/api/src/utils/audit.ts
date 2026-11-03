import { PrismaClient } from '@prisma/client'

export async function writeAuditLog(
  prisma: PrismaClient,
  params: {
    userId?: string
    action: string
    tableName: string
    recordId?: string
    oldData?: unknown
    newData?: unknown
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      tableName: params.tableName,
      recordId: params.recordId,
      oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : undefined,
      newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  }).catch(() => {
    // Audit log failure should never crash the main operation
    console.error('Audit log write failed silently for:', params.tableName, params.action)
  })
}
