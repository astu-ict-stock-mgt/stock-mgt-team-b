import axios from 'axios';
import type {
  IssuingReportData,
  ReceivingReportData,
  ReportFiltersState,
  ReportsSummaryData,
  SavedReportItem,
  StockMovementReportData,
  StockStatusReportData,
  SupplierReportData,
  ValuationReportData,
} from './types';

const API_BASE = '/api/reports';

// Mock datasets for client-side resiliency & development mode
const mockOverviewSummary: ReportsSummaryData = {
  totalTransactions: 48,
  totalReceivedValue: 245000,
  totalIssuedValue: 168400,
  totalFifoInventoryValue: 76600,
  totalItemsCount: 32,
  lowStockCount: 4,
  totalSuppliersCount: 8,
};

const mockStockMovements: StockMovementReportData = {
  summary: {
    totalTransactions: 4,
    totalReceived: 120,
    totalIssued: 45,
    totalTransferred: 20,
    totalAdjusted: 5,
    netQuantity: 80,
    totalValueReceived: 96000,
    totalValueIssued: 36000,
  },
  transactions: [
    {
      id: 'tx-101',
      type: 'RECEIVE',
      itemCode: 'ITM-ETH-01',
      itemName: 'Cat6 UTP Cable Roll (305m)',
      categoryName: 'Networking Equipment',
      warehouseName: 'Central Warehouse A',
      quantity: 50,
      unitCost: 800,
      totalValue: 40000,
      referenceNumber: 'GRN-2026-0089',
      supplierName: 'Ethio Telecom Tech Supplies',
      userName: 'Almaz Bekele (Storekeeper)',
      createdAt: '2026-02-18T09:30:00Z',
    },
    {
      id: 'tx-102',
      type: 'ISSUE',
      itemCode: 'ITM-ETH-01',
      itemName: 'Cat6 UTP Cable Roll (305m)',
      categoryName: 'Networking Equipment',
      warehouseName: 'Central Warehouse A',
      quantity: 15,
      unitCost: 800,
      totalValue: 12000,
      referenceNumber: 'ISV-2026-0042',
      supplierName: null,
      userName: 'Dawit Mekonnen (Stock Clerk)',
      createdAt: '2026-02-19T11:15:00Z',
    },
    {
      id: 'tx-103',
      type: 'TRANSFER',
      itemCode: 'ITM-SRV-04',
      itemName: '24-Port Gigabit Managed Switch',
      categoryName: 'Networking Hardware',
      warehouseName: 'Central Warehouse A → Lab Store B',
      quantity: 10,
      unitCost: 4500,
      totalValue: 45000,
      referenceNumber: 'TRF-2026-0012',
      supplierName: null,
      userName: 'Henok Tadesse (PAO)',
      createdAt: '2026-02-19T14:40:00Z',
    },
    {
      id: 'tx-104',
      type: 'ADJUSTMENT',
      itemCode: 'ITM-CON-12',
      itemName: 'RJ45 Modular Connectors (Pack of 100)',
      categoryName: 'Consumables',
      warehouseName: 'Central Warehouse A',
      quantity: 5,
      unitCost: 350,
      totalValue: 1750,
      referenceNumber: 'ADJ-2026-0003',
      supplierName: null,
      userName: 'Selam Alemu (Accountant)',
      createdAt: '2026-02-20T08:20:00Z',
    },
  ],
};

const mockReceivingData: ReceivingReportData = {
  summary: {
    totalReceipts: 6,
    totalQuantity: 280,
    totalValue: 245000,
    uniqueSuppliers: 4,
    uniqueWarehouseCount: 2,
  },
  transactions: [
    {
      id: 'rcv-01',
      referenceNumber: 'GRN-2026-0089',
      itemCode: 'ITM-ETH-01',
      itemName: 'Cat6 UTP Cable Roll (305m)',
      supplierName: 'Ethio Telecom Tech Supplies',
      warehouseName: 'Central Warehouse A',
      quantity: 50,
      unitCost: 800,
      totalValue: 40000,
      receivedDate: '2026-02-18T09:00:00Z',
      createdAt: '2026-02-18T09:30:00Z',
    },
    {
      id: 'rcv-02',
      referenceNumber: 'GRN-2026-0090',
      itemCode: 'ITM-SRV-04',
      itemName: '24-Port Gigabit Managed Switch',
      supplierName: 'Addis Hardware Solutions PLC',
      warehouseName: 'Central Warehouse A',
      quantity: 20,
      unitCost: 4500,
      totalValue: 90000,
      receivedDate: '2026-02-17T10:00:00Z',
      createdAt: '2026-02-17T10:45:00Z',
    },
    {
      id: 'rcv-03',
      referenceNumber: 'GRN-2026-0091',
      itemCode: 'ITM-PWR-02',
      itemName: 'Online UPS 1500VA Backup',
      supplierName: 'PowerTech Ethiopia',
      warehouseName: 'Electrical Storage Unit',
      quantity: 10,
      unitCost: 11500,
      totalValue: 115000,
      receivedDate: '2026-02-15T14:20:00Z',
      createdAt: '2026-02-15T15:00:00Z',
    },
  ],
};

