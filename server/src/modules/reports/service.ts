import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';
import type {
  CategoryMovementAggregation,
  CategoryValuationAggregation,
  CreateReportRecordDto,
  IssuingReportResult,
  MonthlyTrendAggregation,
  ReceivingReportResult,
  ReportFilters,
  ReportsOverviewSummary,
  SavedReportRecord,
  StockMovementReportResult,
  StockStatusReportResult,
  SupplierReportResult,
  TopIssuedItemAggregation,
  ValuationReportResult,
  WarehouseMovementAggregation,
} from './types.ts';
import 'dotenv/config';

const getPrisma = (): PrismaClient => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
};

const buildDateFilter = (dateFrom?: Date | string, dateTo?: Date | string) => {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  const filter: { gte?: Date; lte?: Date } = {};
  if (dateFrom) {
    filter.gte = typeof dateFrom === 'string' ? new Date(dateFrom) : dateFrom;
  }
  if (dateTo) {
    const parsedTo = typeof dateTo === 'string' ? new Date(dateTo) : new Date(dateTo);
    // If date has no explicit time, set to end of day
    if (parsedTo.getHours() === 0 && parsedTo.getMinutes() === 0 && parsedTo.getSeconds() === 0) {
      parsedTo.setHours(23, 59, 59, 999);
    }
    filter.lte = parsedTo;
  }
  return filter;
};

/**
 * Stock movement report across all transaction types (RECEIVE, ISSUE, TRANSFER, ADJUSTMENT)
 */
export const getStockMovementReport = async (
  filters: ReportFilters = {}
): Promise<StockMovementReportResult> => {
  const prisma = getPrisma();
  const createdAt = buildDateFilter(filters.dateFrom, filters.dateTo);

  const where: Record<string, unknown> = {};

  if (createdAt) where.createdAt = createdAt;
  if (filters.warehouseId) where.warehouseId = filters.warehouseId;
  if (filters.supplierId) where.supplierId = filters.supplierId;
  if (filters.inventoryItemId) where.inventoryItemId = filters.inventoryItemId;
  if (filters.type) where.type = filters.type;

  const transactions = await prisma.stockTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      inventoryItem: {
        include: {
          category: true,
        },
      },
      warehouse: true,
      supplier: true,
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

  const summary = {
    totalTransactions: transactions.length,
    totalReceived: 0,
    totalIssued: 0,
    totalTransferred: 0,
    totalAdjusted: 0,
    netQuantity: 0,
    totalValueReceived: 0,
    totalValueIssued: 0,
  };

  const mappedTransactions = transactions.map((t) => {
    const qty = t.quantity || 0;
    const val = t.totalValue ?? (t.unitCost ? t.unitCost * qty : 0);

    if (t.type === 'RECEIVE') {
      summary.totalReceived += qty;
      summary.totalValueReceived += val;
      summary.netQuantity += qty;
    } else if (t.type === 'ISSUE') {
      summary.totalIssued += qty;
      summary.totalValueIssued += val;
      summary.netQuantity -= qty;
    } else if (t.type === 'TRANSFER') {
      summary.totalTransferred += qty;
    } else if (t.type === 'ADJUSTMENT') {
      summary.totalAdjusted += qty;
      summary.netQuantity += qty;
    }

    return {
      id: t.id,
      type: t.type,
      inventoryItemId: t.inventoryItemId,
      itemCode: t.inventoryItem?.itemCode ?? 'N/A',
      itemName: t.inventoryItem?.name ?? 'Unknown Item',
      categoryName: t.inventoryItem?.category?.name,
      warehouseId: t.warehouseId,
      warehouseName: t.warehouse?.name,
      quantity: t.quantity,
      unitCost: t.unitCost,
      totalValue: t.totalValue,
      receivedDate: t.receivedDate,
      referenceNumber: t.referenceNumber,
      supplierId: t.supplierId,
      supplierName: t.supplier?.name ?? null,
      userId: t.userId,
      userName: t.user ? `${t.user.firstName} ${t.user.lastName}`.trim() : 'Unknown',
      createdAt: t.createdAt,
    };
  });

  return {
    summary,
    transactions: mappedTransactions,
  };
};

