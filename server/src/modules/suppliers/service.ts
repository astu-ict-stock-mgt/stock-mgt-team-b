import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';

export interface CreateSupplierInput {
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface UpdateSupplierInput {
  name?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface GetSuppliersParams {
  search?: string;
  isActive?: boolean;
}

const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new AppError('DATABASE_URL must be configured', 500);
  }

  return databaseUrl;
};

const createPrismaClient = (): PrismaClient =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  });

export const getSuppliers = async (params: GetSuppliersParams = {}) => {
  const prisma = createPrismaClient();

  try {
    const where: Record<string, unknown> = {};

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const search = params.search?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }

    return await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const getSupplierById = async (id: string) => {
  const prisma = createPrismaClient();

  try {
    const supplier = await prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    return supplier;
  } finally {
    await prisma.$disconnect();
  }
};

export const createSupplier = async (input: CreateSupplierInput) => {
  const prisma = createPrismaClient();

  try {
    return await prisma.supplier.create({
      data: {
        name: input.name.trim(),
        contactName: input.contactName?.trim() || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const updateSupplier = async (id: string, input: UpdateSupplierInput) => {
  const prisma = createPrismaClient();

  try {
    const supplier = await prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    const data: UpdateSupplierInput = {};

    if (input.name !== undefined) data.name = input.name.trim();
    if (input.contactName !== undefined) data.contactName = input.contactName?.trim() || null;
    if (input.phone !== undefined) data.phone = input.phone?.trim() || null;
    if (input.email !== undefined) data.email = input.email?.trim() || null;
    if (input.address !== undefined) data.address = input.address?.trim() || null;

    return await prisma.supplier.update({ where: { id }, data });
  } finally {
    await prisma.$disconnect();
  }
};

export const deleteSupplier = async (id: string) => {
  const prisma = createPrismaClient();

  try {
    const supplier = await prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    const [stockTransactionCount, goodsReceivingNoteCount] = await Promise.all([
      prisma.stockTransaction.count({ where: { supplierId: id } }),
      prisma.goodsReceivingNote.count({ where: { supplierId: id } }),
    ]);

    if (stockTransactionCount > 0 || goodsReceivingNoteCount > 0) {
      const deactivatedSupplier = await prisma.supplier.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        supplier: deactivatedSupplier,
        deactivated: true,
      };
    }

    const deletedSupplier = await prisma.supplier.delete({ where: { id } });

    return {
      supplier: deletedSupplier,
      deactivated: false,
    };
  } finally {
    await prisma.$disconnect();
  }
};