const mockIssuingData: IssuingReportData = {
  summary: {
    totalIssues: 5,
    totalQuantity: 95,
    totalValue: 168400,
  },
  transactions: [
    {
      id: 'iss-01',
      referenceNumber: 'ISV-2026-0042',
      itemCode: 'ITM-ETH-01',
      itemName: 'Cat6 UTP Cable Roll (305m)',
      warehouseName: 'Central Warehouse A',
      quantity: 15,
      unitCost: 800,
      totalValue: 12000,
      department: 'Computer Science & Engineering',
      issuedByName: 'Dawit Mekonnen (Stock Clerk)',
      createdAt: '2026-02-19T11:15:00Z',
    },
    {
      id: 'iss-02',
      referenceNumber: 'ISV-2026-0043',
      itemCode: 'ITM-PWR-02',
      itemName: 'Online UPS 1500VA Backup',
      warehouseName: 'Electrical Storage Unit',
      quantity: 4,
      unitCost: 11500,
      totalValue: 46000,
      department: 'ICT Data Center',
      issuedByName: 'Almaz Bekele (Storekeeper)',
      createdAt: '2026-02-18T16:00:00Z',
    },
  ],
};

const mockValuationData: ValuationReportData = {
  summary: {
    totalItems: 4,
    totalQuantityOnHand: 145,
    totalFifoValuation: 212500,
    activeLotsCount: 6,
  },
  items: [
    {
      inventoryItemId: 'itm-01',
      itemCode: 'ITM-ETH-01',
      itemName: 'Cat6 UTP Cable Roll (305m)',
      categoryName: 'Networking Equipment',
      warehouseName: 'Central Warehouse A',
      totalQuantityOnHand: 35,
      averageUnitCost: 800,
      totalFifoValue: 28000,
      lots: [
        {
          lotId: 'lot-01',
          quantityReceived: 50,
          quantityRemaining: 35,
          unitCost: 800,
          totalLotValue: 28000,
          receivedDate: '2026-02-18T09:00:00Z',
          isDepleted: false,
        },
      ],
    },
    {
      inventoryItemId: 'itm-02',
      itemCode: 'ITM-SRV-04',
      itemName: '24-Port Gigabit Managed Switch',
      categoryName: 'Networking Hardware',
      warehouseName: 'Central Warehouse A',
      totalQuantityOnHand: 10,
      averageUnitCost: 4500,
      totalFifoValue: 45000,
      lots: [
        {
          lotId: 'lot-02',
          quantityReceived: 20,
          quantityRemaining: 10,
          unitCost: 4500,
          totalLotValue: 45000,
          receivedDate: '2026-02-17T10:00:00Z',
          isDepleted: false,
        },
      ],
    },
    {
      inventoryItemId: 'itm-03',
      itemCode: 'ITM-PWR-02',
      itemName: 'Online UPS 1500VA Backup',
      categoryName: 'Power & Protection',
      warehouseName: 'Electrical Storage Unit',
      totalQuantityOnHand: 6,
      averageUnitCost: 11500,
      totalFifoValue: 69000,
      lots: [
        {
          lotId: 'lot-03',
          quantityReceived: 10,
          quantityRemaining: 6,
          unitCost: 11500,
          totalLotValue: 69000,
          receivedDate: '2026-02-15T14:20:00Z',
          isDepleted: false,
        },
      ],
    },
  ],
};

