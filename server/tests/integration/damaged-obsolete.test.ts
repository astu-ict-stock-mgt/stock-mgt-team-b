import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const itemFindUnique = jest.fn<() => Promise<unknown | null>>();
const writeOffCreate = jest.fn<() => Promise<unknown>>();
const writeOffFindMany = jest.fn<() => Promise<unknown[]>>();
const writeOffFindUnique = jest.fn<() => Promise<unknown | null>>();
const writeOffUpdate = jest.fn<() => Promise<unknown>>();
const disconnect = jest.fn<() => Promise<void>>();

jest.unstable_mockModule('../../src/generated/prisma/client.js', () => ({
  PrismaClient: jest.fn(() => ({
    inventoryItem: {
      findUnique: itemFindUnique,
    },
    writeOffRequest: {
      create: writeOffCreate,
      findMany: writeOffFindMany,
      findUnique: writeOffFindUnique,
      update: writeOffUpdate,
    },
    $disconnect: disconnect,
  })),
  Prisma: {},
}));

const { default: app } = await import('../../src/app.ts');

const adminToken = jwt.sign(
  { sub: '10000000-0000-4000-8000-000000000001', email: 'admin@example.com', role: 'ADMINISTRATOR' },
  process.env.JWT_SECRET as string
);

const storekeeperToken = jwt.sign(
  { sub: '20000000-0000-4000-8000-000000000002', email: 'storekeeper@example.com', role: 'STOREKEEPER' },
  process.env.JWT_SECRET as string
);

const paoToken = jwt.sign(
  { sub: '30000000-0000-4000-8000-000000000003', email: 'pao@example.com', role: 'PAO' },
  process.env.JWT_SECRET as string
);

const accountantToken = jwt.sign(
  { sub: '40000000-0000-4000-8000-000000000004', email: 'accountant@example.com', role: 'ACCOUNTANT' },
  process.env.JWT_SECRET as string
);

describe('Damaged and Obsolete Write-Off Module Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/write-off', () => {
    it('creates write-off request successfully for storekeeper', async () => {
      itemFindUnique.mockResolvedValue({ id: 'item-1', name: 'Cable' } as any);
      writeOffCreate.mockResolvedValue({
        id: 'wo-1',
        itemId: 'item-1',
        quantity: 5,
        reasonCode: 'DAMAGED',
        reasonDescription: 'Broken connector',
        status: 'PENDING',
        requestedBy: 'storekeeper-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        item: { name: 'Cable' },
        requester: { firstName: 'Store', lastName: 'Keeper' },
      } as any);

      const response = await request(app)
        .post('/api/write-off')
        .set('Authorization', `Bearer ${storekeeperToken}`)
        .send({
          itemId: 'item-1',
          quantity: 5,
          reasonCode: 'DAMAGED',
          reasonDescription: 'Broken connector',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'wo-1');
      expect(response.body).toHaveProperty('status', 'PENDING');
      expect(response.body).toHaveProperty('itemName', 'Cable');
    });

    it('rejects creation if item does not exist', async () => {
      itemFindUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/write-off')
        .set('Authorization', `Bearer ${storekeeperToken}`)
        .send({
          itemId: 'invalid-item',
          quantity: 5,
          reasonCode: 'DAMAGED',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/write-off', () => {
    it('returns list of write-off requests', async () => {
      writeOffFindMany.mockResolvedValue([
        {
          id: 'wo-1',
          itemId: 'item-1',
          quantity: 5,
          reasonCode: 'DAMAGED',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
          item: { name: 'Cable' },
          requester: { firstName: 'Store', lastName: 'Keeper' },
        },
      ] as any);

      const response = await request(app)
        .get('/api/write-off')
        .set('Authorization', `Bearer ${storekeeperToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });
  });

  describe('PUT /api/write-off/:id/approve', () => {
    it('approves write-off request when called by PAO', async () => {
      writeOffFindUnique.mockResolvedValue({
        id: 'wo-1',
        status: 'PENDING',
      } as any);

      writeOffUpdate.mockResolvedValue({
        id: 'wo-1',
        itemId: 'item-1',
        quantity: 5,
        reasonCode: 'DAMAGED',
        status: 'APPROVED',
        requestedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        item: { name: 'Cable' },
        requester: { firstName: 'Store', lastName: 'Keeper' },
        approver: { firstName: 'Chief', lastName: 'PAO' },
      } as any);

      const response = await request(app)
        .put('/api/write-off/wo-1/approve')
        .set('Authorization', `Bearer ${paoToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'APPROVED');
    });

    it('forbids approval by non-authorized roles (ACCOUNTANT)', async () => {
      const response = await request(app)
        .put('/api/write-off/wo-1/approve')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(403);
    });
  });
});