/**
 * Stock receiving report (Goods received notes & receipts summary)
 */
export const getReceivingReport = async (
  filters: ReportFilters = {}
): Promise<ReceivingReportResult> => {
  const prisma = getPrisma();
  const createdAt = buildDateFilter(filters.dateFrom, filters.dateTo);

  const where: Record<string, unknown> = {
    type: 'RECEIVE',
  };

  if (createdAt) where.createdAt = createdAt;
  if (filters.warehouseId) where.warehouseId = filters.warehouseId;
  if (filters.supplierId) where.supplierId = filters.supplierId;
  if (filters.inventoryItemId) where.inventoryItemId = filters.inventoryItemId;

  const transactions = await prisma.stockTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      inventoryItem: true,
      warehouse: true,
      supplier: true,
    },
  });

  const supplierIds = new Set<string>();
  const warehouseIds = new Set<string>();
  let totalQuantity = 0;
  let totalValue = 0;

  const mappedTransactions = transactions.map((t) => {
    if (t.supplierId) supplierIds.add(t.supplierId);
    if (t.warehouseId) warehouseIds.add(t.warehouseId);
    totalQuantity += t.quantity;
    const val = t.totalValue ?? (t.unitCost ? t.unitCost * t.quantity : 0);
    totalValue += val;

    return {
      id: t.id,
      referenceNumber: t.referenceNumber,
      inventoryItemId: t.inventoryItemId,
      itemCode: t.inventoryItem?.itemCode ?? 'N/A',
      itemName: t.inventoryItem?.name ?? 'Unknown Item',
      supplierId: t.supplierId,
      supplierName: t.supplier?.name ?? 'Unknown Supplier',
      warehouseId: t.warehouseId,
      warehouseName: t.warehouse?.name ?? 'Unknown Warehouse',
      quantity: t.quantity,
      unitCost: t.unitCost,
      totalValue: t.totalValue,
      receivedDate: t.receivedDate,
      createdAt: t.createdAt,
    };
  });

  return {
    summary: {
      totalReceipts: transactions.length,
      totalQuantity,
      totalValue: Math.round(totalValue * 100) / 100,
      uniqueSuppliers: supplierIds.size,
      uniqueWarehouseCount: warehouseIds.size,
    },
    transactions: mappedTransactions,
  };
};

/**
 * Stock issuing report (Issued items & department allocation)
 */
export const getIssuingReport = async (
  filters: ReportFilters = {}
): Promise<IssuingReportResult> => {
  const prisma = getPrisma();
  const createdAt = buildDateFilter(filters.dateFrom, filters.dateTo);

  const where: Record<string, unknown> = {
    type: 'ISSUE',
  };

  if (createdAt) where.createdAt = createdAt;
  if (filters.warehouseId) where.warehouseId = filters.warehouseId;
  if (filters.inventoryItemId) where.inventoryItemId = filters.inventoryItemId;

  const transactions = await prisma.stockTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      inventoryItem: true,
      warehouse: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          department: true,
        },
      },
    },
  });

  let totalQuantity = 0;
  let totalValue = 0;

  const mappedTransactions = transactions.map((t) => {
    totalQuantity += t.quantity;
    const val = t.totalValue ?? (t.unitCost ? t.unitCost * t.quantity : 0);
    totalValue += val;

    return {
      id: t.id,
      referenceNumber: t.referenceNumber,
      inventoryItemId: t.inventoryItemId,
      itemCode: t.inventoryItem?.itemCode ?? 'N/A',
      itemName: t.inventoryItem?.name ?? 'Unknown Item',
      warehouseId: t.warehouseId,
      warehouseName: t.warehouse?.name ?? 'Unknown Warehouse',
      quantity: t.quantity,
      unitCost: t.unitCost,
      totalValue: t.totalValue,
      department: t.user?.department ?? null,
      userId: t.userId,
      issuedByName: t.user ? `${t.user.firstName} ${t.user.lastName}`.trim() : 'Unknown',
      createdAt: t.createdAt,
    };
  });

  return {
    summary: {
      totalIssues: transactions.length,
      totalQuantity,
      totalValue: Math.round(totalValue * 100) / 100,
    },
    transactions: mappedTransactions,
  };
};

