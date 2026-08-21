-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "GoodsReceivingNote" (
    "id" TEXT NOT NULL,
    "grnNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceivingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceivingNoteItem" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "inspectionStatus" "InspectionStatus" NOT NULL,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceivingNoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceivingNote_grnNumber_key" ON "GoodsReceivingNote"("grnNumber");

-- CreateIndex
CREATE INDEX "GoodsReceivingNoteItem_grnId_idx" ON "GoodsReceivingNoteItem"("grnId");

-- CreateIndex
CREATE INDEX "GoodsReceivingNoteItem_inventoryItemId_idx" ON "GoodsReceivingNoteItem"("inventoryItemId");

-- AddForeignKey
ALTER TABLE "GoodsReceivingNote" ADD CONSTRAINT "GoodsReceivingNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceivingNote" ADD CONSTRAINT "GoodsReceivingNote_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceivingNote" ADD CONSTRAINT "GoodsReceivingNote_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceivingNoteItem" ADD CONSTRAINT "GoodsReceivingNoteItem_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceivingNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceivingNoteItem" ADD CONSTRAINT "GoodsReceivingNoteItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
