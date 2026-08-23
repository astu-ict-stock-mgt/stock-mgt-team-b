import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const stockTransactionFindMany = jest.fn<() => Promise<unknown[]>>();
const inventoryItemFindMany = jest.fn<() => Promise<unknown[]>>();
const supplierFindMany = jest.fn<() => Promise<unknown[]>>();
const supplierCount = jest.fn<() => Promise<number>>();
const stockLotFindMany = jest.fn<() => Promise<unknown[]>>();
const reportCreate = jest.fn<() => Promise<unknown>>();
const reportFindMany = jest.fn<() => Promise<unknown[]>>();
const reportFindUnique = jest.fn<() => Promise<unknown | null>>();
const auditLogCreate = jest.fn<() => Promise<unknown>>();
const warehouseFindMany = jest.fn<() => Promise<unknown[]>>();
const categoryFindMany = jest.fn<() => Promise<unknown[]>>();

jest.unstable_mockModule('../../src/generated/prisma/client.js', () => ({
  PrismaClient: jest.fn(() => ({
    stockTransaction: {
      findMany: stockTransactionFindMany,
    },
    inventoryItem: {
      findMany: inventoryItemFindMany,
    },
    supplier: {
      findMany: supplierFindMany,
      count: supplierCount,
    },
    stockLot: {
      findMany: stockLotFindMany,
    },
    warehouse: {
      findMany: warehouseFindMany,
    },
    category: {
      findMany: categoryFindMany,
    },
    report: {
      create: reportCreate,
      findMany: reportFindMany,
      findUnique: reportFindUnique,
    },
    auditLog: {
      create: auditLogCreate,
    },
  })),
}));

const { default: app } = await import('../../src/app.ts');

const adminToken = jwt.sign(
  {
    sub: '10000000-0000-4000-8000-000000000001',
    email: 'admin@system.local',
    role: 'ADMINISTRATOR',
  },
  process.env.JWT_SECRET
);

const paoToken = jwt.sign(
  { sub: '20000000-0000-4000-8000-000000000002', email: 'pao@system.local', role: 'PAO' },
  process.env.JWT_SECRET
);

const accountantToken = jwt.sign(
  {
    sub: '30000000-0000-4000-8000-000000000003',
    email: 'accountant@system.local',
    role: 'ACCOUNTANT',
  },
  process.env.JWT_SECRET
);

const securityOfficerToken = jwt.sign(
  {
    sub: '40000000-0000-4000-8000-000000000004',
    email: 'security@system.local',
    role: 'SECURITY_OFFICER',
  },
  process.env.JWT_SECRET
);

const mockTransactions = [
  {
    id: 'tx-001',
    type: 'RECEIVE',
    inventoryItemId: 'item-001',
    warehouseId: 'wh-001',
    quantity: 50,
    unitCost: 100,
    totalValue: 5000,
    receivedDate: new Date('2026-02-01T10:00:00Z'),
    referenceNumber: 'GRN-2026-001',
    supplierId: 'sup-001',
    userId: 'user-001',
    createdAt: new Date('2026-02-01T10:00:00Z'),
    inventoryItem: {
      itemCode: 'ITM-001',
      name: 'Cat6 Ethernet Cable',
      category: { name: 'Networking' },
    },
    warehouse: { name: 'Main Warehouse' },
    supplier: { name: 'Ethio Telecom Suppliers' },
    user: { id: 'user-001', firstName: 'Almaz', lastName: 'Bekele', email: 'almaz@system.local' },
  },
  {
    id: 'tx-002',
    type: 'ISSUE',
    inventoryItemId: 'item-001',
    warehouseId: 'wh-001',
    quantity: 10,
    unitCost: 100,
    totalValue: 1000,
    receivedDate: null,
    referenceNumber: 'ISV-2026-001',
    supplierId: null,
    userId: 'user-002',
    createdAt: new Date('2026-02-05T14:00:00Z'),
    inventoryItem: {
      itemCode: 'ITM-001',
      name: 'Cat6 Ethernet Cable',
      category: { name: 'Networking' },
    },
    warehouse: { name: 'Main Warehouse' },
    supplier: null,
    user: {
      id: 'user-002',
      firstName: 'Dawit',
      lastName: 'Mekonnen',
      department: 'Computer Science & Eng.',
    },
  },
];

