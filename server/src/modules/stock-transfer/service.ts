import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';

export interface CreateTransferInput {
  itemId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  userId: string;
  referenceNumber?: string;
}

const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new AppError('DATABASE_URL must be configured', 500);
  }

  return databaseUrl;
};

/**
 * Creates a new Prisma client instance scoped to a single request.
 *
 * We instantiate per-request (not as a module singleton) to:
 * - Enable proper mocking in unit tests
 * - Ensure connection cleanup via $disconnect() in finally blocks
 * - Prevent connection pool exhaustion in high-concurrency scenarios
 *
 * Trade-off: Slightly higher overhead per request vs. better testability & resource management.
 */
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getDatabaseUrl(),
    }),
  });
};

export const createStockTransfer = async (
  input: CreateTransferInput,
) => {
  const prisma = createPrismaClient();

  try {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: {
          id: input.itemId,
        },
      });

      if (!item) {
        throw new AppError(
          `Inventory item (id: ${input.itemId}) not found`,
          404,
        );
      }

      const sourceWarehouse = await tx.warehouse.findUnique({
        where: {
          id: input.fromWarehouseId,
        },
      });

      if (!sourceWarehouse) {
        throw new AppError(
          `Source warehouse (id: ${input.fromWarehouseId}) not found`,
          404,
        );
      }

      const destinationWarehouse = await tx.warehouse.findUnique({
        where: {
          id: input.toWarehouseId,
        },
      });

      if (!destinationWarehouse) {
        throw new AppError(
          `Destination warehouse (id: ${input.toWarehouseId}) not found`,
          404,
        );
      }

      const sourceBinCard = await tx.binCard.findUnique({
        where: {
          inventoryItemId_warehouseId: {
            inventoryItemId: input.itemId,
            warehouseId: input.fromWarehouseId,
          },
        },
      });

      if (!sourceBinCard) {
        throw new AppError(
          `Source stock record not found for item (id: ${input.itemId}) in warehouse (id: ${input.fromWarehouseId})`,
          404,
        );
      }

      if (sourceBinCard.balance < input.quantity) {
        throw new AppError(
          `Insufficient stock for item (id: ${input.itemId}) in warehouse (id: ${input.fromWarehouseId}). ` +
          `Available: ${sourceBinCard.balance}, Required: ${input.quantity}`,
          400,
        );
      }

      /**
       * Atomically deduct the source quantity using optimistic locking.
       *
       * Why this pattern instead of SELECT...FOR UPDATE?
       * - Prisma doesn't support SELECT...FOR UPDATE without raw SQL
       * - Optimistic locking via balance comparison is race-condition safe:
       *   If another transfer decrements between our read (line 89) and this
       *   update, the condition `balance >= quantity` fails, updateMany returns
       *   count: 0, and we throw "Insufficient stock" instead of going negative.
       *
       * The count check (line 116) ensures exactly 1 row was updated.
       * If count !== 1, another concurrent transfer succeeded, and we fail safely.
       */
      const sourceUpdate = await tx.binCard.updateMany({
        where: {
          id: sourceBinCard.id,
          balance: {
            gte: input.quantity,
          },
        },
        data: {
          balance: {
            decrement: input.quantity,
          },
          lastUpdated: new Date(),
        },
      });

      if (sourceUpdate.count !== 1) {
        throw new AppError(
          `Insufficient stock. Source stock for item (id: ${input.itemId}) ` +
          `changed or was reduced by another transfer before this transfer could be completed. ` +
          `Available: ${sourceBinCard.balance}, Required: ${input.quantity}`,
          400,
        );
      }

      const destinationBinCard = await tx.binCard.upsert({
        where: {
          inventoryItemId_warehouseId: {
            inventoryItemId: input.itemId,
            warehouseId: input.toWarehouseId,
          },
        },
        update: {
          balance: {
            increment: input.quantity,
          },
          lastUpdated: new Date(),
        },
        create: {
          inventoryItemId: input.itemId,
          warehouseId: input.toWarehouseId,
          balance: input.quantity,
          lastUpdated: new Date(),
        },
      });

      /*
       * The current StockTransaction schema stores one warehouseId.
       * For a transfer, this is the source warehouse.
       *
       * The destination warehouse is preserved in the authenticated
       * request/audit trail through the existing auditLogger middleware.
       */
      const sourceTransaction = await tx.stockTransaction.findFirst({
        where: {
          inventoryItemId: input.itemId,
          warehouseId: input.fromWarehouseId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const unitCost = sourceTransaction?.unitCost ?? null;

      const transaction = await tx.stockTransaction.create({
        data: {
          type: 'TRANSFER',
          inventoryItemId: input.itemId,
          warehouseId: input.fromWarehouseId,
          quantity: input.quantity,
          unitCost,
          totalValue:
            unitCost !== null
              ? input.quantity * unitCost
              : null,
          referenceNumber: input.referenceNumber ?? null,
          userId: input.userId,
        },
      });

      /**
       * Returns transfer confirmation with updated balances.
       *
       * NOTE on balance fields:
       * - sourceBalance: Calculated as (balance at start of transaction - quantity transferred).
       *   Reflects the expected state if no concurrent updates occur.
       *   For real-time balance, query BinCard directly after response.
       * - destinationBalance: Actual balance after upsert (from Prisma response).
       *   This is the post-operation state as confirmed by the database.
       */
      return {
        transaction,
        sourceWarehouseId: input.fromWarehouseId,
        destinationWarehouseId: input.toWarehouseId,
        quantity: input.quantity,
        sourceBalance: sourceBinCard.balance - input.quantity,
        destinationBalance: destinationBinCard.balance,
      };
    });
  } finally {
    await prisma.$disconnect();
  }
};