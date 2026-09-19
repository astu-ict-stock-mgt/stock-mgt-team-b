import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const stockTransactionFindMany = jest.fn<() => Promise<unknown[]>>();
const inventoryItemFindMany = jest.fn<() => Promise<unknown[]>>();
const inventoryItemCount = jest.fn<() => Promise<number>>();
const stockLotFindMany = jest.fn<() => Promise<unknown[]>>();
const writeOffRequestFindMany = jest.fn<() => Promise<unknown[]>>();
const reconciliationFindMany = jest.fn<() => Promise<unknown[]>>();
const categoryFindMany = jest.fn<() => Promise<unknown[]>>();
const warehouseFindMany = jest.fn<() => Promise<unknown[]>>();

jest.unstable_mockModule('../../src/generated/prisma/client.js', () => ({
  PrismaClient: jest.fn(() => ({
    stockTransaction: {
      findMany: stockTransactionFindMany,
    },
    inventoryItem: {
      findMany: inventoryItemFindMany,
      count: inventoryItemCount,
    },
    stockLot: {
      findMany: stockLotFindMany,
    },
    writeOffRequest: {
      findMany: writeOffRequestFindMany,
    },
    reconciliation: {
      findMany: reconciliationFindMany,
    },
    category: {
      findMany: categoryFindMany,
    },
    warehouse: {
      findMany: warehouseFindMany,
    },
  })),
  Prisma: {},
}));

const { default: app } = await import('../../src/app.ts');

const accountantToken = jwt.sign(
  {
    sub: '10000000-0000-4000-8000-000000000004',
    email: 'accountant@stockmgt.com',
    role: 'ACCOUNTANT',
  },
  process.env.JWT_SECRET
);

const paoToken = jwt.sign(
  {
    sub: '10000000-0000-4000-8000-000000000002',
    email: 'pao@stockmgt.com',
    role: 'PAO',
  },
  process.env.JWT_SECRET
);

const adminToken = jwt.sign(
  {
    sub: '10000000-0000-4000-8000-000000000001',
    email: 'admin@stockmgt.com',
    role: 'ADMINISTRATOR',
  },
  process.env.JWT_SECRET
);

const securityOfficerToken = jwt.sign(
  {
    sub: '10000000-0000-4000-8000-000000000007',
    email: 'security@stockmgt.com',
    role: 'SECURITY_OFFICER',
  },
  process.env.JWT_SECRET
);

