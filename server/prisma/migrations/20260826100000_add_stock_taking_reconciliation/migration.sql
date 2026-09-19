-- CreateEnum
CREATE TYPE "StockTakeStatus" AS ENUM ('DRAFT', 'COUNTING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'REJECTED', 'APPLIED');

-- CreateTable
CREATE TABLE "StockTake" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" "StockTakeStatus" NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTakeCount" (
    "id" TEXT NOT NULL,
    "stockTakeId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "systemQuantity" INTEGER NOT NULL,
    "physicalQuantity" INTEGER NOT NULL,
    "discrepancy" INTEGER NOT NULL,
    "hasDiscrepancy" BOOLEAN NOT NULL,
    "countedBy" TEXT NOT NULL,
    "countedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTakeCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconciliation" (
    "id" TEXT NOT NULL,
    "stockTakeCountId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "discrepancy" INTEGER NOT NULL,
    "reason" TEXT,
    "unitCost" DOUBLE PRECISION,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "adjustmentTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockTake_warehouseId_idx" ON "StockTake"("warehouseId");

-- CreateIndex
CREATE INDEX "StockTake_createdBy_idx" ON "StockTake"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "StockTakeCount_stockTakeId_inventoryItemId_key" ON "StockTakeCount"("stockTakeId", "inventoryItemId");

-- CreateIndex
CREATE INDEX "StockTakeCount_inventoryItemId_idx" ON "StockTakeCount"("inventoryItemId");

-- CreateIndex
CREATE INDEX "StockTakeCount_countedBy_idx" ON "StockTakeCount"("countedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Reconciliation_stockTakeCountId_key" ON "Reconciliation"("stockTakeCountId");

-- CreateIndex
CREATE UNIQUE INDEX "Reconciliation_adjustmentTransactionId_key" ON "Reconciliation"("adjustmentTransactionId");

-- CreateIndex
CREATE INDEX "Reconciliation_inventoryItemId_idx" ON "Reconciliation"("inventoryItemId");

-- CreateIndex
CREATE INDEX "Reconciliation_warehouseId_idx" ON "Reconciliation"("warehouseId");

-- CreateIndex
CREATE INDEX "Reconciliation_approvedBy_idx" ON "Reconciliation"("approvedBy");

-- CreateIndex
CREATE INDEX "Reconciliation_status_idx" ON "Reconciliation"("status");

-- AddForeignKey
ALTER TABLE "StockTake" ADD CONSTRAINT "StockTake_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTake" ADD CONSTRAINT "StockTake_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTakeCount" ADD CONSTRAINT "StockTakeCount_stockTakeId_fkey" FOREIGN KEY ("stockTakeId") REFERENCES "StockTake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTakeCount" ADD CONSTRAINT "StockTakeCount_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTakeCount" ADD CONSTRAINT "StockTakeCount_countedBy_fkey" FOREIGN KEY ("countedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_stockTakeCountId_fkey" FOREIGN KEY ("stockTakeCountId") REFERENCES "StockTakeCount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconciliation" ADD CONSTRAINT "Reconciliation_adjustmentTransactionId_fkey" FOREIGN KEY ("adjustmentTransactionId") REFERENCES "StockTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
