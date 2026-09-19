import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const mockInventoryFindUnique = jest.fn<() => Promise<unknown>>();
const mockWarehouseFindUnique = jest.fn<() => Promise<unknown>>();
const mockLotFindMany = jest.fn<() => Promise<unknown[]>>();
const mockLotUpdate = jest.fn<() => Promise<unknown>>();
const mockTransactionCreate = jest.fn<() => Promise<unknown>>();
const mockLotConsumptionCreateMany = jest.fn<() => Promise<unknown>>();
const mockBinCardFindUnique = jest.fn<() => Promise<unknown>>();
const mockBinCardUpsert = jest.fn<() => Promise<unknown>>();

const mockTx = {
  inventoryItem: { findUnique: mockInventoryFindUnique },
  warehouse: { findUnique: mockWarehouseFindUnique },
  stockLot: { findMany: mockLotFindMany, update: mockLotUpdate },
  stockTransaction: { create: mockTransactionCreate },
  lotConsumption: { createMany: mockLotConsumptionCreateMany },
  binCard: { findUnique: mockBinCardFindUnique, upsert: mockBinCardUpsert },
};

const mockTransaction = jest.fn(
  async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)
);

jest.unstable_mockModule('../../src/generated/prisma/client.js', () => ({
  PrismaClient: jest.fn(() => ({
    $transaction: mockTransaction,
  })),
  Prisma: {},
}));

const { default: app } = await import('../../src/app.ts');

const createToken = (role: string = 'STOREKEEPER', userId: string = 'user-storekeeper-1') => {
  return jwt.sign(
    { sub: userId, email: 'storekeeper@example.com', role },
    process.env.JWT_SECRET as string
  );
};

describe('POST /api/stock-issuing', () => {
  const validPayload = {
    inventoryItemId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    warehouseId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    quantity: 80,
    requisitionNumber: 'REQ-2026-001',
    isApproved: true,
  };

  const lot1 = {
    id: 'lot-1',
    inventoryItemId: validPayload.inventoryItemId,
    quantityReceived: 50,
    quantityRemaining: 50,
    unitCost: 10,
    receivedDate: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    isDepleted: false,
  };

  const lot2 = {
    id: 'lot-2',
    inventoryItemId: validPayload.inventoryItemId,
    quantityReceived: 50,
    quantityRemaining: 50,
    unitCost: 12,
    receivedDate: new Date('2026-01-02T00:00:00Z'),
    createdAt: new Date('2026-01-02T00:00:00Z'),
    isDepleted: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects issuing when requisition is not approved', async () => {
    const token = createToken('STOREKEEPER');

    const response = await request(app)
      .post('/api/stock-issuing')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, isApproved: false })
      .expect(400);

    expect(response.body.message).toContain('Inventory cannot be issued without an approved requisition form');
  });

  it('rejects issuing when user lacks allowed role (e.g., DEPARTMENT_HEAD)', async () => {
    const token = createToken('DEPARTMENT_HEAD');

    await request(app)
      .post('/api/stock-issuing')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload)
      .expect(403);
  });

  it('successfully splits issues across multiple FIFO lots', async () => {
    const token = createToken('STOREKEEPER');

    mockInventoryFindUnique.mockResolvedValue({ id: validPayload.inventoryItemId });
    mockWarehouseFindUnique.mockResolvedValue({ id: validPayload.warehouseId });
    mockLotFindMany.mockResolvedValue([lot1, lot2]);
    mockTransactionCreate.mockResolvedValue({
      id: 'tx-100',
      type: 'ISSUE',
      quantity: 80,
      totalValue: 860,
      unitCost: 10.75,
      referenceNumber: 'REQ-2026-001',
    });
    mockLotConsumptionCreateMany.mockResolvedValue({ count: 2 });
    mockBinCardFindUnique.mockResolvedValue({
      inventoryItemId: validPayload.inventoryItemId,
      warehouseId: validPayload.warehouseId,
      balance: 100,
    });
    mockBinCardUpsert.mockResolvedValue({
      inventoryItemId: validPayload.inventoryItemId,
      warehouseId: validPayload.warehouseId,
      balance: 20,
    });

    const response = await request(app)
      .post('/api/stock-issuing')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload)
      .expect(201);

    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Stock issued successfully');

    expect(mockLotUpdate).toHaveBeenCalledTimes(2);
    expect(mockLotUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 'lot-1' },
      data: { quantityRemaining: 0, isDepleted: true },
    });
    expect(mockLotUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 'lot-2' },
      data: { quantityRemaining: 20, isDepleted: false },
    });

    expect(mockLotConsumptionCreateMany).toHaveBeenCalledWith({
      data: [
        { stockLotId: 'lot-1', stockTransactionId: 'tx-100', quantityConsumed: 50 },
        { stockLotId: 'lot-2', stockTransactionId: 'tx-100', quantityConsumed: 30 },
      ],
    });

    expect(mockBinCardUpsert).toHaveBeenCalledWith({
      where: {
        inventoryItemId_warehouseId: {
          inventoryItemId: validPayload.inventoryItemId,
          warehouseId: validPayload.warehouseId,
        },
      },
      update: { balance: 20, lastUpdated: expect.any(Date) },
      create: {
        inventoryItemId: validPayload.inventoryItemId,
        warehouseId: validPayload.warehouseId,
        balance: 20,
      },
    });
  });

  it('fails cleanly without updating DB when total stock is insufficient', async () => {
    const token = createToken('STOREKEEPER');

    mockInventoryFindUnique.mockResolvedValue({ id: validPayload.inventoryItemId });
    mockWarehouseFindUnique.mockResolvedValue({ id: validPayload.warehouseId });
    mockLotFindMany.mockResolvedValue([lot1, lot2]); // Total available: 100

    const response = await request(app)
      .post('/api/stock-issuing')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, quantity: 150 })
      .expect(400);

    expect(response.body.message).toContain('Insufficient stock available');
    expect(mockLotUpdate).not.toHaveBeenCalled();
    expect(mockTransactionCreate).not.toHaveBeenCalled();
  });
});
