import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const mockPrisma = {
  $transaction: jest.fn(),
  $disconnect: jest.fn(),

  supplier: {
    findUnique: jest.fn(),
  },

  warehouse: {
    findUnique: jest.fn(),
  },

  user: {
    findUnique: jest.fn(),
  },

  inventoryItem: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },

  goodsReceivingNote: {
    count: jest.fn(),
    create: jest.fn(),
  },

  stockLot: {
    create: jest.fn(),
  },

  stockTransaction: {
    create: jest.fn(),
  },

  binCard: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
};

jest.unstable_mockModule('../../src/generated/prisma/client.js', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const { default: stockReceivingRoutes } = await import(
  '../../src/modules/stock-receiving/routes.ts'
);

const { errorHandler, notFoundHandler } = await import(
  '../../src/middlewares/errorHandler.ts'
);

const app = express();

app.use(express.json());
app.use('/api/stock-receiving', stockReceivingRoutes);
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

const setupSuccessfulTransaction = () => {
  mockPrisma.$transaction.mockImplementation(
    async (callback: (tx: typeof mockPrisma) => Promise<unknown>) => {
      return callback(mockPrisma);
    }
  );

  mockPrisma.supplier.findUnique.mockResolvedValue({
    id: 'supplier-1',
    name: 'Test Supplier',
  });

  mockPrisma.warehouse.findUnique.mockResolvedValue({
    id: 'warehouse-1',
    name: 'Main Warehouse',
  });

  mockPrisma.user.findUnique.mockResolvedValue({
    id: 'user-1',
    email: 'storekeeper@example.com',
    role: 'STOREKEEPER',
  });

  mockPrisma.inventoryItem.findUnique.mockResolvedValue({
    id: 'item-1',
    itemCode: 'ITEM-001',
    name: 'Test Item',
    warehouseId: 'warehouse-1',
    state: 'CREATED',
  });

  mockPrisma.goodsReceivingNote.count.mockResolvedValue(0);

  mockPrisma.goodsReceivingNote.create.mockResolvedValue({
    id: 'grn-1',
    grnNumber: 'GRN-2026-00001',
    supplierId: 'supplier-1',
    warehouseId: 'warehouse-1',
    receivedDate: new Date('2026-08-17T00:00:00.000Z'),
    receivedBy: 'user-1',
    items: [
      {
        id: 'grn-item-1',
        inventoryItemId: 'item-1',
        quantity: 10,
        unitCost: 100,
        inspectionStatus: 'ACCEPTED',
        rejectionReason: null,
      },
    ],
  });

  mockPrisma.stockLot.create.mockResolvedValue({
    id: 'lot-1',
    inventoryItemId: 'item-1',
    quantityReceived: 10,
    quantityRemaining: 10,
    unitCost: 100,
  });

  mockPrisma.stockTransaction.create.mockResolvedValue({
    id: 'transaction-1',
    type: 'RECEIVE',
    inventoryItemId: 'item-1',
    warehouseId: 'warehouse-1',
    quantity: 10,
    unitCost: 100,
    totalValue: 1000,
  });

  mockPrisma.binCard.findUnique.mockResolvedValue(null);

  mockPrisma.binCard.create.mockResolvedValue({
    id: 'bin-card-1',
    inventoryItemId: 'item-1',
    warehouseId: 'warehouse-1',
    balance: 10,
  });

  mockPrisma.inventoryItem.update.mockResolvedValue({
    id: 'item-1',
    state: 'AVAILABLE',
  });
};

describe('Stock receiving API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockReset();
    mockPrisma.$disconnect.mockReset();

    mockPrisma.supplier.findUnique.mockReset();
    mockPrisma.warehouse.findUnique.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.inventoryItem.findUnique.mockReset();
    mockPrisma.inventoryItem.update.mockReset();

    mockPrisma.goodsReceivingNote.count.mockReset();
    mockPrisma.goodsReceivingNote.create.mockReset();

    mockPrisma.stockLot.create.mockReset();
    mockPrisma.stockTransaction.create.mockReset();

    mockPrisma.binCard.findUnique.mockReset();
    mockPrisma.binCard.update.mockReset();
    mockPrisma.binCard.create.mockReset();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app)
      .post('/api/stock-receiving')
      .send({})
      .expect(401);

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects users without a receiving role', async () => {
    const token = createToken('ACCOUNTANT');

    await request(app)
      .post('/api/stock-receiving')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(403);

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects invalid receiving data', async () => {
    const token = createToken('STOREKEEPER');

    const response = await request(app)
      .post('/api/stock-receiving')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      status: 'error',
    });

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('successfully receives accepted stock', async () => {
    setupSuccessfulTransaction();

    const token = createToken('STOREKEEPER');

    const response = await request(app)
      .post('/api/stock-receiving')
      .set('Authorization', `Bearer ${token}`)
      .send({
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        receivedDate: '2026-08-17T00:00:00.000Z',
        items: [
          {
            inventoryItemId: 'item-1',
            quantity: 10,
            unitCost: 100,
            inspectionStatus: 'ACCEPTED',
          },
        ],
      });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      status: 'success',
      data: {
        id: 'grn-1',
        grnNumber: 'GRN-2026-00001',
      },
    });

    expect(mockPrisma.goodsReceivingNote.create).toHaveBeenCalledTimes(1);

    expect(mockPrisma.stockLot.create).toHaveBeenCalledTimes(1);

    expect(mockPrisma.stockTransaction.create).toHaveBeenCalledTimes(1);

    expect(mockPrisma.binCard.create).toHaveBeenCalledTimes(1);

    expect(mockPrisma.inventoryItem.update).toHaveBeenCalledTimes(1);
  });

  it('records rejected stock without increasing inventory', async () => {
    setupSuccessfulTransaction();

    mockPrisma.goodsReceivingNote.create.mockResolvedValue({
      id: 'grn-2',
      grnNumber: 'GRN-2026-00002',
      supplierId: 'supplier-1',
      warehouseId: 'warehouse-1',
      receivedDate: new Date('2026-08-17T00:00:00.000Z'),
      receivedBy: 'user-1',
      items: [
        {
          id: 'grn-item-2',
          inventoryItemId: 'item-1',
          quantity: 5,
          unitCost: 100,
          inspectionStatus: 'REJECTED',
          rejectionReason: 'Damaged packaging',
        },
      ],
    });

    const token = createToken('STOREKEEPER');

    const response = await request(app)
      .post('/api/stock-receiving')
      .set('Authorization', `Bearer ${token}`)
      .send({
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        receivedDate: '2026-08-17T00:00:00.000Z',
        items: [
          {
            inventoryItemId: 'item-1',
            quantity: 5,
            unitCost: 100,
            inspectionStatus: 'REJECTED',
            rejectionReason: 'Damaged packaging',
          },
        ],
      });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      status: 'success',
      data: {
        id: 'grn-2',
        grnNumber: 'GRN-2026-00002',
      },
    });

    /*
     * A GRN must still be created for rejected stock.
     * However, rejected stock must NOT enter inventory.
     */

    expect(mockPrisma.goodsReceivingNote.create).toHaveBeenCalledTimes(1);

    expect(mockPrisma.stockLot.create).not.toHaveBeenCalled();

    expect(mockPrisma.stockTransaction.create).not.toHaveBeenCalled();

    expect(mockPrisma.binCard.create).not.toHaveBeenCalled();

    expect(mockPrisma.binCard.update).not.toHaveBeenCalled();

    expect(mockPrisma.inventoryItem.update).not.toHaveBeenCalled();
  });

  it('rejects rejected stock without a rejection reason', async () => {
    setupSuccessfulTransaction();

    const token = createToken('STOREKEEPER');

    const response = await request(app)
      .post('/api/stock-receiving')
      .set('Authorization', `Bearer ${token}`)
      .send({
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        receivedDate: '2026-08-17T00:00:00.000Z',
        items: [
          {
            inventoryItemId: 'item-1',
            quantity: 5,
            unitCost: 100,
            inspectionStatus: 'REJECTED',
          },
        ],
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      status: 'error',
      message: expect.stringContaining('Rejection reason'),
    });

    expect(mockPrisma.goodsReceivingNote.create).not.toHaveBeenCalled();

    expect(mockPrisma.stockLot.create).not.toHaveBeenCalled();

    expect(mockPrisma.stockTransaction.create).not.toHaveBeenCalled();
  });
});