/**
 * FIFO inventory valuation report
 */
export const getInventoryValuationReport = async (
  filters: ReportFilters = {}
): Promise<ValuationReportResult> => {
  const prisma = getPrisma();

  const where: Record<string, unknown> = {};
  if (filters.warehouseId) where.warehouseId = filters.warehouseId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.inventoryItemId) where.id = filters.inventoryItemId;

  const items = await prisma.inventoryItem.findMany({
    where,
    include: {
      category: true,
      warehouse: true,
      StockLot: {
        where: {
          quantityRemaining: { gt: 0 },
        },
        orderBy: {
          receivedDate: 'asc', // FIFO ordering
        },
      },
    },
    orderBy: { itemCode: 'asc' },
  });

  let totalFifoValuation = 0;
  let totalQuantityOnHand = 0;
  let activeLotsCount = 0;

  const mappedItems = items.map((item) => {
    let itemFifoValue = 0;
    let itemQuantity = 0;

    const mappedLots = (item.StockLot || []).map((lot) => {
      const lotValue = lot.quantityRemaining * lot.unitCost;
      itemFifoValue += lotValue;
      itemQuantity += lot.quantityRemaining;
      activeLotsCount += 1;

      return {
        lotId: lot.id,
        quantityReceived: lot.quantityReceived,
        quantityRemaining: lot.quantityRemaining,
        unitCost: lot.unitCost,
        totalLotValue: Math.round(lotValue * 100) / 100,
        receivedDate: lot.receivedDate,
        isDepleted: lot.isDepleted,
      };
    });

    totalFifoValuation += itemFifoValue;
    totalQuantityOnHand += itemQuantity;

    const avgCost = itemQuantity > 0 ? itemFifoValue / itemQuantity : 0;

    return {
      inventoryItemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      categoryName: item.category?.name ?? 'Uncategorized',
      warehouseName: item.warehouse?.name ?? 'General Store',
      totalQuantityOnHand: itemQuantity,
      averageUnitCost: Math.round(avgCost * 100) / 100,
      totalFifoValue: Math.round(itemFifoValue * 100) / 100,
      lots: mappedLots,
    };
  });

  return {
    summary: {
      totalItems: items.length,
      totalQuantityOnHand,
      totalFifoValuation: Math.round(totalFifoValuation * 100) / 100,
      activeLotsCount,
    },
    items: mappedItems,
  };
};

/**
 * Supplier performance report
 */
