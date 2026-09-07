import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function syncDb() {
  console.log('🔄 Ensuring all database ENUM types and tables exist...');

  // 1. Create Enums if they do not exist
  const enums = [
    {
      name: 'Role',
      values: ['ADMINISTRATOR', 'PAO', 'STOREKEEPER', 'STOCK_CLERK', 'ACCOUNTANT', 'DEPARTMENT_HEAD', 'SECURITY_OFFICER'],
    },
    {
      name: 'ItemState',
      values: ['CREATED', 'AVAILABLE', 'RESERVED', 'ISSUED', 'DAMAGED', 'OBSOLETE', 'DISPOSED'],
    },
    {
      name: 'TransactionType',
      values: ['RECEIVE', 'ISSUE', 'TRANSFER', 'ADJUSTMENT'],
    },
    {
      name: 'InspectionStatus',
      values: ['ACCEPTED', 'REJECTED'],
    },
    {
      name: 'StockTakeStatus',
      values: ['DRAFT', 'COUNTING', 'COMPLETED'],
    },
    {
      name: 'ReconciliationStatus',
      values: ['PENDING', 'REJECTED', 'APPLIED'],
    },
    {
      name: 'WriteOffReason',
      values: ['DAMAGED', 'OBSOLETE', 'EXPIRED', 'OTHER'],
    },
    {
      name: 'WriteOffStatus',
      values: ['PENDING', 'APPROVED', 'REJECTED', 'DISPOSED'],
    },
  ];

  for (const e of enums) {
    try {
      const valStr = e.values.map((v) => `'${v}'`).join(', ');
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${e.name}') THEN
            CREATE TYPE "${e.name}" AS ENUM (${valStr});
          END IF;
        END$$;
      `);
      console.log(`✅ Enum type "${e.name}" confirmed`);
    } catch (err) {
      console.log(`ℹ️ Enum "${e.name}":`, (err as Error).message);
    }
  }

  // 2. Add isActive to Supplier if missing
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
    `);
    console.log('✅ Supplier.isActive column confirmed');
  } catch (err) {
    console.log('ℹ️ Supplier column check:', (err as Error).message);
  }

  // 3. Add isActive to User if missing
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
    `);
    console.log('✅ User.isActive column confirmed');
  } catch (err) {
    console.log('ℹ️ User column check:', (err as Error).message);
  }

  // 4. Ensure GoodsReceivingNote table exists
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GoodsReceivingNote" (
        "id" TEXT NOT NULL,
        "grnNumber" TEXT NOT NULL,
        "supplierId" TEXT NOT NULL,
        "warehouseId" TEXT NOT NULL,
        "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "receivedBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GoodsReceivingNote_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "GoodsReceivingNote_grnNumber_key" ON "GoodsReceivingNote"("grnNumber");
    `);
    console.log('✅ GoodsReceivingNote table confirmed');
  } catch (err) {
    console.log('ℹ️ GoodsReceivingNote table check:', (err as Error).message);
  }

  // 5. Ensure GoodsReceivingNoteItem table exists with proper InspectionStatus type
  try {
    // If the table already exists with text type or not, let's make sure inspectionStatus column uses InspectionStatus enum
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GoodsReceivingNoteItem" (
        "id" TEXT NOT NULL,
        "grnId" TEXT NOT NULL,
        "inventoryItemId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "unitCost" DOUBLE PRECISION NOT NULL,
        "inspectionStatus" "InspectionStatus" NOT NULL DEFAULT 'ACCEPTED',
        "rejectionReason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GoodsReceivingNoteItem_pkey" PRIMARY KEY ("id")
      );
    `);
    // In case column exists as text, convert it
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "GoodsReceivingNoteItem" ALTER COLUMN "inspectionStatus" TYPE "InspectionStatus" USING "inspectionStatus"::"InspectionStatus";
      `);
    } catch {
      // already InspectionStatus
    }
    console.log('✅ GoodsReceivingNoteItem table & inspectionStatus type confirmed');
  } catch (err) {
    console.log('ℹ️ GoodsReceivingNoteItem check:', (err as Error).message);
  }

  console.log('🎉 Database sync & type creation complete!');
  await prisma.$disconnect();
}

syncDb().catch(console.error);