const mockItemsWithLots = [
  {
    id: 'item-001',
    itemCode: 'ITM-001',
    name: 'Cat6 Ethernet Cable',
    state: 'AVAILABLE',
    minLevel: 10,
    maxLevel: 100,
    reorderLevel: 20,
    safetyStock: 15,
    category: { name: 'Networking' },
    warehouse: { name: 'Main Warehouse' },
    BinCard: [{ balance: 40 }],
    StockLot: [
      {
        id: 'lot-001',
        quantityReceived: 50,
        quantityRemaining: 40,
        unitCost: 100,
        receivedDate: new Date('2026-02-01T10:00:00Z'),
        isDepleted: false,
      },
    ],
  },
];

const mockSuppliers = [
  {
    id: 'sup-001',
    name: 'Ethio Telecom Suppliers',
    contactName: 'Abebe Kebede',
    email: 'info@ethiotelecomsupplies.et',
    phone: '+251911223344',
    stockTransactions: [
      {
        id: 'tx-001',
        type: 'RECEIVE',
        quantity: 50,
        unitCost: 100,
        totalValue: 5000,
        createdAt: new Date('2026-02-01T10:00:00Z'),
      },
    ],
  },
];

describe('Reports Module API (/api/reports)', () => {
  beforeEach(() => {
    stockTransactionFindMany.mockReset();
    inventoryItemFindMany.mockReset();
    supplierFindMany.mockReset();
    supplierCount.mockReset();
    stockLotFindMany.mockReset();
    reportCreate.mockReset();
    reportFindMany.mockReset();
    reportFindUnique.mockReset();
    auditLogCreate.mockReset();
  });

  describe('Authentication & RBAC', () => {
    it('returns 401 Unauthorized when token is missing', async () => {
      await request(app).get('/api/reports/summary').expect(401);
    });

    it('returns 403 Forbidden for SECURITY_OFFICER role', async () => {
      await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${securityOfficerToken}`)
        .expect(403);
    });

    it('allows access for ADMINISTRATOR, PAO, and ACCOUNTANT roles', async () => {
      stockTransactionFindMany.mockResolvedValue([]);
      inventoryItemFindMany.mockResolvedValue([]);
      supplierCount.mockResolvedValue(0);
      stockLotFindMany.mockResolvedValue([]);

      await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${paoToken}`)
        .expect(200);

      await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${accountantToken}`)
        .expect(200);
    });
  });

  describe('GET /api/reports/summary', () => {
    it('returns dashboard KPI metrics correctly', async () => {
      stockTransactionFindMany.mockResolvedValue(mockTransactions);
      inventoryItemFindMany.mockResolvedValue(mockItemsWithLots);
      supplierCount.mockResolvedValue(1);
      stockLotFindMany.mockResolvedValue(mockItemsWithLots[0].StockLot);

      const response = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.totalTransactions).toBe(2);
      expect(response.body.data.totalReceivedValue).toBe(5000);
      expect(response.body.data.totalIssuedValue).toBe(1000);
      expect(response.body.data.totalFifoInventoryValue).toBe(4000);
      expect(response.body.data.totalSuppliersCount).toBe(1);
    });
  });

  describe('GET /api/reports/stock-movement', () => {
    it('returns stock movement transactions with summary calculations', async () => {
      stockTransactionFindMany.mockResolvedValue(mockTransactions);

      const response = await request(app)
        .get('/api/reports/stock-movement?dateFrom=2026-02-01&dateTo=2026-02-10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.summary.totalTransactions).toBe(2);
      expect(response.body.data.summary.totalReceived).toBe(50);
      expect(response.body.data.summary.totalIssued).toBe(10);
      expect(response.body.data.summary.netQuantity).toBe(40);
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.transactions[0].itemCode).toBe('ITM-001');
    });
  });

  describe('GET /api/reports/receiving', () => {
    it('returns goods receiving transactions and summary', async () => {
      stockTransactionFindMany.mockResolvedValue([mockTransactions[0]]);

      const response = await request(app)
        .get('/api/reports/receiving')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.summary.totalReceipts).toBe(1);
      expect(response.body.data.summary.totalQuantity).toBe(50);
      expect(response.body.data.summary.totalValue).toBe(5000);
      expect(response.body.data.transactions[0].supplierName).toBe('Ethio Telecom Suppliers');
    });
  });

  describe('GET /api/reports/issuing', () => {
    it('returns stock issuing transactions and summary', async () => {
      stockTransactionFindMany.mockResolvedValue([mockTransactions[1]]);

      const response = await request(app)
        .get('/api/reports/issuing')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.summary.totalIssues).toBe(1);
      expect(response.body.data.summary.totalQuantity).toBe(10);
      expect(response.body.data.summary.totalValue).toBe(1000);
      expect(response.body.data.transactions[0].department).toBe('Computer Science & Eng.');
    });
  });

  describe('GET /api/reports/valuation', () => {
    it('calculates FIFO inventory valuation from stock lots', async () => {
      inventoryItemFindMany.mockResolvedValue(mockItemsWithLots);

      const response = await request(app)
        .get('/api/reports/valuation')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.summary.totalItems).toBe(1);
      expect(response.body.data.summary.totalQuantityOnHand).toBe(40);
      expect(response.body.data.summary.totalFifoValuation).toBe(4000);
      expect(response.body.data.items[0].lots).toHaveLength(1);
      expect(response.body.data.items[0].lots[0].unitCost).toBe(100);
    });
  });

  describe('GET /api/reports/suppliers', () => {
    it('returns supplier performance statistics', async () => {
      supplierFindMany.mockResolvedValue(mockSuppliers);

      const response = await request(app)
        .get('/api/reports/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.summary.totalSuppliers).toBe(1);
      expect(response.body.data.summary.totalDeliveries).toBe(1);
      expect(response.body.data.summary.totalValueSupplied).toBe(5000);
      expect(response.body.data.suppliers[0].supplierName).toBe('Ethio Telecom Suppliers');
    });
  });

  describe('GET /api/reports/stock-status', () => {
    it('returns low stock items and status distribution', async () => {
      inventoryItemFindMany.mockResolvedValue(mockItemsWithLots);

      const response = await request(app)
        .get('/api/reports/stock-status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.summary.totalItems).toBe(1);
      expect(response.body.data.items[0].currentStock).toBe(40);
      expect(response.body.data.items[0].isLowStock).toBe(false);
    });
  });

  describe('GET /api/reports/export', () => {
    it('exports CSV file with proper content-type and headers', async () => {
      stockTransactionFindMany.mockResolvedValue(mockTransactions);

      const response = await request(app)
        .get('/api/reports/export?type=stock-movement&format=csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('stock-movement-report');
      expect(response.text).toContain('ID,Type,Item Code');
    });

    it('exports JSON formatted report when format=json', async () => {
      stockTransactionFindMany.mockResolvedValue(mockTransactions);

      const response = await request(app)
        .get('/api/reports/export?type=stock-movement&format=json')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.summary).toBeDefined();
    });
  });

  describe('POST /api/reports & History Endpoints', () => {
    it('saves a report record and logs audit trail', async () => {
      const mockSavedReport = {
        id: 'rep-001',
        name: 'Q1 Stock Movement Audit',
        type: 'stock-movement',
        generatedBy: '10000000-0000-4000-8000-000000000001',
        parameters: { dateFrom: '2026-01-01', dateTo: '2026-03-31' },
        fileUrl: null,
        createdAt: new Date('2026-02-20T12:00:00Z'),
        user: { firstName: 'Marcus', lastName: 'Vance', email: 'admin@system.local' },
      };

      reportCreate.mockResolvedValue(mockSavedReport);

      const response = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Q1 Stock Movement Audit',
          type: 'stock-movement',
          parameters: { dateFrom: '2026-01-01', dateTo: '2026-03-31' },
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.name).toBe('Q1 Stock Movement Audit');
      expect(reportCreate).toHaveBeenCalledTimes(1);
    });

    it('returns report history list', async () => {
      reportFindMany.mockResolvedValue([
        {
          id: 'rep-001',
          name: 'Monthly Receiving Report',
          type: 'receiving',
          generatedBy: '10000000-0000-4000-8000-000000000001',
          parameters: {},
          fileUrl: null,
          createdAt: new Date('2026-02-20T12:00:00Z'),
          user: { firstName: 'Marcus', lastName: 'Vance' },
        },
      ]);

      const response = await request(app)
        .get('/api/reports/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].name).toBe('Monthly Receiving Report');
    });
  });

  describe('Data Aggregation & Analytics APIs', () => {
    it('GET /api/reports/analytics/category-movements returns aggregated movements by category', async () => {
      stockTransactionFindMany.mockResolvedValue(mockTransactions);

      const response = await request(app)
        .get('/api/reports/analytics/category-movements')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].categoryName).toBe('Networking');
      expect(response.body.data[0].totalReceivedQty).toBe(50);
      expect(response.body.data[0].totalIssuedQty).toBe(10);
    });

    it('GET /api/reports/analytics/warehouse-movements returns aggregated statistics by warehouse', async () => {
      warehouseFindMany.mockResolvedValue([
        {
          id: 'wh-001',
          name: 'Main Warehouse',
          location: 'Building A',
          StockTransaction: mockTransactions,
          Inventory: mockItemsWithLots,
        },
      ]);

      const response = await request(app)
        .get('/api/reports/analytics/warehouse-movements')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].warehouseName).toBe('Main Warehouse');
      expect(response.body.data[0].totalReceivedQty).toBe(50);
      expect(response.body.data[0].totalValuation).toBe(4000);
    });

    it('GET /api/reports/analytics/monthly-trends returns time-series monthly trend data', async () => {
      stockTransactionFindMany.mockResolvedValue(mockTransactions);

      const response = await request(app)
        .get('/api/reports/analytics/monthly-trends')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].month).toBe('2026-02');
      expect(response.body.data[0].totalReceivedValue).toBe(5000);
      expect(response.body.data[0].totalIssuedValue).toBe(1000);
    });

    it('GET /api/reports/analytics/top-issued-items returns top issued inventory leaderboard', async () => {
      stockTransactionFindMany.mockResolvedValue([mockTransactions[1]]);

      const response = await request(app)
        .get('/api/reports/analytics/top-issued-items?limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].itemCode).toBe('ITM-001');
      expect(response.body.data[0].totalQuantityIssued).toBe(10);
    });

    it('GET /api/reports/analytics/category-valuation returns FIFO valuation breakdown per category', async () => {
      categoryFindMany.mockResolvedValue([
        {
          id: 'cat-001',
          name: 'Networking',
          Inventory: mockItemsWithLots,
        },
      ]);

      const response = await request(app)
        .get('/api/reports/analytics/category-valuation')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].categoryName).toBe('Networking');
      expect(response.body.data[0].totalFifoValuation).toBe(4000);
    });
  });

  describe('Validation Error Handling', () => {
    it('returns 400 Bad Request on invalid date format', async () => {
      await request(app)
        .get('/api/reports/stock-movement?dateFrom=invalid-date')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('returns 400 Bad Request on invalid report export parameters', async () => {
      await request(app)
        .get('/api/reports/export?type=')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });
});