const mockSupplierData: SupplierReportData = {
  summary: {
    totalSuppliers: 3,
    totalDeliveries: 12,
    totalValueSupplied: 245000,
  },
  suppliers: [
    {
      supplierId: 'sup-01',
      supplierName: 'Ethio Telecom Tech Supplies',
      contactName: 'Abebe Kebede',
      email: 'sales@ethiotelecomtech.et',
      phone: '+251 911 223344',
      totalDeliveries: 5,
      totalQuantitySupplied: 120,
      totalSuppliedValue: 98000,
      lastDeliveryDate: '2026-02-18T09:00:00Z',
    },
    {
      supplierId: 'sup-02',
      supplierName: 'Addis Hardware Solutions PLC',
      contactName: 'Tigist Haile',
      email: 'info@addishardware.com',
      phone: '+251 912 334455',
      totalDeliveries: 4,
      totalQuantitySupplied: 45,
      totalSuppliedValue: 92000,
      lastDeliveryDate: '2026-02-17T10:00:00Z',
    },
    {
      supplierId: 'sup-03',
      supplierName: 'PowerTech Ethiopia',
      contactName: 'Kassahun Worku',
      email: 'orders@powertech.et',
      phone: '+251 913 445566',
      totalDeliveries: 3,
      totalQuantitySupplied: 15,
      totalSuppliedValue: 115000,
      lastDeliveryDate: '2026-02-15T14:20:00Z',
    },
  ],
};

const mockStockStatusData: StockStatusReportData = {
  summary: {
    totalItems: 5,
    lowStockItemsCount: 2,
    belowSafetyStockCount: 1,
    outOfStockCount: 0,
    stateBreakdown: {
      AVAILABLE: 4,
      DAMAGED: 1,
      OBSOLETE: 0,
    },
  },
  items: [
    {
      inventoryItemId: 'itm-01',
      itemCode: 'ITM-ETH-01',
      itemName: 'Cat6 UTP Cable Roll (305m)',
      categoryName: 'Networking Equipment',
      warehouseName: 'Central Warehouse A',
      state: 'AVAILABLE',
      currentStock: 35,
      minLevel: 10,
      maxLevel: 100,
      reorderLevel: 40,
      safetyStock: 20,
      isLowStock: true,
      isBelowSafetyStock: false,
    },
    {
      inventoryItemId: 'itm-02',
      itemCode: 'ITM-CON-12',
      itemName: 'RJ45 Modular Connectors (Pack of 100)',
      categoryName: 'Consumables',
      warehouseName: 'Central Warehouse A',
      state: 'AVAILABLE',
      currentStock: 8,
      minLevel: 10,
      maxLevel: 50,
      reorderLevel: 15,
      safetyStock: 10,
      isLowStock: true,
      isBelowSafetyStock: true,
    },
    {
      inventoryItemId: 'itm-03',
      itemCode: 'ITM-SRV-04',
      itemName: '24-Port Gigabit Managed Switch',
      categoryName: 'Networking Hardware',
      warehouseName: 'Central Warehouse A',
      state: 'AVAILABLE',
      currentStock: 10,
      minLevel: 2,
      maxLevel: 25,
      reorderLevel: 5,
      safetyStock: 3,
      isLowStock: false,
      isBelowSafetyStock: false,
    },
  ],
};

let mockSavedReports: SavedReportItem[] = [
  {
    id: 'rep-001',
    name: 'February Monthly Inventory Valuation (FIFO)',
    type: 'valuation',
    generatedBy: 'usr-001',
    generatorName: 'Marcus Vance (PAO)',
    parameters: { dateTo: '2026-02-20' },
    fileUrl: null,
    createdAt: '2026-02-20T08:00:00Z',
  },
  {
    id: 'rep-002',
    name: 'Q1 Supplier Deliveries Audit',
    type: 'suppliers',
    generatedBy: 'usr-002',
    generatorName: 'Selam Alemu (Accountant)',
    parameters: { dateFrom: '2026-01-01', dateTo: '2026-03-31' },
    fileUrl: null,
    createdAt: '2026-02-19T15:30:00Z',
  },
];

const cleanParams = (params: Partial<ReportFiltersState>) => {
  const p: Record<string, string> = {};
  if (params.dateFrom) p.dateFrom = params.dateFrom;
  if (params.dateTo) p.dateTo = params.dateTo;
  if (params.warehouseId) p.warehouseId = params.warehouseId;
  if (params.supplierId) p.supplierId = params.supplierId;
  if (params.inventoryItemId) p.inventoryItemId = params.inventoryItemId;
  if (params.type) p.type = params.type;
  return p;
};

