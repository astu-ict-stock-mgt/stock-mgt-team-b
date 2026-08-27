import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const supplierFindMany = jest.fn<() => Promise<unknown[]>>();
const supplierFindUnique = jest.fn<() => Promise<unknown | null>>();
const supplierCreate = jest.fn<() => Promise<unknown>>();
const supplierUpdate = jest.fn<() => Promise<unknown>>();
const supplierDelete = jest.fn<() => Promise<unknown>>();
const stockTransactionCount = jest.fn<() => Promise<number>>();
const goodsReceivingNoteCount = jest.fn<() => Promise<number>>();
const disconnect = jest.fn<() => Promise<void>>();

jest.unstable_mockModule('../../src/generated/prisma/client.js', () => ({
  PrismaClient: jest.fn(() => ({
    supplier: {
      findMany: supplierFindMany,
      findUnique: supplierFindUnique,
      create: supplierCreate,
      update: supplierUpdate,
      delete: supplierDelete,
    },
    stockTransaction: {
      count: stockTransactionCount,
    },
    goodsReceivingNote: {
      count: goodsReceivingNoteCount,
    },
    $disconnect: disconnect,
  })),
}));

const { default: app } = await import('../../src/app.ts');

const administratorToken = jwt.sign(
  {
    sub: '10000000-0000-4000-8000-000000000001',
    email: 'admin@example.com',
    role: 'ADMINISTRATOR',
  },
  process.env.JWT_SECRET as string
);

const paoToken = jwt.sign(
  {
    sub: '20000000-0000-4000-8000-000000000002',
    email: 'pao@example.com',
    role: 'PAO',
  },
  process.env.JWT_SECRET as string
);

const storekeeperToken = jwt.sign(
  {
    sub: '30000000-0000-4000-8000-000000000003',
    email: 'storekeeper@example.com',
    role: 'STOREKEEPER',
  },
  process.env.JWT_SECRET as string
);

const supplier = {
  id: '40000000-0000-4000-8000-000000000004',
  name: 'Acme Supplies',
  contactName: 'Amina Ali',
  phone: '+254700000000',
  email: 'amina@acme.example',
  address: 'Nairobi',
  isActive: true,
  createdAt: new Date('2026-08-26T00:00:00.000Z'),
  updatedAt: new Date('2026-08-26T00:00:00.000Z'),
};

describe('Supplier Management API (/api/suppliers)', () => {
  beforeEach(() => {
    supplierFindMany.mockReset();
    supplierFindUnique.mockReset();
    supplierCreate.mockReset();
    supplierUpdate.mockReset();
    supplierDelete.mockReset();
    stockTransactionCount.mockReset();
    goodsReceivingNoteCount.mockReset();
    disconnect.mockReset();
  });

  it('requires authentication to search suppliers', async () => {
    await request(app).get('/api/suppliers').expect(401);
  });

  it('creates a supplier when requested by a PAO', async () => {
    supplierCreate.mockResolvedValue(supplier);

    const response = await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${paoToken}`)
      .send({
        name: 'Acme Supplies',
        contactName: 'Amina Ali',
        phone: '+254700000000',
        email: 'amina@acme.example',
        address: 'Nairobi',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      status: 'success',
      data: { id: supplier.id, name: supplier.name },
    });
    expect(supplierCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: supplier.name }),
    });
  });

  it('validates the supplier name before creation', async () => {
    await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${administratorToken}`)
      .send({ contactName: 'Amina Ali' })
      .expect(400);

    expect(supplierCreate).not.toHaveBeenCalled();
  });

  it('does not allow storekeepers to create or update suppliers', async () => {
    await request(app)
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${storekeeperToken}`)
      .send({ name: supplier.name })
      .expect(403);

    await request(app)
      .put(`/api/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${storekeeperToken}`)
      .send({ name: 'Updated Supplies' })
      .expect(403);
  });

  it('searches suppliers by name or contact person', async () => {
    supplierFindMany.mockResolvedValue([supplier]);

    const response = await request(app)
      .get('/api/suppliers?search=amina')
      .set('Authorization', `Bearer ${storekeeperToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'success',
      data: [{ id: supplier.id }],
    });
    expect(supplierFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'amina', mode: 'insensitive' } },
          { contactName: { contains: 'amina', mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  });

  it('returns a supplier by ID for receiving staff', async () => {
    supplierFindUnique.mockResolvedValue(supplier);

    const response = await request(app)
      .get(`/api/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${storekeeperToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'success',
      data: { id: supplier.id, name: supplier.name },
    });
  });

  it('updates supplier details when requested by an administrator', async () => {
    supplierFindUnique.mockResolvedValue(supplier);
    supplierUpdate.mockResolvedValue({ ...supplier, phone: '+254711111111' });

    const response = await request(app)
      .put(`/api/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${administratorToken}`)
      .send({ phone: '+254711111111' })
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'success',
      data: { id: supplier.id, phone: '+254711111111' },
    });
    expect(supplierUpdate).toHaveBeenCalledWith({
      where: { id: supplier.id },
      data: { phone: '+254711111111' },
    });
  });

  it('deactivates a supplier with linked stock transactions', async () => {
    supplierFindUnique.mockResolvedValue(supplier);
    stockTransactionCount.mockResolvedValue(1);
    goodsReceivingNoteCount.mockResolvedValue(0);
    supplierUpdate.mockResolvedValue({ ...supplier, isActive: false });

    const response = await request(app)
      .delete(`/api/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${administratorToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'success',
      message: 'Supplier deactivated because it has stock history',
      data: { id: supplier.id, isActive: false },
    });
    expect(supplierUpdate).toHaveBeenCalledWith({
      where: { id: supplier.id },
      data: { isActive: false },
    });
    expect(supplierDelete).not.toHaveBeenCalled();
  });

  it('deactivates a supplier linked to a goods receiving note', async () => {
    supplierFindUnique.mockResolvedValue(supplier);
    stockTransactionCount.mockResolvedValue(0);
    goodsReceivingNoteCount.mockResolvedValue(1);
    supplierUpdate.mockResolvedValue({ ...supplier, isActive: false });

    await request(app)
      .delete(`/api/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${paoToken}`)
      .expect(200);

    expect(supplierUpdate).toHaveBeenCalledWith({
      where: { id: supplier.id },
      data: { isActive: false },
    });
    expect(supplierDelete).not.toHaveBeenCalled();
  });

  it('hard deletes a supplier that has no stock history', async () => {
    supplierFindUnique.mockResolvedValue(supplier);
    stockTransactionCount.mockResolvedValue(0);
    goodsReceivingNoteCount.mockResolvedValue(0);
    supplierDelete.mockResolvedValue(supplier);

    const response = await request(app)
      .delete(`/api/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${administratorToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'success',
      message: 'Supplier deleted successfully',
      data: { id: supplier.id },
    });
    expect(supplierDelete).toHaveBeenCalledWith({ where: { id: supplier.id } });
  });
});