export const getSupplierReport = async (
  filters: ReportFilters = {}
): Promise<SupplierReportResult> => {
  const prisma = getPrisma();
  const createdAt = buildDateFilter(filters.dateFrom, filters.dateTo);

  const where: Record<string, unknown> = {};
  if (filters.supplierId) where.id = filters.supplierId;

  const suppliers = await prisma.supplier.findMany({
    where,
    include: {
      StockTransaction: {
        where: {
          type: 'RECEIVE',
          ...(createdAt ? { createdAt } : {}),
          ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  let totalDeliveries = 0;
  let totalValueSupplied = 0;

  const mappedSuppliers = suppliers.map((s) => {
    const transactions = s.StockTransaction || [];
    let qtySupplied = 0;
    let valSupplied = 0;
    let lastDate: Date | null = null;

    transactions.forEach((tx) => {
      qtySupplied += tx.quantity;
      const v = tx.totalValue ?? (tx.unitCost ? tx.unitCost * tx.quantity : 0);
      valSupplied += v;
      if (!lastDate || new Date(tx.createdAt) > new Date(lastDate)) {
        lastDate = tx.createdAt;
      }
    });

    totalDeliveries += transactions.length;
    totalValueSupplied += valSupplied;

    return {
      supplierId: s.id,
      supplierName: s.name,
      contactName: s.contactName,
      email: s.email,
      phone: s.phone,
      totalDeliveries: transactions.length,
      totalQuantitySupplied: qtySupplied,
      totalSuppliedValue: Math.round(valSupplied * 100) / 100,
      lastDeliveryDate: lastDate,
    };
  });

  return {
    summary: {
      totalSuppliers: suppliers.length,
      totalDeliveries,
      totalValueSupplied: Math.round(totalValueSupplied * 100) / 100,
    },
    suppliers: mappedSuppliers,
  };
};

/**
 * Stock status and low-stock health report
 */
export const getStockStatusReport = async (
  filters: ReportFilters = {}
): Promise<StockStatusReportResult> => {
  const prisma = getPrisma();

  const where: Record<string, unknown> = {};
  if (filters.warehouseId) where.warehouseId = filters.warehouseId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.state) where.state = filters.state;

  const items = await prisma.inventoryItem.findMany({
    where,
    include: {
      category: true,
      warehouse: true,
      BinCard: true,
    },
    orderBy: { name: 'asc' },
  });

  const stateBreakdown: Record<string, number> = {};
  let lowStockCount = 0;
  let belowSafetyStockCount = 0;
  let outOfStockCount = 0;

  const mappedItems = items.map((item) => {
    const currentStock = (item.BinCard || []).reduce((acc, bc) => acc + bc.balance, 0);
    const isLow = currentStock <= item.reorderLevel;
    const isSafety = currentStock <= item.safetyStock;

    if (isLow) lowStockCount += 1;
    if (isSafety) belowSafetyStockCount += 1;
    if (currentStock === 0) outOfStockCount += 1;

    stateBreakdown[item.state] = (stateBreakdown[item.state] || 0) + 1;

    return {
      inventoryItemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      categoryName: item.category?.name ?? 'Uncategorized',
      warehouseName: item.warehouse?.name ?? 'Main Warehouse',
      state: item.state,
      currentStock,
      minLevel: item.minLevel,
      maxLevel: item.maxLevel,
      reorderLevel: item.reorderLevel,
      safetyStock: item.safetyStock,
      isLowStock: isLow,
      isBelowSafetyStock: isSafety,
    };
  });

  return {
    summary: {
      totalItems: items.length,
      lowStockItemsCount: lowStockCount,
      belowSafetyStockCount: belowSafetyStockCount,
      outOfStockCount,
      stateBreakdown,
    },
    items: mappedItems,
  };
};

/**
 * Overview summary metrics for the reports dashboard
 */
export const getReportsOverviewSummary = async (
  filters: ReportFilters = {}
): Promise<ReportsOverviewSummary> => {
  const prisma = getPrisma();
  const createdAt = buildDateFilter(filters.dateFrom, filters.dateTo);

  const txWhere: Record<string, unknown> = {};
  if (createdAt) txWhere.createdAt = createdAt;
  if (filters.warehouseId) txWhere.warehouseId = filters.warehouseId;

  const [transactions, items, suppliers, lots] = await Promise.all([
    prisma.stockTransaction.findMany({ where: txWhere }),
    prisma.inventoryItem.findMany({
      where: filters.warehouseId ? { warehouseId: filters.warehouseId } : {},
      include: { BinCard: true },
    }),
    prisma.supplier.count(),
    prisma.stockLot.findMany({
      where: {
        quantityRemaining: { gt: 0 },
        ...(filters.warehouseId ? { inventoryItem: { warehouseId: filters.warehouseId } } : {}),
      },
    }),
  ]);

  let totalReceivedValue = 0;
  let totalIssuedValue = 0;
  transactions.forEach((tx) => {
    const val = tx.totalValue ?? (tx.unitCost ? tx.unitCost * tx.quantity : 0);
    if (tx.type === 'RECEIVE') totalReceivedValue += val;
    if (tx.type === 'ISSUE') totalIssuedValue += val;
  });

  let totalFifoInventoryValue = 0;
  lots.forEach((l) => {
    totalFifoInventoryValue += l.quantityRemaining * l.unitCost;
  });

  let lowStockCount = 0;
  items.forEach((item) => {
    const stock = (item.BinCard || []).reduce((acc, bc) => acc + bc.balance, 0);
    if (stock <= item.reorderLevel) {
      lowStockCount += 1;
    }
  });

  return {
    totalTransactions: transactions.length,
    totalReceivedValue: Math.round(totalReceivedValue * 100) / 100,
    totalIssuedValue: Math.round(totalIssuedValue * 100) / 100,
    totalFifoInventoryValue: Math.round(totalFifoInventoryValue * 100) / 100,
    totalItemsCount: items.length,
    lowStockCount,
    totalSuppliersCount: suppliers,
  };
};

/**
 * Generate CSV formatted report string
 */
export const generateReportCsv = async (
  reportType: string,
  filters: ReportFilters = {}
): Promise<{ filename: string; content: string }> => {
  const timestamp = new Date().toISOString().slice(0, 10);

  if (reportType === 'stock-movement') {
    const { transactions } = await getStockMovementReport(filters);
    const headers = [
      'ID',
      'Type',
      'Item Code',
      'Item Name',
      'Category',
      'Warehouse',
      'Quantity',
      'Unit Cost',
      'Total Value',
      'Reference No',
      'Supplier',
      'Recorded By',
      'Date',
    ];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      `"${t.itemCode}"`,
      `"${t.itemName.replace(/"/g, '""')}"`,
      `"${t.categoryName || ''}"`,
      `"${t.warehouseName || ''}"`,
      t.quantity,
      t.unitCost ?? 0,
      t.totalValue ?? 0,
      `"${t.referenceNumber || ''}"`,
      `"${t.supplierName || ''}"`,
      `"${t.userName || ''}"`,
      new Date(t.createdAt).toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return { filename: `stock-movement-report-${timestamp}.csv`, content: csvContent };
  }

  if (reportType === 'receiving') {
    const { transactions } = await getReceivingReport(filters);
    const headers = [
      'ID',
      'Reference No',
      'Item Code',
      'Item Name',
      'Supplier',
      'Warehouse',
      'Quantity',
      'Unit Cost',
      'Total Value',
      'Received Date',
    ];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.referenceNumber || ''}"`,
      `"${t.itemCode}"`,
      `"${t.itemName.replace(/"/g, '""')}"`,
      `"${t.supplierName || ''}"`,
      `"${t.warehouseName}"`,
      t.quantity,
      t.unitCost ?? 0,
      t.totalValue ?? 0,
      t.receivedDate ? new Date(t.receivedDate).toISOString() : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return { filename: `receiving-report-${timestamp}.csv`, content: csvContent };
  }

  if (reportType === 'issuing') {
    const { transactions } = await getIssuingReport(filters);
    const headers = [
      'ID',
      'Reference No',
      'Item Code',
      'Item Name',
      'Warehouse',
      'Quantity',
      'Unit Cost',
      'Total Value',
      'Department',
      'Issued By',
      'Date',
    ];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.referenceNumber || ''}"`,
      `"${t.itemCode}"`,
      `"${t.itemName.replace(/"/g, '""')}"`,
      `"${t.warehouseName}"`,
      t.quantity,
      t.unitCost ?? 0,
      t.totalValue ?? 0,
      `"${t.department || ''}"`,
      `"${t.issuedByName}"`,
      new Date(t.createdAt).toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return { filename: `issuing-report-${timestamp}.csv`, content: csvContent };
  }

  if (reportType === 'valuation') {
    const { items } = await getInventoryValuationReport(filters);
    const headers = [
      'Item Code',
      'Item Name',
      'Category',
      'Warehouse',
      'Quantity on Hand',
      'Avg Unit Cost',
      'Total FIFO Value',
    ];
    const rows = items.map((i) => [
      `"${i.itemCode}"`,
      `"${i.itemName.replace(/"/g, '""')}"`,
      `"${i.categoryName}"`,
      `"${i.warehouseName}"`,
      i.totalQuantityOnHand,
      i.averageUnitCost,
      i.totalFifoValue,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return { filename: `fifo-valuation-report-${timestamp}.csv`, content: csvContent };
  }

  if (reportType === 'suppliers') {
    const { suppliers } = await getSupplierReport(filters);
    const headers = [
      'Supplier Name',
      'Contact',
      'Email',
      'Phone',
      'Total Deliveries',
      'Total Units Supplied',
      'Total Value Supplied',
      'Last Delivery Date',
    ];
    const rows = suppliers.map((s) => [
      `"${s.supplierName.replace(/"/g, '""')}"`,
      `"${s.contactName || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
      s.totalDeliveries,
      s.totalQuantitySupplied,
      s.totalSuppliedValue,
      s.lastDeliveryDate ? new Date(s.lastDeliveryDate).toISOString() : 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return { filename: `suppliers-report-${timestamp}.csv`, content: csvContent };
  }

  if (reportType === 'stock-status') {
    const { items } = await getStockStatusReport(filters);
    const headers = [
      'Item Code',
      'Item Name',
      'Category',
      'Warehouse',
      'State',
      'Current Stock',
      'Reorder Level',
      'Safety Stock',
      'Low Stock Alert',
    ];
    const rows = items.map((i) => [
      `"${i.itemCode}"`,
      `"${i.itemName.replace(/"/g, '""')}"`,
      `"${i.categoryName}"`,
      `"${i.warehouseName}"`,
      i.state,
      i.currentStock,
      i.reorderLevel,
      i.safetyStock,
      i.isLowStock ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return { filename: `stock-status-report-${timestamp}.csv`, content: csvContent };
  }

  throw new AppError(`Unsupported report type for export: ${reportType}`, 400);
};

/**
 * Save report generation metadata into the Report entity
 */
export const createReportRecord = async (
  data: CreateReportRecordDto,
  userId: string
): Promise<SavedReportRecord> => {
  const prisma = getPrisma();

  const report = await prisma.report.create({
    data: {
      name: data.name,
      type: data.type,
      generatedBy: userId,
      parameters: (data.parameters || {}) as Prisma.InputJsonValue,
      fileUrl: data.fileUrl ?? null,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (userId) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'REPORT_GENERATED',
          entity: 'Report',
          entityId: report.id,
          details: { name: report.name, type: report.type },
        },
      });
    } catch {
      // Don't fail report creation on audit log failure
    }
  }

  return {
    id: report.id,
    name: report.name,
    type: report.type,
    generatedBy: report.generatedBy,
    generatorName: report.user
      ? `${report.user.firstName} ${report.user.lastName}`.trim()
      : undefined,
    parameters: report.parameters,
    fileUrl: report.fileUrl,
    createdAt: report.createdAt,
  };
};

/**
 * List historical generated reports
 */
export const getReportRecords = async (): Promise<SavedReportRecord[]> => {
  const prisma = getPrisma();
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return reports.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    generatedBy: r.generatedBy,
    generatorName: r.user ? `${r.user.firstName} ${r.user.lastName}`.trim() : undefined,
    parameters: r.parameters,
    fileUrl: r.fileUrl,
    createdAt: r.createdAt,
  }));
};

