import type { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';
import { getPrisma } from '../../config/db.ts';
import type {
  AccountantFinancialSummary,
  CategoryMovementAggregation,
  CategoryValuationAggregation,
  CostLayerAnalysisItem,
  CostLayersReportResult,
  CreateReportRecordDto,
  FinancialLedgerItem,
  FinancialLedgerResult,
  FiscalCategoryBreakdown,
  FiscalStatementData,
  FiscalWarehouseBreakdown,
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
      stockTransactions: {
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
    const transactions = s.stockTransactions || [];
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

  if (reportType === 'cost-layers') {
    const { lots } = await getCostLayersAnalysis(filters);
    const headers = [
      'Lot ID',
      'Item Code',
      'Item Name',
      'Category',
      'Warehouse',
      'Received Qty',
      'Remaining Qty',
      'Unit Cost (ETB)',
      'Total Value (ETB)',
      'Received Date',
      'Age (Days)',
      'Aging Bracket',
      'Status',
    ];
    const rows = lots.map((l) => [
      `"${l.lotId}"`,
      `"${l.itemCode}"`,
      `"${l.itemName.replace(/"/g, '""')}"`,
      `"${l.categoryName}"`,
      `"${l.warehouseName}"`,
      l.quantityReceived,
      l.quantityRemaining,
      l.unitCost,
      l.totalLotValue,
      l.receivedDate ? new Date(l.receivedDate).toISOString().split('T')[0] : 'N/A',
      l.ageInDays,
      `"${l.agingBracket}"`,
      l.isDepleted ? 'Depleted' : 'Active',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return { filename: `fifo-cost-layers-${timestamp}.csv`, content: csvContent };
  }

  if (reportType === 'financial-ledger') {
    const { entries } = await getFinancialLedger(filters);
    const headers = [
      'Entry ID',
      'Date',
      'Type',
      'Reference',
      'Item Code',
      'Item Name',
      'Quantity',
      'Unit Cost (ETB)',
      'Debit (+ ETB)',
      'Credit (- ETB)',
      'Net Impact (ETB)',
      'Details',
      'User',
    ];
    const rows = entries.map((e) => [
      `"${e.id}"`,
      new Date(e.date).toISOString().split('T')[0],
      e.transactionType,
      `"${e.referenceNumber || 'N/A'}"`,
      `"${e.itemCode}"`,
      `"${e.itemName.replace(/"/g, '""')}"`,
      e.quantity,
      e.unitCost,
      e.debit,
      e.credit,
      e.netChange,
      `"${(e.details || '').replace(/"/g, '""')}"`,
      `"${e.userName || 'System'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return { filename: `financial-costing-ledger-${timestamp}.csv`, content: csvContent };
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

/**
 * FIFO Cost Layers Analysis
 * Returns lot-level cost layers with age in days and aging bracket analysis
 */
export const getCostLayersAnalysis = async (
  filters: ReportFilters = {}
): Promise<CostLayersReportResult> => {
  const prisma = getPrisma();

  const itemWhere: Record<string, unknown> = {};
  if (filters.warehouseId) itemWhere.warehouseId = filters.warehouseId;
  if (filters.categoryId) itemWhere.categoryId = filters.categoryId;
  if (filters.inventoryItemId) itemWhere.id = filters.inventoryItemId;

  const lots = await prisma.stockLot.findMany({
    where: {
      inventoryItem: itemWhere,
    },
    include: {
      inventoryItem: {
        include: {
          category: true,
          warehouse: true,
        },
      },
    },
    orderBy: {
      receivedDate: 'asc', // FIFO priority
    },
  });

  const now = new Date();
  const agingBreakdown = {
    '0-30 days': { count: 0, value: 0 },
    '31-60 days': { count: 0, value: 0 },
    '61-90 days': { count: 0, value: 0 },
    '>90 days': { count: 0, value: 0 },
  };

  let totalValuation = 0;
  let totalQuantityRemaining = 0;
  let activeLotsCount = 0;
  let depletedLotsCount = 0;
  let totalAgeDays = 0;

  const mappedLots: CostLayerAnalysisItem[] = [];

  for (const lot of lots) {
    const receivedTime = new Date(lot.receivedDate).getTime();
    const ageInDays = Math.max(0, Math.floor((now.getTime() - receivedTime) / (1000 * 60 * 60 * 24)));

    let agingBracket: '0-30 days' | '31-60 days' | '61-90 days' | '>90 days';
    if (ageInDays <= 30) agingBracket = '0-30 days';
    else if (ageInDays <= 60) agingBracket = '31-60 days';
    else if (ageInDays <= 90) agingBracket = '61-90 days';
    else agingBracket = '>90 days';

    const lotValue = Math.round(lot.quantityRemaining * lot.unitCost * 100) / 100;
    const isDepleted = lot.isDepleted || lot.quantityRemaining <= 0;

    if (isDepleted) {
      depletedLotsCount++;
    } else {
      activeLotsCount++;
      totalValuation += lotValue;
      totalQuantityRemaining += lot.quantityRemaining;
      totalAgeDays += ageInDays;
      agingBreakdown[agingBracket].count++;
      agingBreakdown[agingBracket].value =
        Math.round((agingBreakdown[agingBracket].value + lotValue) * 100) / 100;
    }

    // Apply search filter if specified
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        lot.inventoryItem.itemCode.toLowerCase().includes(q) ||
        lot.inventoryItem.name.toLowerCase().includes(q) ||
        lot.inventoryItem.category?.name.toLowerCase().includes(q) ||
        lot.inventoryItem.warehouse?.name.toLowerCase().includes(q) ||
        lot.id.toLowerCase().includes(q);
      if (!match) continue;
    }

    // Apply state filter if specified (active vs depleted)
    if (filters.state === 'active' && isDepleted) continue;
    if (filters.state === 'depleted' && !isDepleted) continue;

    mappedLots.push({
      lotId: lot.id,
      inventoryItemId: lot.inventoryItemId,
      itemCode: lot.inventoryItem.itemCode,
      itemName: lot.inventoryItem.name,
      categoryName: lot.inventoryItem.category?.name ?? 'Uncategorized',
      warehouseName: lot.inventoryItem.warehouse?.name ?? 'General Store',
      quantityReceived: lot.quantityReceived,
      quantityRemaining: lot.quantityRemaining,
      unitCost: lot.unitCost,
      totalLotValue: lotValue,
      receivedDate: lot.receivedDate,
      ageInDays,
      agingBracket,
      isDepleted,
    });
  }

  const averageLotAgeDays = activeLotsCount > 0 ? Math.round(totalAgeDays / activeLotsCount) : 0;

  return {
    summary: {
      totalLots: lots.length,
      activeLotsCount,
      depletedLotsCount,
      totalQuantityRemaining,
      totalValuation: Math.round(totalValuation * 100) / 100,
      averageLotAgeDays,
      agingBreakdown,
    },
    lots: mappedLots,
  };
};

/**
 * General Ledger / Costing Transaction Journal
 * Captures all financial stock movements with debit and credit accounting entries.
 */
export const getFinancialLedger = async (
  filters: ReportFilters = {}
): Promise<FinancialLedgerResult> => {
  const prisma = getPrisma();
  const dateFilter = buildDateFilter(filters.dateFrom, filters.dateTo);

  const txWhere: Record<string, unknown> = {};
  if (dateFilter) txWhere.createdAt = dateFilter;
  if (filters.warehouseId) txWhere.warehouseId = filters.warehouseId;
  if (filters.inventoryItemId) txWhere.inventoryItemId = filters.inventoryItemId;

  // 1. Stock Transactions (Receipts, Issues, Adjustments)
  const transactions = await prisma.stockTransaction.findMany({
    where: txWhere,
    include: {
      inventoryItem: {
        include: {
          category: true,
          warehouse: true,
        },
      },
      user: true,
      LotConsumptions: {
        include: {
          stockLot: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Approved Write-Off Requests in period
  const writeOffWhere: Record<string, unknown> = {
    status: 'APPROVED',
  };
  if (dateFilter) writeOffWhere.approvedAt = dateFilter;
  if (filters.inventoryItemId) writeOffWhere.itemId = filters.inventoryItemId;

  const writeOffs = await prisma.writeOffRequest.findMany({
    where: writeOffWhere,
    include: {
      item: {
        include: {
          category: true,
          warehouse: true,
          StockLot: true,
        },
      },
      approver: true,
    },
    orderBy: { approvedAt: 'desc' },
  });

  const entries: FinancialLedgerItem[] = [];
  let totalDebits = 0;
  let totalCredits = 0;
  let receiptsTotalValue = 0;
  let issuesTotalValue = 0;
  let writeOffsTotalValue = 0;
  let adjustmentsNetValue = 0;

  for (const tx of transactions) {
    const itemCode = tx.inventoryItem.itemCode;
    const itemName = tx.inventoryItem.name;
    const userName = `${tx.user.firstName} ${tx.user.lastName}`;

    if (tx.type === 'RECEIVE') {
      const unitCost =
        tx.unitCost ?? (tx.quantity > 0 && tx.totalValue ? tx.totalValue / tx.quantity : 0);
      const debit = Math.round((tx.totalValue ?? tx.quantity * unitCost) * 100) / 100;
      totalDebits += debit;
      receiptsTotalValue += debit;

      entries.push({
        id: `TX-${tx.id}`,
        date: tx.createdAt,
        transactionType: 'RECEIPT',
        referenceNumber: tx.referenceNumber,
        inventoryItemId: tx.inventoryItemId,
        itemCode,
        itemName,
        quantity: tx.quantity,
        unitCost: Math.round(unitCost * 100) / 100,
        debit,
        credit: 0,
        netChange: debit,
        details: `Goods receipt capitalization - ${tx.quantity} units @ ETB ${unitCost}`,
        userName,
      });
    } else if (tx.type === 'ISSUE') {
      const consumptionValue =
        tx.LotConsumptions && tx.LotConsumptions.length > 0
          ? tx.LotConsumptions.reduce(
              (sum, lc) => sum + lc.quantityConsumed * lc.stockLot.unitCost,
              0
            )
          : tx.totalValue ?? tx.quantity * (tx.unitCost ?? 0);
      const credit = Math.round(consumptionValue * 100) / 100;
      const unitCost = tx.quantity > 0 ? credit / tx.quantity : 0;
      totalCredits += credit;
      issuesTotalValue += credit;

      entries.push({
        id: `TX-${tx.id}`,
        date: tx.createdAt,
        transactionType: 'ISSUE',
        referenceNumber: tx.referenceNumber,
        inventoryItemId: tx.inventoryItemId,
        itemCode,
        itemName,
        quantity: tx.quantity,
        unitCost: Math.round(unitCost * 100) / 100,
        debit: 0,
        credit,
        netChange: -credit,
        details: `Stock requisition issue (FIFO COGS) - ${tx.quantity} units`,
        userName,
      });
    } else if (tx.type === 'ADJUSTMENT') {
      const unitCost = tx.unitCost ?? 0;
      const value = Math.round(Math.abs(tx.quantity * unitCost) * 100) / 100;
      if (tx.quantity >= 0) {
        totalDebits += value;
        adjustmentsNetValue += value;
        entries.push({
          id: `TX-${tx.id}`,
          date: tx.createdAt,
          transactionType: 'STOCK_TAKE_ADJUSTMENT',
          referenceNumber: tx.referenceNumber,
          inventoryItemId: tx.inventoryItemId,
          itemCode,
          itemName,
          quantity: tx.quantity,
          unitCost,
          debit: value,
          credit: 0,
          netChange: value,
          details: `Stock taking surplus reconciliation (+${tx.quantity} units)`,
          userName,
        });
      } else {
        totalCredits += value;
        adjustmentsNetValue -= value;
        entries.push({
          id: `TX-${tx.id}`,
          date: tx.createdAt,
          transactionType: 'STOCK_TAKE_ADJUSTMENT',
          referenceNumber: tx.referenceNumber,
          inventoryItemId: tx.inventoryItemId,
          itemCode,
          itemName,
          quantity: Math.abs(tx.quantity),
          unitCost,
          debit: 0,
          credit: value,
          netChange: -value,
          details: `Stock taking deficit reconciliation (${tx.quantity} units)`,
          userName,
        });
      }
    }
  }

  // Add write-off records
  for (const wo of writeOffs) {
    if (filters.warehouseId && wo.item.warehouseId !== filters.warehouseId) continue;

    const activeLot = wo.item.StockLot.find((l) => l.quantityRemaining > 0) || wo.item.StockLot[0];
    const unitCost = activeLot ? activeLot.unitCost : 0;
    const credit = Math.round(wo.quantity * unitCost * 100) / 100;
    totalCredits += credit;
    writeOffsTotalValue += credit;

    entries.push({
      id: `WO-${wo.id}`,
      date: wo.approvedAt || wo.requestedAt,
      transactionType: 'WRITE_OFF',
      referenceNumber: `WO-${wo.id.slice(0, 8)}`,
      inventoryItemId: wo.itemId,
      itemCode: wo.item.itemCode,
      itemName: wo.item.name,
      quantity: wo.quantity,
      unitCost,
      debit: 0,
      credit,
      netChange: -credit,
      details: `Disposal loss - Reason: ${wo.reasonCode} (${wo.reasonDescription || 'Damaged/Obsolete'})`,
      userName: wo.approver
        ? `${wo.approver.firstName} ${wo.approver.lastName}`
        : 'Authorized Approver',
    });
  }

  // Sort all entries chronologically descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    summary: {
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      netMovement: Math.round((totalDebits - totalCredits) * 100) / 100,
      receiptsTotalValue: Math.round(receiptsTotalValue * 100) / 100,
      issuesTotalValue: Math.round(issuesTotalValue * 100) / 100,
      writeOffsTotalValue: Math.round(writeOffsTotalValue * 100) / 100,
      adjustmentsNetValue: Math.round(adjustmentsNetValue * 100) / 100,
    },
    entries,
  };
};

/**
 * Fiscal Year-End Inventory Valuation Statement
 * Compiles certified asset statements and reconciliation trial balances
 */
export const getFiscalValuationStatement = async (
  filters: ReportFilters = {}
): Promise<FiscalStatementData> => {
  const prisma = getPrisma();

  // 1. Current Ending Inventory Value from all active FIFO Lots
  const activeLots = await prisma.stockLot.findMany({
    where: {
      quantityRemaining: { gt: 0 },
      inventoryItem: {
        ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      },
    },
    include: {
      inventoryItem: {
        include: {
          category: true,
          warehouse: true,
        },
      },
    },
  });

  let endingInventoryValue = 0;
  const categoryMap = new Map<
    string,
    { categoryName: string; count: number; qty: number; value: number }
  >();
  const warehouseMap = new Map<string, { warehouseName: string; qty: number; value: number }>();

  for (const lot of activeLots) {
    const lotVal = lot.quantityRemaining * lot.unitCost;
    endingInventoryValue += lotVal;

    const catId = lot.inventoryItem.categoryId;
    const catName = lot.inventoryItem.category?.name || 'Uncategorized';
    const curCat = categoryMap.get(catId) || { categoryName: catName, count: 0, qty: 0, value: 0 };
    curCat.count += 1;
    curCat.qty += lot.quantityRemaining;
    curCat.value += lotVal;
    categoryMap.set(catId, curCat);

    const whId = lot.inventoryItem.warehouseId;
    const whName = lot.inventoryItem.warehouse?.name || 'General Store';
    const curWh = warehouseMap.get(whId) || { warehouseName: whName, qty: 0, value: 0 };
    curWh.qty += lot.quantityRemaining;
    curWh.value += lotVal;
    warehouseMap.set(whId, curWh);
  }

  // 2. Aggregate Transactions in period
  const ledger = await getFinancialLedger(filters);

  const inboundPurchasesValue = ledger.summary.receiptsTotalValue;
  const materialConsumptionValue = ledger.summary.issuesTotalValue;
  const writeOffLossesValue = ledger.summary.writeOffsTotalValue;
  const stockTakeAdjustmentNetValue = ledger.summary.adjustmentsNetValue;

  const netMovement =
    inboundPurchasesValue -
    materialConsumptionValue -
    writeOffLossesValue +
    stockTakeAdjustmentNetValue;
  const calculatedBeginning = Math.max(0, endingInventoryValue - netMovement);

  const categoryBreakdown: FiscalCategoryBreakdown[] = Array.from(categoryMap.entries()).map(
    ([id, data]) => ({
      categoryId: id,
      categoryName: data.categoryName,
      totalItems: data.count,
      quantity: data.qty,
      valuation: Math.round(data.value * 100) / 100,
      percentage:
        endingInventoryValue > 0 ? Math.round((data.value / endingInventoryValue) * 1000) / 10 : 0,
    })
  );

  const warehouseBreakdown: FiscalWarehouseBreakdown[] = Array.from(warehouseMap.entries()).map(
    ([id, data]) => ({
      warehouseId: id,
      warehouseName: data.warehouseName,
      quantity: data.qty,
      valuation: Math.round(data.value * 100) / 100,
      percentage:
        endingInventoryValue > 0 ? Math.round((data.value / endingInventoryValue) * 1000) / 10 : 0,
    })
  );

  return {
    period: {
      from: filters.dateFrom || null,
      to: filters.dateTo || null,
    },
    beginningInventoryValue: Math.round(calculatedBeginning * 100) / 100,
    inboundPurchasesValue: Math.round(inboundPurchasesValue * 100) / 100,
    materialConsumptionValue: Math.round(materialConsumptionValue * 100) / 100,
    writeOffLossesValue: Math.round(writeOffLossesValue * 100) / 100,
    stockTakeAdjustmentNetValue: Math.round(stockTakeAdjustmentNetValue * 100) / 100,
    endingInventoryValue: Math.round(endingInventoryValue * 100) / 100,
    categoryBreakdown,
    warehouseBreakdown,
    certification: {
      preparedByRole: 'ACCOUNTANT',
      certificationStatement:
        'Certified true and fair inventory valuation statement calculated pursuant to First-In-First-Out (FIFO) standards in compliance with SRS Section 2.3 and Section 4.4.8.',
      generatedAt: new Date(),
    },
  };
};

/**
 * Accountant High-Level Financial Summary KPIs
 */
export const getFinancialSummary = async (
  _filters: ReportFilters = {}
): Promise<AccountantFinancialSummary> => {
  const prisma = getPrisma();

  // 1. Total Active Inventory Value & Lots
  const activeLots = await prisma.stockLot.findMany({
    where: { quantityRemaining: { gt: 0 } },
    select: { quantityRemaining: true, unitCost: true },
  });

  const totalInventoryValue = activeLots.reduce(
    (sum, lot) => sum + lot.quantityRemaining * lot.unitCost,
    0
  );
  const activeCostLayersCount = activeLots.length;

  // 2. Month to date consumption
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const mtdIssues = await prisma.stockTransaction.findMany({
    where: {
      type: 'ISSUE',
      createdAt: { gte: startOfMonth },
    },
    include: {
      LotConsumptions: {
        include: { stockLot: true },
      },
    },
  });

  let monthToDateConsumedValue = 0;
  for (const issue of mtdIssues) {
    if (issue.LotConsumptions && issue.LotConsumptions.length > 0) {
      monthToDateConsumedValue += issue.LotConsumptions.reduce(
        (s, lc) => s + lc.quantityConsumed * lc.stockLot.unitCost,
        0
      );
    } else {
      monthToDateConsumedValue += issue.totalValue ?? issue.quantity * (issue.unitCost ?? 0);
    }
  }

  // 3. Total write-off losses
  const writeOffs = await prisma.writeOffRequest.findMany({
    where: { status: 'APPROVED' },
    include: { item: { include: { StockLot: true } } },
  });
  let totalWriteOffLosses = 0;
  for (const wo of writeOffs) {
    const unitCost = wo.item.StockLot[0]?.unitCost ?? 0;
    totalWriteOffLosses += wo.quantity * unitCost;
  }

  // 4. Pending unadjusted stock take discrepancies
  const pendingReconciliations = await prisma.reconciliation.findMany({
    where: { status: 'PENDING' },
  });
  const unadjustedDiscrepanciesValue = pendingReconciliations.reduce(
    (sum, r) => sum + Math.abs(r.discrepancy) * (r.unitCost ?? 0),
    0
  );

  // 5. Total items count
  const totalItemsCount = await prisma.inventoryItem.count();

  return {
    totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
    monthToDateConsumedValue: Math.round(monthToDateConsumedValue * 100) / 100,
    totalWriteOffLosses: Math.round(totalWriteOffLosses * 100) / 100,
    unadjustedDiscrepanciesValue: Math.round(unadjustedDiscrepanciesValue * 100) / 100,
    activeCostLayersCount,
    totalItemsCount,
  };
};



