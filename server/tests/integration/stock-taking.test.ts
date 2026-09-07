import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const mockPrisma = {
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
  warehouse: { findUnique: jest.fn() },
  stockTake: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  inventoryItem: { findUnique: jest.fn() },
  binCard: { findUnique: jest.fn(), upsert: jest.fn() },
  stockTakeCount: { findUnique: jest.fn(), create: jest.fn() },
  reconciliation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  stockLot: { findMany: jest.fn(), update: jest.fn(), create: jest.fn() },
  stockTransaction: { create: jest.fn() },
  lotConsumption: { createMany: jest.fn() },
  auditLog: { create: jest.fn() },
};

jest.unstable_mockModule('../../src/generated/prisma/client.js', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const { default: stockTakingRoutes } = await import('../../src/modules/stock-taking/routes.ts');
const { errorHandler, notFoundHandler } = await import('../../src/middlewares/errorHandler.ts');

const app = express();
app.use(express.json());
app.use('/api/stock-taking', stockTakingRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const createToken = (role: string, userId = 'user-1') =>
  jwt.sign(
    { sub: userId, email: `${role.toLowerCase()}@example.com`, role },
    process.env.JWT_SECRET as string
  );

const session = {
  id: 'session-1',
  warehouseId: 'warehouse-1',
  createdBy: 'user-1',
  status: 'DRAFT',
};

const inventoryItem = {
  id: 'item-1',
  itemCode: 'ITEM-001',
  name: 'Test Item',
  warehouseId: 'warehouse-1',
};

const setupTransaction = () => {
  mockPrisma.$transaction.mockImplementation(
    async (callback: (tx: typeof mockPrisma) => Promise<unknown>) => callback(mockPrisma)
  );
};

describe('Stock-taking API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransaction();
  });

  it('rejects unauthenticated session creation', async () => {
    await request(app).post('/api/stock-taking').send({ warehouseId: 'warehouse-1' }).expect(401);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects unauthorized roles', async () => {
    const token = createToken('ACCOUNTANT');

    await request(app)
      .post('/api/stock-taking')
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: 'warehouse-1' })
      .expect(403);
  });

  it('rejects a missing warehouseId', async () => {
    const token = createToken('STOREKEEPER');

    await request(app)
      .post('/api/stock-taking')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects an invalid warehouse', async () => {
    mockPrisma.warehouse.findUnique.mockResolvedValue(null);
    const token = createToken('STOREKEEPER');

    const response = await request(app)
      .post('/api/stock-taking')
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: 'missing-warehouse' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Warehouse not found');
    expect(mockPrisma.stockTake.create).not.toHaveBeenCalled();
  });

  it('creates a draft stock-take session', async () => {
    mockPrisma.warehouse.findUnique.mockResolvedValue({ id: 'warehouse-1' });
    mockPrisma.stockTake.create.mockResolvedValue(session);
    const token = createToken('PAO');

    const response = await request(app)
      .post('/api/stock-taking')
      .set('Authorization', `Bearer ${token}`)
      .send({ warehouseId: 'warehouse-1' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ status: 'success', data: session });
    expect(mockPrisma.stockTake.create).toHaveBeenCalledWith({
      data: {
        warehouseId: 'warehouse-1',
        createdBy: 'user-1',
        status: 'DRAFT',
        startedAt: expect.any(Date),
      },
    });
  });

  it('records a count using the BinCard balance and calculates discrepancy', async () => {
    mockPrisma.stockTake.findUnique.mockResolvedValue(session);
    mockPrisma.inventoryItem.findUnique.mockResolvedValue(inventoryItem);
    mockPrisma.stockTakeCount.findUnique.mockResolvedValue(null);
    mockPrisma.binCard.findUnique.mockResolvedValue({ balance: 30 });
    mockPrisma.stockTakeCount.create.mockResolvedValue({
      id: 'count-1',
      stockTakeId: 'session-1',
      inventoryItemId: 'item-1',
      systemQuantity: 30,
      physicalQuantity: 42,
      discrepancy: 12,
      hasDiscrepancy: true,
    });
    mockPrisma.reconciliation.create.mockResolvedValue({
      id: 'reconciliation-1',
      discrepancy: 12,
      status: 'PENDING',
    });
    const token = createToken('STOCK_CLERK');

    const response = await request(app)
      .post('/api/stock-taking/session-1/counts')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryItemId: 'item-1', physicalQuantity: 42 });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      systemQuantity: 30,
      physicalQuantity: 42,
      discrepancy: 12,
      hasDiscrepancy: true,
      reconciliation: { status: 'PENDING' },
    });
    expect(mockPrisma.stockTakeCount.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        systemQuantity: 30,
        physicalQuantity: 42,
        discrepancy: 12,
        hasDiscrepancy: true,
      }),
      include: { reconciliation: true },
    });
    expect(mockPrisma.stockTake.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { status: 'COUNTING' },
    });
  });

  it('does not create a reconciliation or modify inventory for a zero discrepancy', async () => {
    mockPrisma.stockTake.findUnique.mockResolvedValue(session);
    mockPrisma.inventoryItem.findUnique.mockResolvedValue(inventoryItem);
    mockPrisma.stockTakeCount.findUnique.mockResolvedValue(null);
    mockPrisma.binCard.findUnique.mockResolvedValue({ balance: 42 });
    mockPrisma.stockTakeCount.create.mockResolvedValue({
      id: 'count-1',
      systemQuantity: 42,
      physicalQuantity: 42,
      discrepancy: 0,
      hasDiscrepancy: false,
    });
    const token = createToken('STOREKEEPER');

    const response = await request(app)
      .post('/api/stock-taking/session-1/counts')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryItemId: 'item-1', physicalQuantity: 42 });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ discrepancy: 0, hasDiscrepancy: false, reconciliation: null });
    expect(mockPrisma.reconciliation.create).not.toHaveBeenCalled();
    expect(mockPrisma.stockTakeCount.create).toHaveBeenCalled();
  });

  it('rejects duplicate counts for an item in one session', async () => {
    mockPrisma.stockTake.findUnique.mockResolvedValue(session);
    mockPrisma.inventoryItem.findUnique.mockResolvedValue(inventoryItem);
    mockPrisma.stockTakeCount.findUnique.mockResolvedValue({ id: 'existing-count' });
    const token = createToken('STOREKEEPER');

    const response = await request(app)
      .post('/api/stock-taking/session-1/counts')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryItemId: 'item-1', physicalQuantity: 42 });

    expect(response.status).toBe(409);
    expect(mockPrisma.binCard.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.stockTakeCount.create).not.toHaveBeenCalled();
  });

  it('rejects an item belonging to another warehouse', async () => {
    mockPrisma.stockTake.findUnique.mockResolvedValue(session);
    mockPrisma.inventoryItem.findUnique.mockResolvedValue({
      ...inventoryItem,
      warehouseId: 'warehouse-2',
    });
    const token = createToken('STOREKEEPER');

    const response = await request(app)
      .post('/api/stock-taking/session-1/counts')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryItemId: 'item-1', physicalQuantity: 42 });

    expect(response.status).toBe(400);
    expect(mockPrisma.stockTakeCount.create).not.toHaveBeenCalled();
  });

  it('rejects invalid physical quantities', async () => {
    const token = createToken('STOREKEEPER');

    await request(app)
      .post('/api/stock-taking/session-1/counts')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryItemId: 'item-1', physicalQuantity: -1 })
      .expect(400);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('retrieves a session with stored counts and reconciliation data', async () => {
    mockPrisma.stockTake.findUnique.mockResolvedValue({
      ...session,
      status: 'COUNTING',
      counts: [
        {
          id: 'count-1',
          systemQuantity: 30,
          physicalQuantity: 42,
          discrepancy: 12,
          hasDiscrepancy: true,
          reconciliation: { id: 'reconciliation-1', status: 'PENDING' },
        },
      ],
    });
    const token = createToken('ACCOUNTANT');

    const response = await request(app)
      .get('/api/stock-taking/session-1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.counts[0]).toMatchObject({
      systemQuantity: 30,
      physicalQuantity: 42,
      discrepancy: 12,
      hasDiscrepancy: true,
      reconciliation: { status: 'PENDING' },
    });
  });

  it('rejects counts after session completion', async () => {
    mockPrisma.stockTake.findUnique.mockResolvedValue({ ...session, status: 'COMPLETED' });
    const token = createToken('PAO');

    const response = await request(app)
      .post('/api/stock-taking/session-1/counts')
      .set('Authorization', `Bearer ${token}`)
      .send({ inventoryItemId: 'item-1', physicalQuantity: 42 });

    expect(response.status).toBe(400);
    expect(mockPrisma.inventoryItem.findUnique).not.toHaveBeenCalled();
  });

  it('completes a stock-take session without changing inventory', async () => {
    mockPrisma.stockTake.findUnique.mockResolvedValue(session);
    mockPrisma.stockTake.update.mockResolvedValue({ ...session, status: 'COMPLETED' });
    const token = createToken('STOCK_CLERK');

    const response = await request(app)
      .post('/api/stock-taking/session-1/complete')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('COMPLETED');
    expect(mockPrisma.stockTake.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { status: 'COMPLETED', completedAt: expect.any(Date) },
    });
  });

  it('rejects completing an already completed session', async () => {
    mockPrisma.stockTake.findUnique.mockResolvedValue({ ...session, status: 'COMPLETED' });
    const token = createToken('STOREKEEPER');

    await request(app)
      .post('/api/stock-taking/session-1/complete')
      .set('Authorization', `Bearer ${token}`)
      .expect(409);
    expect(mockPrisma.stockTake.update).not.toHaveBeenCalled();
  });

  it('retrieves reconciliations for a session', async () => {
    mockPrisma.stockTake.findUnique.mockResolvedValue(session);
    mockPrisma.reconciliation.findMany.mockResolvedValue([
      { id: 'reconciliation-1', discrepancy: -5, status: 'PENDING', reason: null },
    ]);
    const token = createToken('ADMINISTRATOR');

    const response = await request(app)
      .get('/api/stock-taking/session-1/reconciliations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { id: 'reconciliation-1', discrepancy: -5, status: 'PENDING', reason: null },
    ]);
    expect(mockPrisma.reconciliation.findMany).toHaveBeenCalledWith({
      where: { stockTakeCount: { stockTakeId: 'session-1' } },
      include: {
        stockTakeCount: true,
        inventoryItem: true,
        warehouse: true,
        approver: true,
        adjustmentTransaction: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('retrieves global reconciliations across sessions for PAO', async () => {
    mockPrisma.reconciliation.findMany.mockResolvedValue([
      {
        id: 'reconciliation-global-1',
        stockTakeCountId: 'count-1',
        warehouseId: 'warehouse-1',
        inventoryItemId: 'item-1',
        discrepancy: 3,
        status: 'PENDING',
        reason: null,
        unitCost: null,
        createdAt: new Date(),
        stockTakeCount: {
          stockTakeId: 'session-1',
          systemQuantity: 10,
          physicalQuantity: 13,
          countedAt: new Date(),
          counter: { firstName: 'Dawit', lastName: 'Bekele' },
        },
        inventoryItem: {
          itemCode: 'LAP-DELL',
          name: 'Dell Laptop',
          category: { name: 'Electronics' },
        },
        warehouse: { name: 'Main Central' },
        approver: null,
      },
    ]);
    const token = createToken('PAO');

    const response = await request(app)
      .get('/api/stock-taking/reconciliations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe('reconciliation-global-1');
    expect(response.body.data[0].itemCode).toBe('LAP-DELL');
  });

  const setupPendingReconciliation = (discrepancy: number, systemQuantity = 100) => {
    mockPrisma.reconciliation.findUnique.mockResolvedValue({
      id: 'reconciliation-1',
      inventoryItemId: 'item-1',
      warehouseId: 'warehouse-1',
      discrepancy,
      status: 'PENDING',
      stockTakeCount: { id: 'count-1', systemQuantity },
    });
    mockPrisma.binCard.findUnique.mockResolvedValue({ balance: systemQuantity });
    mockPrisma.reconciliation.update.mockResolvedValue({
      id: 'reconciliation-1',
      discrepancy,
      status: 'APPLIED',
    });
    mockPrisma.reconciliation.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.stockTransaction.create.mockResolvedValue({ id: 'adjustment-1' });
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });
  };

  it.each(['PAO', 'ADMINISTRATOR'])('allows %s to approve a reconciliation', async (role) => {
    setupPendingReconciliation(8);
    mockPrisma.stockLot.create.mockResolvedValue({ id: 'lot-adjustment-1' });
    const token = createToken(role);

    const response = await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Verified physical count', unitCost: 125.5 });

    expect(response.status).toBe(200);
    expect(mockPrisma.reconciliation.update).toHaveBeenCalledWith({
      where: { id: 'reconciliation-1' },
      data: expect.objectContaining({
        status: 'APPLIED',
        reason: 'Verified physical count',
        unitCost: 125.5,
        approvedBy: 'user-1',
        adjustmentTransactionId: 'adjustment-1',
      }),
    });
  });

  it.each(['STOREKEEPER', 'STOCK_CLERK'])('rejects %s from approving a reconciliation', async (role) => {
    const token = createToken(role);

    await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Verified physical count', unitCost: 125.5 })
      .expect(403);
    expect(mockPrisma.reconciliation.findUnique).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated approval', async () => {
    await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/approve')
      .send({ reason: 'Verified physical count' })
      .expect(401);
  });

  it('requires a reason for approval and rejection', async () => {
    const token = createToken('PAO');

    await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ unitCost: 10 })
      .expect(400);

    await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/reject')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: '   ' })
      .expect(400);
  });

  it('rejects a pending reconciliation without changing inventory', async () => {
    setupPendingReconciliation(-8);
    mockPrisma.reconciliation.update.mockResolvedValue({
      id: 'reconciliation-1',
      status: 'REJECTED',
    });
    const token = createToken('PAO');

    const response = await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/reject')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Requires further investigation' });

    expect(response.status).toBe(200);
    expect(mockPrisma.reconciliation.update).toHaveBeenCalledWith({
      where: { id: 'reconciliation-1' },
      data: expect.objectContaining({ status: 'REJECTED', reason: 'Requires further investigation' }),
    });
    expect(mockPrisma.stockLot.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.stockTransaction.create).not.toHaveBeenCalled();
    expect(mockPrisma.binCard.upsert).not.toHaveBeenCalled();
  });

  it('rejects approval for a processed reconciliation', async () => {
    mockPrisma.reconciliation.findUnique.mockResolvedValue({ status: 'REJECTED' });
    const token = createToken('PAO');

    await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Verified physical count', unitCost: 10 })
      .expect(409);
    expect(mockPrisma.stockTransaction.create).not.toHaveBeenCalled();
  });

  it('rejects a second approval after reconciliation is applied', async () => {
    mockPrisma.reconciliation.findUnique.mockResolvedValue({ status: 'APPLIED' });
    const token = createToken('ADMINISTRATOR');

    await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Duplicate approval', unitCost: 10 })
      .expect(409);
    expect(mockPrisma.stockLot.create).not.toHaveBeenCalled();
    expect(mockPrisma.binCard.upsert).not.toHaveBeenCalled();
  });

  it('reduces negative discrepancies through FIFO and records the signed adjustment', async () => {
    setupPendingReconciliation(-80);
    mockPrisma.stockLot.findMany.mockResolvedValue([
      {
        id: 'lot-1',
        quantityRemaining: 50,
        unitCost: 10,
        receivedDate: new Date('2026-01-01'),
        createdAt: new Date('2026-01-01'),
        isDepleted: false,
      },
      {
        id: 'lot-2',
        quantityRemaining: 50,
        unitCost: 12,
        receivedDate: new Date('2026-01-02'),
        createdAt: new Date('2026-01-02'),
        isDepleted: false,
      },
    ]);
    mockPrisma.lotConsumption.createMany.mockResolvedValue({ count: 2 });
    const token = createToken('PAO');

    const response = await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Verified shortage' });

    expect(response.status).toBe(200);
    expect(mockPrisma.stockLot.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.stockTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'ADJUSTMENT',
        quantity: -80,
        totalValue: -860,
      }),
    });
    expect(mockPrisma.lotConsumption.createMany).toHaveBeenCalledWith({
      data: [
        { stockLotId: 'lot-1', stockTransactionId: 'adjustment-1', quantityConsumed: 50 },
        { stockLotId: 'lot-2', stockTransactionId: 'adjustment-1', quantityConsumed: 30 },
      ],
    });
    expect(mockPrisma.binCard.upsert).toHaveBeenCalledWith({
      where: {
        inventoryItemId_warehouseId: {
          inventoryItemId: 'item-1',
          warehouseId: 'warehouse-1',
        },
      },
      update: { balance: 20, lastUpdated: expect.any(Date) },
      create: {
        inventoryItemId: 'item-1',
        warehouseId: 'warehouse-1',
        balance: 20,
        lastUpdated: expect.any(Date),
      },
    });
  });

  it('requires unitCost for positive discrepancies and creates a priced adjustment lot', async () => {
    setupPendingReconciliation(8);
    const token = createToken('ADMINISTRATOR');

    await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Verified surplus' })
      .expect(400);
    expect(mockPrisma.stockLot.create).not.toHaveBeenCalled();
    expect(mockPrisma.stockTransaction.create).not.toHaveBeenCalled();
  });

  it('applies a positive discrepancy as a new FIFO-valued lot', async () => {
    setupPendingReconciliation(8);
    mockPrisma.stockLot.create.mockResolvedValue({ id: 'lot-adjustment-1' });
    const token = createToken('ADMINISTRATOR');

    const response = await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Verified surplus', unitCost: 125.5 });

    expect(response.status).toBe(200);
    expect(mockPrisma.stockLot.create).toHaveBeenCalledWith({
      data: {
        inventoryItemId: 'item-1',
        quantityReceived: 8,
        quantityRemaining: 8,
        unitCost: 125.5,
        receivedDate: expect.any(Date),
        isDepleted: false,
      },
    });
    expect(mockPrisma.stockTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'ADJUSTMENT',
        quantity: 8,
        unitCost: 125.5,
        totalValue: 1004,
      }),
    });
    expect(mockPrisma.binCard.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: { balance: 108, lastUpdated: expect.any(Date) },
    }));
  });

  it('rejects stale inventory before applying an adjustment', async () => {
    setupPendingReconciliation(-8, 100);
    mockPrisma.binCard.findUnique.mockResolvedValue({ balance: 99 });
    const token = createToken('PAO');

    await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Verified shortage' })
      .expect(409);
    expect(mockPrisma.stockLot.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.stockTransaction.create).not.toHaveBeenCalled();
    expect(mockPrisma.reconciliation.update).not.toHaveBeenCalled();
  });

  it('handles insufficient FIFO stock without applying reconciliation', async () => {
    setupPendingReconciliation(-80);
    mockPrisma.stockLot.findMany.mockResolvedValue([]);
    const token = createToken('PAO');

    await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Verified shortage' })
      .expect(409);
    expect(mockPrisma.stockLot.update).not.toHaveBeenCalled();
    expect(mockPrisma.stockTransaction.create).not.toHaveBeenCalled();
    expect(mockPrisma.reconciliation.update).not.toHaveBeenCalled();
  });

  it('does not finalize reconciliation when adjustment transaction creation fails', async () => {
    setupPendingReconciliation(8);
    mockPrisma.stockLot.create.mockResolvedValue({ id: 'lot-adjustment-1' });
    mockPrisma.stockTransaction.create.mockRejectedValue(new Error('transaction failed'));
    const token = createToken('PAO');

    await request(app)
      .post('/api/stock-taking/reconciliations/reconciliation-1/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Verified surplus', unitCost: 10 })
      .expect(500);
    expect(mockPrisma.reconciliation.update).not.toHaveBeenCalled();
    expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
  });
});