/**
 * Get a single report record by ID
 */
export const getReportRecordById = async (id: string): Promise<SavedReportRecord> => {
  const prisma = getPrisma();
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!report) {
    throw new AppError('Report not found', 404);
  }

  return {
    id: report.id,
    name: report.name,
    type: report.type,
    generatedBy: report.generatedBy,
    generatorName: report.user
      ? `${report.user.firstName} ${report.user.lastName}`.trim()
      : undefined,
    parameters: report.parameters,
    fileUrl: report.fileUrl,
    createdAt: report.createdAt,
  };
};

/**
 * Data Aggregation: Movement analytics grouped by Item Category
 */
export const getCategoryMovementAggregation = async (
  filters: ReportFilters = {}
): Promise<CategoryMovementAggregation[]> => {
  const prisma = getPrisma();
  const createdAt = buildDateFilter(filters.dateFrom, filters.dateTo);

  const where: Record<string, unknown> = {};
  if (createdAt) where.createdAt = createdAt;
  if (filters.warehouseId) where.warehouseId = filters.warehouseId;

  const transactions = await prisma.stockTransaction.findMany({
    where,
    include: {
      inventoryItem: {
        include: {
          category: true,
        },
      },
    },
  });

  const categoryMap = new Map<
    string,
    {
      categoryId: string;
      categoryName: string;
      totalReceivedQty: number;
      totalIssuedQty: number;
      totalReceivedValue: number;
      totalIssuedValue: number;
      netQuantity: number;
      totalTransactions: number;
    }
  >();

  for (const t of transactions) {
    const catId = t.inventoryItem?.categoryId || 'uncategorized';
    const catName = t.inventoryItem?.category?.name || 'Uncategorized';
    const qty = t.quantity || 0;
    const val = t.totalValue ?? (t.unitCost ? t.unitCost * qty : 0);

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        categoryId: catId,
        categoryName: catName,
        totalReceivedQty: 0,
        totalIssuedQty: 0,
        totalReceivedValue: 0,
        totalIssuedValue: 0,
        netQuantity: 0,
        totalTransactions: 0,
      });
    }

    const entry = categoryMap.get(catId)!;
    entry.totalTransactions += 1;

    if (t.type === 'RECEIVE') {
      entry.totalReceivedQty += qty;
      entry.totalReceivedValue += val;
      entry.netQuantity += qty;
    } else if (t.type === 'ISSUE') {
      entry.totalIssuedQty += qty;
      entry.totalIssuedValue += val;
      entry.netQuantity -= qty;
    } else if (t.type === 'ADJUSTMENT') {
      entry.netQuantity += qty;
    }
  }

  return Array.from(categoryMap.values()).map((c) => ({
    ...c,
    totalReceivedValue: Math.round(c.totalReceivedValue * 100) / 100,
    totalIssuedValue: Math.round(c.totalIssuedValue * 100) / 100,
  }));
};

