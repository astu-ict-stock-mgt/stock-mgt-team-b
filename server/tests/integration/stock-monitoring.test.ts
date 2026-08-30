import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const mockPrisma = {
  $transaction: jest.fn(),
  $disconnect: jest.fn(),

  inventoryItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },

  BinCard: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.unstable_mockModule('../../src/generated/prisma/client.js', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const { default: stockMonitoringRoutes } = await import(
  '../../src/modules/stock-monitoring/routes.ts'
);

const { errorHandler, notFoundHandler } = await import(
  '../../src/middlewares/errorHandler.ts'
);

const app = express();

app.use(express.json());
app.use('/api/stock-monitoring', stockMonitoringRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const createToken = (role: string) =>
  jwt.sign(
    {
      sub: 'user-1',
      email: 'storekeeper@example.com',
      role,
    },
    process.env.JWT_SECRET as string
  );

describe('Stock Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/stock-monitoring', () => {
    it('should return all items with stock levels categorized by severity', async () => {
      const token = createToken('STOREKEEPER');

      const mockItems = [
        {
          id: 'item-1',
          itemCode: 'ITEM-001',
          name: 'Paper A4',
          description: '80gsm paper',
          warehouseId: '10000000-0000-4000-8000-000000000001',
          minLevel: 200,
          maxLevel: 1000,
          reorderLevel: 300,
          safetyStock: 200,
          BinCard: [
            {
              balance: 150, // Below safety stock - CRITICAL
            },
          ],
        },
        {
          id: 'item-2',
          itemCode: 'ITEM-002',
          name: 'Pens',
          description: 'Blue pens',
          warehouseId: '10000000-0000-4000-8000-000000000001',
          minLevel: 100,
          maxLevel: 500,
          reorderLevel: 300,
          safetyStock: 200,
          BinCard: [
            {
              balance: 250, // Between safety and reorder - WARNING
            },
          ],
        },
        {
          id: 'item-3',
          itemCode: 'ITEM-003',
          name: 'Folders',
          description: 'Manila folders',
          warehouseId: '10000000-0000-4000-8000-000000000001',
          minLevel: 100,
          maxLevel: 1000,
          reorderLevel: 300,
          safetyStock: 200,
          BinCard: [
            {
              balance: 800, // Above reorder - HEALTHY
            },
          ],
        },
      ];

      mockPrisma.inventoryItem.findMany.mockResolvedValue(mockItems);

      const response = await request(app)
        .get('/api/stock-monitoring')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.critical).toHaveLength(1);
      expect(response.body.data.critical[0].severity).toBe('red');
      expect(response.body.data.critical[0].itemCode).toBe('ITEM-001');
      expect(response.body.data.critical[0].currentStock).toBe(150);

      expect(response.body.data.warning).toHaveLength(1);
      expect(response.body.data.warning[0].severity).toBe('yellow');
      expect(response.body.data.warning[0].itemCode).toBe('ITEM-002');
      expect(response.body.data.warning[0].currentStock).toBe(250);

      expect(response.body.data.healthy).toHaveLength(1);
      expect(response.body.data.healthy[0].severity).toBe('green');
      expect(response.body.data.healthy[0].itemCode).toBe('ITEM-003');
      expect(response.body.data.healthy[0].currentStock).toBe(800);

      expect(response.body.data.summary.totalItems).toBe(3);
      expect(response.body.data.summary.criticalCount).toBe(1);
      expect(response.body.data.summary.warningCount).toBe(1);
      expect(response.body.data.summary.healthyCount).toBe(1);
    });

    it('should filter by warehouseId when provided', async () => {
      const token = createToken('STOREKEEPER');

      const mockItems = [
        {
          id: 'item-1',
          itemCode: 'ITEM-001',
          name: 'Paper A4',
          description: '80gsm paper',
          warehouseId: '10000000-0000-4000-8000-000000000001',
          minLevel: 200,
          maxLevel: 1000,
          reorderLevel: 300,
          safetyStock: 200,
          BinCard: [{ balance: 500 }],
        },
      ];

      mockPrisma.inventoryItem.findMany.mockResolvedValue(mockItems);

      const response = await request(app)
        .get('/api/stock-monitoring?warehouseId=10000000-0000-4000-8000-000000000001')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith({
        where: { warehouseId: '10000000-0000-4000-8000-000000000001' },
        include: {
          warehouse: true,
          BinCard: {
            where: { warehouseId: '10000000-0000-4000-8000-000000000001' },
          },
        },
      });
    });

    it('should reject invalid warehouseId UUID', async () => {
      const token = createToken('STOREKEEPER');

      const response = await request(app)
        .get('/api/stock-monitoring?warehouseId=not-a-uuid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('warehouseId must be a valid UUID');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/stock-monitoring')
        .expect(401);
    });

    it('should allow all authenticated roles', async () => {
      const roles = [
        'STOREKEEPER',
        'STOCK_CLERK',
        'ACCOUNTANT',
        'DEPARTMENT_HEAD',
        'PAO',
        'ADMINISTRATOR',
        'SECURITY_OFFICER',
      ];

      mockPrisma.inventoryItem.findMany.mockResolvedValue([]);

      for (const role of roles) {
        const token = createToken(role);
        const response = await request(app)
          .get('/api/stock-monitoring')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
      }
    });
  });

  describe('GET /api/stock-monitoring/:itemId', () => {
    it('should return a specific item stock level', async () => {
      const token = createToken('STOREKEEPER');

      const mockItem = {
        id: 'item-1',
        itemCode: 'ITEM-001',
        name: 'Paper A4',
        description: '80gsm paper',
        warehouseId: '10000000-0000-4000-8000-000000000001',
        minLevel: 200,
        maxLevel: 1000,
        reorderLevel: 300,
        safetyStock: 200,
        BinCard: [{ balance: 150 }],
      };

      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockItem);

      const response = await request(app)
        .get('/api/stock-monitoring/item-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe('item-1');
      expect(response.body.data.itemCode).toBe('ITEM-001');
      expect(response.body.data.currentStock).toBe(150);
      expect(response.body.data.severity).toBe('red');
      expect(response.body.data.status).toBe('critical');
    });

    it('should return 404 if item not found', async () => {
      const token = createToken('STOREKEEPER');

      mockPrisma.inventoryItem.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/stock-monitoring/nonexistent-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Item not found');
    });

    it('should return 404 if item not in specified warehouse', async () => {
      const token = createToken('STOREKEEPER');

      const mockItem = {
        id: 'item-1',
        itemCode: 'ITEM-001',
        name: 'Paper A4',
        warehouseId: '10000000-0000-4000-8000-000000000001',
        minLevel: 200,
        maxLevel: 1000,
        reorderLevel: 300,
        safetyStock: 200,
        BinCard: [],
      };

      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockItem);

      const response = await request(app)
        .get('/api/stock-monitoring/item-1?warehouseId=20000000-0000-4000-8000-000000000002')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain(
        'Item does not exist in the specified warehouse'
      );
    });

    it('should reject invalid warehouseId UUID', async () => {
      const token = createToken('STOREKEEPER');

      const response = await request(app)
        .get('/api/stock-monitoring/item-1?warehouseId=not-a-uuid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('warehouseId must be a valid UUID');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/stock-monitoring/item-1')
        .expect(401);
    });

    it('should correctly categorize items as warning status', async () => {
      const token = createToken('STOREKEEPER');

      const mockItem = {
        id: 'item-1',
        itemCode: 'ITEM-001',
        name: 'Paper A4',
        warehouseId: '10000000-0000-4000-8000-000000000001',
        minLevel: 100,
        maxLevel: 500,
        reorderLevel: 300,
        safetyStock: 200,
        BinCard: [{ balance: 250 }], // Between safety (200) and reorder (300)
      };

      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockItem);

      const response = await request(app)
        .get('/api/stock-monitoring/item-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.severity).toBe('yellow');
      expect(response.body.data.status).toBe('warning');
    });

    it('should correctly categorize items as healthy status', async () => {
      const token = createToken('STOREKEEPER');

      const mockItem = {
        id: 'item-1',
        itemCode: 'ITEM-001',
        name: 'Paper A4',
        warehouseId: '10000000-0000-4000-8000-000000000001',
        minLevel: 100,
        maxLevel: 1000,
        reorderLevel: 300,
        safetyStock: 200,
        BinCard: [{ balance: 500 }], // Above reorder (300)
      };

      mockPrisma.inventoryItem.findUnique.mockResolvedValue(mockItem);

      const response = await request(app)
        .get('/api/stock-monitoring/item-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.severity).toBe('green');
      expect(response.body.data.status).toBe('healthy');
    });
  });
});