const isWithinDateRange = (
  value: string | null | undefined,
  filters: Partial<ReportFiltersState>
): boolean => {
  if (!value) return true;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return true;

  if (filters.dateFrom) {
    const from = new Date(`${filters.dateFrom}T00:00:00`);
    if (date < from) {
      return false;
    }
  }

  if (filters.dateTo) {
    const to = new Date(`${filters.dateTo}T23:59:59.999`);
    if (date > to) {
      return false;
    }
  }

  return true;
};

export async function fetchReportsSummary(
  filters: Partial<ReportFiltersState> = {}
): Promise<ReportsSummaryData> {
  try {
    const res = await axios.get<{ status: string; data: ReportsSummaryData }>(
      `${API_BASE}/summary`,
      { params: cleanParams(filters) }
    );
    return res.data.data;
  } catch {
    return mockOverviewSummary;
  }
}

export async function fetchStockMovementReport(
  filters: Partial<ReportFiltersState> = {}
): Promise<StockMovementReportData> {
  try {
    const res = await axios.get<{
      status: string;
      data: StockMovementReportData;
    }>(`${API_BASE}/stock-movement`, {
      params: cleanParams(filters),
    });

    return res.data.data;
  } catch {
    const transactions = mockStockMovements.transactions.filter((transaction) =>
      isWithinDateRange(transaction.createdAt, filters)
    );

    return {
      ...mockStockMovements,
      transactions,
      summary: {
        ...mockStockMovements.summary,
        totalTransactions: transactions.length,
        totalReceived: transactions
          .filter((t) => t.type === 'RECEIVE')
          .reduce((sum, t) => sum + t.quantity, 0),
        totalIssued: transactions
          .filter((t) => t.type === 'ISSUE')
          .reduce((sum, t) => sum + t.quantity, 0),
        totalTransferred: transactions
          .filter((t) => t.type === 'TRANSFER')
          .reduce((sum, t) => sum + t.quantity, 0),
        totalAdjusted: transactions
          .filter((t) => t.type === 'ADJUSTMENT')
          .reduce((sum, t) => sum + t.quantity, 0),
        netQuantity: transactions.reduce((sum, t) => {
          if (t.type === 'RECEIVE') return sum + t.quantity;
          if (t.type === 'ISSUE') return sum - t.quantity;
          return sum;
        }, 0),
        totalValueReceived: transactions
          .filter((t) => t.type === 'RECEIVE')
          .reduce((sum, t) => sum + (t.totalValue || 0), 0),
        totalValueIssued: transactions
          .filter((t) => t.type === 'ISSUE')
          .reduce((sum, t) => sum + (t.totalValue || 0), 0),
      },
    };
  }
}

export async function fetchReceivingReport(
  filters: Partial<ReportFiltersState> = {}
): Promise<ReceivingReportData> {
  try {
    const res = await axios.get<{
      status: string;
      data: ReceivingReportData;
    }>(`${API_BASE}/receiving`, {
      params: cleanParams(filters),
    });

    return res.data.data;
  } catch {
    const transactions = mockReceivingData.transactions.filter((transaction) =>
      isWithinDateRange(transaction.createdAt, filters)
    );

    return {
      ...mockReceivingData,
      transactions,
      summary: {
        ...mockReceivingData.summary,
        totalReceipts: transactions.length,
        totalQuantity: transactions.reduce((sum, t) => sum + t.quantity, 0),
        totalValue: transactions.reduce((sum, t) => sum + (t.totalValue || 0), 0),
        uniqueSuppliers: new Set(transactions.map((t) => t.supplierName)).size,
        uniqueWarehouseCount: new Set(transactions.map((t) => t.warehouseName)).size,
      },
    };
  }
}

export async function fetchIssuingReport(
  filters: Partial<ReportFiltersState> = {}
): Promise<IssuingReportData> {
  try {
    const res = await axios.get<{
      status: string;
      data: IssuingReportData;
    }>(`${API_BASE}/issuing`, {
      params: cleanParams(filters),
    });

    return res.data.data;
  } catch {
    const transactions = mockIssuingData.transactions.filter((transaction) =>
      isWithinDateRange(transaction.createdAt, filters)
    );

    return {
      ...mockIssuingData,
      transactions,
      summary: {
        ...mockIssuingData.summary,
        totalIssues: transactions.length,
        totalQuantity: transactions.reduce((sum, t) => sum + t.quantity, 0),
        totalValue: transactions.reduce((sum, t) => sum + (t.totalValue || 0), 0),
      },
    };
  }
}