/**
 * Data Aggregation: Movement and valuation analytics grouped by Warehouse
 */
export const getWarehouseMovementAggregation = async (
  filters: ReportFilters = {}
): Promise<WarehouseMovementAggregation[]> => {
  const prisma = getPrisma();
  const createdAt = buildDateFilter(filters.dateFrom, filters.dateTo);

  const warehouses = await prisma.warehouse.findMany({
    include: {
      StockTransaction: {
        where: createdAt ? { createdAt } : {},
      },
      Inventory: {
        include: {
          StockLot: {
            where: { quantityRemaining: { gt: 0 } },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return warehouses.map((wh) => {
    let totalReceivedQty = 0;
    let totalIssuedQty = 0;
    let totalTransferredQty = 0;

    (wh.StockTransaction || []).forEach((t) => {
      if (t.type === 'RECEIVE') totalReceivedQty += t.quantity;
      else if (t.type === 'ISSUE') totalIssuedQty += t.quantity;
      else if (t.type === 'TRANSFER') totalTransferredQty += t.quantity;
    });

    let totalValuation = 0;
    (wh.Inventory || []).forEach((item) => {
      (item.StockLot || []).forEach((lot) => {
        totalValuation += lot.quantityRemaining * lot.unitCost;
      });
    });

    return {
      warehouseId: wh.id,
      warehouseName: wh.name,
      location: wh.location,
      totalReceivedQty,
      totalIssuedQty,
      totalTransferredQty,
      totalTransactions: (wh.StockTransaction || []).length,
      totalValuation: Math.round(totalValuation * 100) / 100,
    };
  });
};

/**
 * Data Aggregation: Time-series monthly trends for received vs issued metrics
 */
export const getMonthlyTrendsAggregation = async (
  filters: ReportFilters = {}
): Promise<MonthlyTrendAggregation[]> => {
  const prisma = getPrisma();
  const createdAt = buildDateFilter(filters.dateFrom, filters.dateTo);

  const where: Record<string, unknown> = {};
  if (createdAt) where.createdAt = createdAt;
  if (filters.warehouseId) where.warehouseId = filters.warehouseId;

  const transactions = await prisma.stockTransaction.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  const monthMap = new Map<
    string,
    {
      month: string;
      totalReceivedValue: number;
      totalIssuedValue: number;
      totalReceivedQty: number;
      totalIssuedQty: number;
      totalTransactions: number;
    }
  >();

  for (const t of transactions) {
    const d = new Date(t.createdAt);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const qty = t.quantity || 0;
    const val = t.totalValue ?? (t.unitCost ? t.unitCost * qty : 0);

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        month: monthKey,
        totalReceivedValue: 0,
        totalIssuedValue: 0,
        totalReceivedQty: 0,
        totalIssuedQty: 0,
        totalTransactions: 0,
      });
    }

    const entry = monthMap.get(monthKey)!;
    entry.totalTransactions += 1;

    if (t.type === 'RECEIVE') {
      entry.totalReceivedQty += qty;
      entry.totalReceivedValue += val;
    } else if (t.type === 'ISSUE') {
      entry.totalIssuedQty += qty;
      entry.totalIssuedValue += val;
    }
  }

  return Array.from(monthMap.values()).map((m) => ({
    ...m,
    totalReceivedValue: Math.round(m.totalReceivedValue * 100) / 100,
    totalIssuedValue: Math.round(m.totalIssuedValue * 100) / 100,
  }));
};

/**
 * Data Aggregation: Top issued inventory items by quantity and financial value
 */
export const getTopIssuedItemsAggregation = async (
  limit = 10,
  filters: ReportFilters = {}
): Promise<TopIssuedItemAggregation[]> => {
  const prisma = getPrisma();
  const createdAt = buildDateFilter(filters.dateFrom, filters.dateTo);

  const where: Record<string, unknown> = {
    type: 'ISSUE',
  };
  if (createdAt) where.createdAt = createdAt;
  if (filters.warehouseId) where.warehouseId = filters.warehouseId;

  const transactions = await prisma.stockTransaction.findMany({
    where,
    include: {
      inventoryItem: {
        include: {
          category: true,
        },
      },
    },
  });

  const itemMap = new Map<
    string,
    {
      inventoryItemId: string;
      itemCode: string;
      itemName: string;
      categoryName: string;
      totalQuantityIssued: number;
      totalValueIssued: number;
      issueTransactionCount: number;
    }
  >();

  for (const t of transactions) {
    const itemId = t.inventoryItemId;
    const qty = t.quantity || 0;
    const val = t.totalValue ?? (t.unitCost ? t.unitCost * qty : 0);

    if (!itemMap.has(itemId)) {
      itemMap.set(itemId, {
        inventoryItemId: itemId,
        itemCode: t.inventoryItem?.itemCode || 'N/A',
        itemName: t.inventoryItem?.name || 'Unknown Item',
        categoryName: t.inventoryItem?.category?.name || 'Uncategorized',
        totalQuantityIssued: 0,
        totalValueIssued: 0,
        issueTransactionCount: 0,
      });
    }

    const entry = itemMap.get(itemId)!;
    entry.issueTransactionCount += 1;
    entry.totalQuantityIssued += qty;
    entry.totalValueIssued += val;
  }

  return Array.from(itemMap.values())
    .sort((a, b) => b.totalQuantityIssued - a.totalQuantityIssued)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      totalValueIssued: Math.round(item.totalValueIssued * 100) / 100,
    }));
};