describe('Accountant Financial Valuation & Costing API (/api/reports/valuation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication & RBAC', () => {
    it('returns 401 Unauthorized when Authorization header is missing', async () => {
      const res = await request(app).get('/api/reports/valuation/summary');
      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('returns 403 Forbidden for SECURITY_OFFICER role', async () => {
      const res = await request(app)
        .get('/api/reports/valuation/summary')
        .set('Authorization', `Bearer ${securityOfficerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('allows access for ACCOUNTANT, PAO, and ADMINISTRATOR roles', async () => {
      stockLotFindMany.mockResolvedValueOnce([]);
      stockTransactionFindMany.mockResolvedValueOnce([]);
      writeOffRequestFindMany.mockResolvedValueOnce([]);
      reconciliationFindMany.mockResolvedValueOnce([]);
      inventoryItemCount.mockResolvedValueOnce(0);

      const resAccountant = await request(app)
        .get('/api/reports/valuation/summary')
        .set('Authorization', `Bearer ${accountantToken}`);
      expect(resAccountant.status).toBe(200);

      stockLotFindMany.mockResolvedValueOnce([]);
      stockTransactionFindMany.mockResolvedValueOnce([]);
      writeOffRequestFindMany.mockResolvedValueOnce([]);
      reconciliationFindMany.mockResolvedValueOnce([]);
      inventoryItemCount.mockResolvedValueOnce(0);

      const resPao = await request(app)
        .get('/api/reports/valuation/summary')
        .set('Authorization', `Bearer ${paoToken}`);
      expect(resPao.status).toBe(200);

      stockLotFindMany.mockResolvedValueOnce([]);
      stockTransactionFindMany.mockResolvedValueOnce([]);
      writeOffRequestFindMany.mockResolvedValueOnce([]);
      reconciliationFindMany.mockResolvedValueOnce([]);
      inventoryItemCount.mockResolvedValueOnce(0);

      const resAdmin = await request(app)
        .get('/api/reports/valuation/summary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resAdmin.status).toBe(200);
    });
  });

  describe('GET /api/reports/valuation/summary', () => {
    it('returns calculated financial summary metrics', async () => {
      // Mock active lots: 10 units @ 150 = 1500, 5 units @ 200 = 1000 => Total = 2500
      stockLotFindMany.mockResolvedValueOnce([
        { quantityRemaining: 10, unitCost: 150 },
        { quantityRemaining: 5, unitCost: 200 },
      ]);

      // Mock MTD issues: 3 units @ 150 = 450
      stockTransactionFindMany.mockResolvedValueOnce([
        {
          type: 'ISSUE',
          quantity: 3,
          LotConsumptions: [
            { quantityConsumed: 3, stockLot: { unitCost: 150 } },
          ],
        },
      ]);

      // Mock write offs: 2 units @ 150 = 300
      writeOffRequestFindMany.mockResolvedValueOnce([
        {
          quantity: 2,
          item: {
            StockLot: [{ unitCost: 150 }],
          },
        },
      ]);

      // Mock pending reconciliations: discrepancy = -4 @ 150 = 600
      reconciliationFindMany.mockResolvedValueOnce([
        { discrepancy: -4, unitCost: 150 },
      ]);

      inventoryItemCount.mockResolvedValueOnce(25);

      const res = await request(app)
        .get('/api/reports/valuation/summary')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.totalInventoryValue).toBe(2500);
      expect(res.body.data.monthToDateConsumedValue).toBe(450);
      expect(res.body.data.totalWriteOffLosses).toBe(300);
      expect(res.body.data.unadjustedDiscrepanciesValue).toBe(600);
      expect(res.body.data.activeCostLayersCount).toBe(2);
      expect(res.body.data.totalItemsCount).toBe(25);
    });
  });

  describe('GET /api/reports/valuation/cost-layers', () => {
    it('returns FIFO cost layers with aging bracket classification', async () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

      stockLotFindMany.mockResolvedValueOnce([
        {
          id: 'lot-01',
          inventoryItemId: 'item-01',
          quantityReceived: 50,
          quantityRemaining: 30,
          unitCost: 100,
          receivedDate: fortyDaysAgo,
          isDepleted: false,
          inventoryItem: {
            itemCode: 'ITM-001',
            name: 'Cat6 Ethernet Cable',
            category: { name: 'Networking' },
            warehouse: { name: 'Main Warehouse' },
          },
        },
        {
          id: 'lot-02',
          inventoryItemId: 'item-01',
          quantityReceived: 20,
          quantityRemaining: 20,
          unitCost: 110,
          receivedDate: tenDaysAgo,
          isDepleted: false,
          inventoryItem: {
            itemCode: 'ITM-001',
            name: 'Cat6 Ethernet Cable',
            category: { name: 'Networking' },
            warehouse: { name: 'Main Warehouse' },
          },
        },
      ]);

      const res = await request(app)
        .get('/api/reports/valuation/cost-layers')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.summary.totalLots).toBe(2);
      expect(res.body.data.summary.activeLotsCount).toBe(2);
      expect(res.body.data.summary.totalQuantityRemaining).toBe(50);
      // 30 * 100 + 20 * 110 = 3000 + 2200 = 5200
      expect(res.body.data.summary.totalValuation).toBe(5200);
      expect(res.body.data.lots[0].agingBracket).toBe('31-60 days');
      expect(res.body.data.lots[1].agingBracket).toBe('0-30 days');
      expect(res.body.data.lots[0].totalLotValue).toBe(3000);
      expect(res.body.data.lots[1].totalLotValue).toBe(2200);
    });
  });

  describe('GET /api/reports/valuation/ledger', () => {
    it('returns double-entry style financial movement ledger with debits and credits', async () => {
      stockTransactionFindMany.mockResolvedValueOnce([
        {
          id: 'tx-01',
          type: 'RECEIVE',
          referenceNumber: 'GRN-2026-001',
          inventoryItemId: 'item-01',
          quantity: 50,
          unitCost: 100,
          totalValue: 5000,
          createdAt: new Date('2026-09-01T10:00:00Z'),
          inventoryItem: {
            itemCode: 'ITM-001',
            name: 'Cat6 Ethernet Cable',
            category: { name: 'Networking' },
            warehouse: { name: 'Main Warehouse' },
          },
          user: { firstName: 'Store', lastName: 'Keeper' },
          LotConsumptions: [],
        },
        {
          id: 'tx-02',
          type: 'ISSUE',
          referenceNumber: 'SIV-2026-001',
          inventoryItemId: 'item-01',
          quantity: 10,
          unitCost: 100,
          totalValue: 1000,
          createdAt: new Date('2026-09-02T14:00:00Z'),
          inventoryItem: {
            itemCode: 'ITM-001',
            name: 'Cat6 Ethernet Cable',
            category: { name: 'Networking' },
            warehouse: { name: 'Main Warehouse' },
          },
          user: { firstName: 'Store', lastName: 'Keeper' },
          LotConsumptions: [
            { quantityConsumed: 10, stockLot: { unitCost: 100 } },
          ],
        },
      ]);

      writeOffRequestFindMany.mockResolvedValueOnce([
        {
          id: 'wo-01',
          itemId: 'item-01',
          quantity: 2,
          reasonCode: 'DAMAGED',
          reasonDescription: 'Crushed box',
          approvedAt: new Date('2026-09-03T09:00:00Z'),
          item: {
            itemCode: 'ITM-001',
            name: 'Cat6 Ethernet Cable',
            warehouseId: 'wh-01',
            StockLot: [{ quantityRemaining: 38, unitCost: 100 }],
          },
          approver: { firstName: 'PAO', lastName: 'Officer' },
        },
      ]);

      const res = await request(app)
        .get('/api/reports/valuation/ledger')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.summary.receiptsTotalValue).toBe(5000);
      expect(res.body.data.summary.issuesTotalValue).toBe(1000);
      expect(res.body.data.summary.writeOffsTotalValue).toBe(200);
      expect(res.body.data.summary.totalDebits).toBe(5000);
      expect(res.body.data.summary.totalCredits).toBe(1200);
      expect(res.body.data.summary.netMovement).toBe(3800);
      expect(res.body.data.entries.length).toBe(3);
    });
  });

  describe('GET /api/reports/valuation/statement', () => {
    it('compiles certified fiscal year-end valuation statement with category and warehouse distributions', async () => {
      // 1. Ending active lots: 38 units @ 100 = 3800
      stockLotFindMany.mockResolvedValueOnce([
        {
          quantityRemaining: 38,
          unitCost: 100,
          inventoryItem: {
            categoryId: 'cat-01',
            warehouseId: 'wh-01',
            category: { name: 'Networking' },
            warehouse: { name: 'Main Warehouse' },
          },
        },
      ]);

      // 2. Ledger transactions for the period:
      stockTransactionFindMany.mockResolvedValueOnce([
        {
          id: 'tx-01',
          type: 'RECEIVE',
          referenceNumber: 'GRN-01',
          inventoryItemId: 'item-01',
          quantity: 50,
          unitCost: 100,
          totalValue: 5000,
          createdAt: new Date('2026-09-01'),
          inventoryItem: {
            itemCode: 'ITM-001',
            name: 'Cable',
          },
          user: { firstName: 'A', lastName: 'B' },
          LotConsumptions: [],
        },
        {
          id: 'tx-02',
          type: 'ISSUE',
          referenceNumber: 'SIV-01',
          inventoryItemId: 'item-01',
          quantity: 10,
          unitCost: 100,
          totalValue: 1000,
          createdAt: new Date('2026-09-02'),
          inventoryItem: {
            itemCode: 'ITM-001',
            name: 'Cable',
          },
          user: { firstName: 'A', lastName: 'B' },
          LotConsumptions: [
            { quantityConsumed: 10, stockLot: { unitCost: 100 } },
          ],
        },
      ]);

      writeOffRequestFindMany.mockResolvedValueOnce([
        {
          id: 'wo-01',
          itemId: 'item-01',
          quantity: 2,
          reasonCode: 'DAMAGED',
          approvedAt: new Date('2026-09-03'),
          item: {
            itemCode: 'ITM-001',
            name: 'Cable',
            warehouseId: 'wh-01',
            StockLot: [{ quantityRemaining: 38, unitCost: 100 }],
          },
          approver: { firstName: 'PAO', lastName: 'Officer' },
        },
      ]);

      const res = await request(app)
        .get('/api/reports/valuation/statement')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.endingInventoryValue).toBe(3800);
      expect(res.body.data.inboundPurchasesValue).toBe(5000);
      expect(res.body.data.materialConsumptionValue).toBe(1000);
      expect(res.body.data.writeOffLossesValue).toBe(200);
      expect(res.body.data.certification.preparedByRole).toBe('ACCOUNTANT');
      expect(res.body.data.categoryBreakdown[0].categoryName).toBe('Networking');
      expect(res.body.data.categoryBreakdown[0].valuation).toBe(3800);
      expect(res.body.data.warehouseBreakdown[0].warehouseName).toBe('Main Warehouse');
      expect(res.body.data.warehouseBreakdown[0].valuation).toBe(3800);
    });
  });

  describe('GET /api/reports/export for Cost Layers and Financial Ledger', () => {
    it('exports CSV for cost layers', async () => {
      stockLotFindMany.mockResolvedValueOnce([
        {
          id: 'lot-01',
          inventoryItemId: 'item-01',
          quantityReceived: 50,
          quantityRemaining: 30,
          unitCost: 100,
          receivedDate: new Date('2026-08-01'),
          isDepleted: false,
          inventoryItem: {
            itemCode: 'ITM-001',
            name: 'Cat6 Cable',
            category: { name: 'Networking' },
            warehouse: { name: 'Central' },
          },
        },
      ]);

      const res = await request(app)
        .get('/api/reports/export?type=cost-layers&format=csv')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Lot ID');
      expect(res.text).toContain('ITM-001');
      expect(res.text).toContain('Cat6 Cable');
    });

    it('exports CSV for financial ledger', async () => {
      stockTransactionFindMany.mockResolvedValueOnce([
        {
          id: 'tx-01',
          type: 'RECEIVE',
          referenceNumber: 'GRN-01',
          inventoryItemId: 'item-01',
          quantity: 50,
          unitCost: 100,
          totalValue: 5000,
          createdAt: new Date('2026-09-01'),
          inventoryItem: {
            itemCode: 'ITM-001',
            name: 'Cat6 Cable',
          },
          user: { firstName: 'Store', lastName: 'Keeper' },
          LotConsumptions: [],
        },
      ]);
      writeOffRequestFindMany.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/reports/export?type=financial-ledger&format=csv')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Entry ID');
      expect(res.text).toContain('RECEIPT');
      expect(res.text).toContain('ITM-001');
    });
  });
});
