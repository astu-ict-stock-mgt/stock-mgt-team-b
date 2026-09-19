import { PrismaClient, Prisma } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const getPrisma = (): PrismaClient => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
};

export interface CreateAuditLogInput {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: object;
}

export const createAuditLog = async (input: CreateAuditLogInput) => {
  const prisma = getPrisma();
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId || null,
      details: input.details ? (input.details as Prisma.JsonObject) : Prisma.JsonNull,
    },
  });
};

export const getAuditLogs = async () => {
  const prisma = getPrisma();
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
};