/**
 * Data Aggregation: FIFO valuation breakdown grouped by Category
 */
export const getCategoryValuationAggregation = async (
  filters: ReportFilters = {}
): Promise<CategoryValuationAggregation[]> => {
  const prisma = getPrisma();

  const categories = await prisma.category.findMany({
    include: {
      Inventory: {
        where: filters.warehouseId ? { warehouseId: filters.warehouseId } : {},
        include: {
          StockLot: {
            where: { quantityRemaining: { gt: 0 } },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  let grandTotalFifoValuation = 0;

  const results = categories.map((cat) => {
    let totalQuantityOnHand = 0;
    let totalFifoValuation = 0;

    (cat.Inventory || []).forEach((item) => {
      (item.StockLot || []).forEach((lot) => {
        totalQuantityOnHand += lot.quantityRemaining;
        totalFifoValuation += lot.quantityRemaining * lot.unitCost;
      });
    });

    grandTotalFifoValuation += totalFifoValuation;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      totalItemsCount: (cat.Inventory || []).length,
      totalQuantityOnHand,
      totalFifoValuation: Math.round(totalFifoValuation * 100) / 100,
      percentageOfTotalValuation: 0, // Calculated below
    };
  });

  return results.map((r) => ({
    ...r,
    percentageOfTotalValuation:
      grandTotalFifoValuation > 0
        ? Math.round((r.totalFifoValuation / grandTotalFifoValuation) * 1000) / 10
        : 0,
  }));
};

// Alias for lowercase casing
export const getstockMovementReport = getStockMovementReport;