export async function fetchValuationReport(
  filters: Partial<ReportFiltersState> = {}
): Promise<ValuationReportData> {
  try {
    const res = await axios.get<{
      status: string;
      data: ValuationReportData;
    }>(`${API_BASE}/valuation`, {
      params: cleanParams(filters),
    });

    return res.data.data;
  } catch {
    const items = mockValuationData.items
      .map((item) => {
        const lots = item.lots.filter((lot) =>
          isWithinDateRange(lot.receivedDate, filters)
        );

        if (lots.length === 0) {
          return null;
        }

        const totalQuantityOnHand = lots.reduce(
          (sum, lot) => sum + lot.quantityRemaining,
          0
        );

        const totalFifoValue = lots.reduce(
          (sum, lot) => sum + lot.totalLotValue,
          0
        );

        return {
          ...item,
          lots,
          totalQuantityOnHand,
          totalFifoValue,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      ...mockValuationData,
      items,
      summary: {
        ...mockValuationData.summary,
        totalItems: items.length,
        totalQuantityOnHand: items.reduce(
          (sum, item) => sum + item.totalQuantityOnHand,
          0
        ),
        totalFifoValuation: items.reduce(
          (sum, item) => sum + item.totalFifoValue,
          0
        ),
        activeLotsCount: items.reduce((sum, item) => sum + item.lots.length, 0),
      },
    };
  }
}

export async function fetchSupplierReport(
  filters: Partial<ReportFiltersState> = {}
): Promise<SupplierReportData> {
  try {
    const res = await axios.get<{
      status: string;
      data: SupplierReportData;
    }>(`${API_BASE}/suppliers`, {
      params: cleanParams(filters),
    });

    return res.data.data;
  } catch {
    const suppliers = mockSupplierData.suppliers.filter((supplier) =>
      isWithinDateRange(supplier.lastDeliveryDate, filters)
    );

    return {
      ...mockSupplierData,
      suppliers,
      summary: {
        ...mockSupplierData.summary,
        totalSuppliers: suppliers.length,
        totalDeliveries: suppliers.reduce(
          (sum, supplier) => sum + supplier.totalDeliveries,
          0
        ),
        totalValueSupplied: suppliers.reduce(
          (sum, supplier) => sum + supplier.totalSuppliedValue,
          0
        ),
      },
    };
  }
}

export async function fetchStockStatusReport(
  filters: Partial<ReportFiltersState> = {}
): Promise<StockStatusReportData> {
  try {
    const res = await axios.get<{
      status: string;
      data: StockStatusReportData;
    }>(`${API_BASE}/stock-status`, {
      params: cleanParams(filters),
    });

    return res.data.data;
  } catch {
    return mockStockStatusData;
  }
}

export async function fetchReportHistory(): Promise<SavedReportItem[]> {
  try {
    const res = await axios.get<{ status: string; data: SavedReportItem[] }>(
      `${API_BASE}/history`
    );
    return res.data.data;
  } catch {
    return mockSavedReports;
  }
}

export async function createReport(data: {
  name: string;
  type: string;
  parameters?: Record<string, unknown>;
}): Promise<SavedReportItem> {
  try {
    const res = await axios.post<{ status: string; data: SavedReportItem }>(
      API_BASE,
      data
    );
    return res.data.data;
  } catch {
    const newReport: SavedReportItem = {
      id: `rep-${Date.now().toString().slice(-4)}`,
      name: data.name,
      type: data.type,
      generatedBy: 'usr-current',
      generatorName: 'Active User',
      parameters: data.parameters || {},
      fileUrl: null,
      createdAt: new Date().toISOString(),
    };
    mockSavedReports = [newReport, ...mockSavedReports];
    return newReport;
  }
}

export async function downloadReportCsv(
  reportType: string,
  filters: Partial<ReportFiltersState> = {}
): Promise<void> {
  try {
    const response = await axios.get(`${API_BASE}/export`, {
      params: {
        ...cleanParams(filters),
        type: reportType,
        format: 'csv',
      },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute(
      'download',
      `${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch {
    let csvContent = 'Report,Data\n';

    if (reportType === 'stock-movement') {
      const transactions = mockStockMovements.transactions.filter(
        (transaction) => isWithinDateRange(transaction.createdAt, filters)
      );

      csvContent =
        'ID,Type,Item Code,Item Name,Category,Warehouse,Quantity,Unit Cost,Total Value,Reference,Date\n' +
        transactions
          .map(
            (t) =>
              `${t.id},${t.type},"${t.itemCode}","${t.itemName}","${t.categoryName || ''}","${t.warehouseName || ''}",${t.quantity},${t.unitCost || 0},${t.totalValue || 0},"${t.referenceNumber || ''}",${t.createdAt}`
          )
          .join('\n');
    } else if (reportType === 'receiving') {
      const transactions = mockReceivingData.transactions.filter(
        (transaction) => isWithinDateRange(transaction.createdAt, filters)
      );

      csvContent =
        'ID,Reference,Item Code,Item Name,Supplier,Warehouse,Quantity,Unit Cost,Total Value,Received Date\n' +
        transactions
          .map(
            (t) =>
              `${t.id},"${t.referenceNumber}","${t.itemCode}","${t.itemName}","${t.supplierName || ''}","${t.warehouseName || ''}",${t.quantity},${t.unitCost || 0},${t.totalValue || 0},${t.receivedDate}`
          )
          .join('\n');
    } else if (reportType === 'issuing') {
      const transactions = mockIssuingData.transactions.filter(
        (transaction) => isWithinDateRange(transaction.createdAt, filters)
      );

      csvContent =
        'ID,Reference,Item Code,Item Name,Warehouse,Quantity,Unit Cost,Total Value,Department,Issued By,Date\n' +
        transactions
          .map(
            (t) =>
              `${t.id},"${t.referenceNumber}","${t.itemCode}","${t.itemName}","${t.warehouseName || ''}",${t.quantity},${t.unitCost || 0},${t.totalValue || 0},"${t.department || ''}","${t.issuedByName || ''}",${t.createdAt}`
          )
          .join('\n');
    } else if (reportType === 'valuation') {
      const items = mockValuationData.items
        .map((item) => ({
          ...item,
          lots: item.lots.filter((lot) =>
            isWithinDateRange(lot.receivedDate, filters)
          ),
        }))
        .filter((item) => item.lots.length > 0);

      csvContent =
        'Item Code,Item Name,Category,Warehouse,Quantity on Hand,Avg Cost,Total FIFO Value\n' +
        items
          .map((i) => {
            const quantityOnHand = i.lots.reduce(
              (sum, lot) => sum + lot.quantityRemaining,
              0
            );

            const fifoValue = i.lots.reduce(
              (sum, lot) => sum + lot.totalLotValue,
              0
            );

            return `"${i.itemCode}","${i.itemName}","${i.categoryName}","${i.warehouseName}",${quantityOnHand},${i.averageUnitCost},${fifoValue}`;
          })
          .join('\n');
    } else if (reportType === 'suppliers') {
      const suppliers = mockSupplierData.suppliers.filter((supplier) =>
        isWithinDateRange(supplier.lastDeliveryDate, filters)
      );

      csvContent =
        'Supplier ID,Supplier Name,Contact,Email,Phone,Deliveries,Quantity Supplied,Total Supplied Value,Last Delivery Date\n' +
        suppliers
          .map(
            (s) =>
              `"${s.supplierId}","${s.supplierName}","${s.contactName}","${s.email}","${s.phone}",${s.totalDeliveries},${s.totalQuantitySupplied},${s.totalSuppliedValue},${s.lastDeliveryDate}`
          )
          .join('\n');
    } else if (reportType === 'stock-status') {
      csvContent =
        'Item Code,Item Name,Category,Warehouse,State,Current Stock,Min Level,Max Level,Reorder Level,Safety Stock,Low Stock,Below Safety Stock\n' +
        mockStockStatusData.items
          .map(
            (i) =>
              `"${i.itemCode}","${i.itemName}","${i.categoryName}","${i.warehouseName}","${i.state}",${i.currentStock},${i.minLevel},${i.maxLevel},${i.reorderLevel},${i.safetyStock},${i.isLowStock},${i.isBelowSafetyStock}`
          )
          .join('\n');
    } else {
      csvContent =
        'Report Type,Export Date\n' +
        `${reportType},${new Date().toISOString()}\n`;
    }

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute(
      'download',
      `${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}