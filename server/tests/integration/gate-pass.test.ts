import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const requisitionFindMany = jest.fn<() => Promise<unknown[]>>();
const requisitionFindFirst = jest.fn<() => Promise<unknown | null>>();
const grnFindMany = jest.fn<() => Promise<unknown[]>>();
const grnFindFirst = jest.fn<() => Promise<unknown | null>>();
const auditLogFindMany = jest.fn<() => Promise<unknown[]>>();
const auditLogFindFirst = jest.fn<() => Promise<unknown | null>>();
const auditLogCreate = jest.fn<() => Promise<unknown>>();
const auditLogCount = jest.fn<() => Promise<number>>();
const userFindUnique = jest.fn<() => Promise<unknown | null>>();
const disconnect = jest.fn<() => Promise<void>>();

jest.unstable_mockModule('../../src/generated/prisma/client.js', () => ({
  PrismaClient: jest.fn(() => ({
    requisition: {
      findMany: requisitionFindMany,
      findFirst: requisitionFindFirst,
    },
    goodsReceivingNote: {
      findMany: grnFindMany,
      findFirst: grnFindFirst,
    },
    auditLog: {
      findMany: auditLogFindMany,
      findFirst: auditLogFindFirst,
      create: auditLogCreate,
      count: auditLogCount,
    },
    user: {
      findUnique: userFindUnique,
    },
    $disconnect: disconnect,
  })),
  Prisma: {},
}));

const { default: app } = await import('../../src/app.ts');

const securityToken = jwt.sign(
  {
    sub: 'sec-0000-0000-0000-000000000001',
    email: 'security@example.com',
    role: 'SECURITY_OFFICER',
  },
  process.env.JWT_SECRET as string
);

const adminToken = jwt.sign(
  {
    sub: 'admin-0000-0000-0000-000000000001',
    email: 'admin@example.com',
    role: 'ADMINISTRATOR',
  },
  process.env.JWT_SECRET as string
);

const storekeeperToken = jwt.sign(
  {
    sub: 'store-0000-0000-0000-000000000001',
    email: 'storekeeper@example.com',
    role: 'STOREKEEPER',
  },
  process.env.JWT_SECRET as string
);

const accountantToken = jwt.sign(
  {
    sub: 'acc-0000-0000-0000-000000000001',
    email: 'accountant@example.com',
    role: 'ACCOUNTANT',
  },
  process.env.JWT_SECRET as string
);

describe('Gate Pass & Security Clearance Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/gate-pass/pending-outbound', () => {
    it('returns pending outbound SIV dispatches for SECURITY_OFFICER', async () => {
      requisitionFindMany.mockResolvedValue([
        {
          id: 'req-1',
          sivNumber: 'SIV-2026-0001',
          requisitionNumber: 'REQ-2026-0001',
          status: 'ISSUED',
          department: 'IT Department',
          issuedAt: new Date(),
          updatedAt: new Date(),
          requester: { firstName: 'Solomon', lastName: 'Girma' },
          issuer: { firstName: 'Almaz', lastName: 'Ayana' },
          items: [
            {
              quantityRequested: 5,
              inventoryItem: {
                itemCode: 'IT-001',
                name: 'Laptop Dell Latitude',
                warehouse: { name: 'Main IT Store' },
              },
            },
          ],
        },
      ] as any);

      auditLogFindMany.mockResolvedValue([] as any);

      const res = await request(app)
        .get('/api/gate-pass/pending-outbound')
        .set('Authorization', `Bearer ${securityToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].referenceNumber).toBe('SIV-2026-0001');
      expect(res.body[0].departmentOrDestination).toBe('IT Department');
      expect(res.body[0].status).toBe('READY_FOR_EXIT');
    });

    it('returns 403 Forbidden for unauthorized role (ACCOUNTANT)', async () => {
      const res = await request(app)
        .get('/api/gate-pass/pending-outbound')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/gate-pass/pending-inbound', () => {
    it('returns incoming supplier deliveries awaiting entry clearance', async () => {
      grnFindMany.mockResolvedValue([
        {
          id: 'grn-1',
          grnNumber: 'GRN-2026-0042',
          receivedDate: new Date(),
          supplier: { name: 'Ethio Telecom Supplies' },
          warehouse: { name: 'Central Warehouse' },
          user: { firstName: 'Almaz', lastName: 'Ayana' },
          items: [
            {
              quantity: 20,
              inventoryItem: {
                itemCode: 'NET-01',
                name: 'Cat6 Ethernet Cables',
              },
            },
          ],
        },
      ] as any);

      auditLogFindMany.mockResolvedValue([] as any);

      const res = await request(app)
        .get('/api/gate-pass/pending-inbound')
        .set('Authorization', `Bearer ${securityToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].grnNumber).toBe('GRN-2026-0042');
      expect(res.body[0].supplierName).toBe('Ethio Telecom Supplies');
      expect(res.body[0].status).toBe('READY_FOR_ENTRY');
    });
  });

  describe('POST /api/gate-pass/clear-outbound', () => {
    it('creates an official Gate Pass with GP number and clearance audit record', async () => {
      userFindUnique.mockResolvedValue({
        id: 'sec-0000-0000-0000-000000000001',
        firstName: 'Mulugeta',
        lastName: 'Chala',
        email: 'security@example.com',
        role: 'SECURITY_OFFICER',
      } as any);

      requisitionFindFirst.mockResolvedValue({
        id: 'req-1',
        sivNumber: 'SIV-2026-0001',
        items: [
          {
            quantityRequested: 5,
            inventoryItem: {
              itemCode: 'IT-001',
              name: 'Laptop Dell Latitude',
              warehouse: { name: 'Main IT Store' },
            },
          },
        ],
      } as any);

      auditLogCount.mockResolvedValue(0);
      auditLogCreate.mockResolvedValue({
        id: 'log-gate-pass-1',
      } as any);

      const res = await request(app)
        .post('/api/gate-pass/clear-outbound')
        .set('Authorization', `Bearer ${securityToken}`)
        .send({
          referenceNumber: 'SIV-2026-0001',
          vehiclePlate: '3-A-12345',
          driverName: 'Abebe Bekele',
          destination: 'Campus Lab 4',
          remarks: 'All serial numbers checked against voucher',
        });

      expect(res.status).toBe(201);
      expect(res.body.passNumber).toBe(`GP-${new Date().getFullYear()}-0001`);
      expect(res.body.direction).toBe('OUTBOUND');
      expect(res.body.vehiclePlate).toBe('3-A-12345');
      expect(res.body.driverName).toBe('Abebe Bekele');
      expect(res.body.status).toBe('CLEARED');
      expect(res.body.officer.name).toBe('Mulugeta Chala');

      expect(auditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'GATE_PASS_EXIT_CLEARED',
            entity: 'GatePass',
          }),
        })
      );
    });

    it('rejects with 400 when missing required vehiclePlate or driverName', async () => {
      const res = await request(app)
        .post('/api/gate-pass/clear-outbound')
        .set('Authorization', `Bearer ${securityToken}`)
        .send({
          referenceNumber: 'SIV-2026-0001',
          // missing vehiclePlate and driverName
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/gate-pass/flag', () => {
    it('flags a shipment with reason and saves hold audit record', async () => {
      userFindUnique.mockResolvedValue({
        id: 'sec-0000-0000-0000-000000000001',
        firstName: 'Mulugeta',
        lastName: 'Chala',
        email: 'security@example.com',
      } as any);

      auditLogCount.mockResolvedValue(2);
      auditLogCreate.mockResolvedValue({ id: 'log-hold-1' } as any);

      const res = await request(app)
        .post('/api/gate-pass/flag')
        .set('Authorization', `Bearer ${securityToken}`)
        .send({
          referenceNumber: 'SIV-2026-0001',
          referenceType: 'SIV',
          reason: 'Item count physical (4) differs from SIV voucher (5)',
          vehiclePlate: '3-B-54321',
          driverName: 'Chala Tadesse',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('FLAGGED');
      expect(res.body.reason).toContain('Item count physical');
      expect(auditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'GATE_PASS_FLAGGED',
          }),
        })
      );
    });
  });

  describe('GET /api/gate-pass/verify/:reference', () => {
    it('verifies an authorized SIV voucher and returns items breakdown', async () => {
      auditLogFindFirst.mockResolvedValue(null);
      requisitionFindFirst.mockResolvedValue({
        id: 'req-1',
        sivNumber: 'SIV-2026-0001',
        requisitionNumber: 'REQ-2026-0001',
        status: 'ISSUED',
        department: 'Engineering',
        requester: { firstName: 'Dawit', lastName: 'Kebede' },
        approver: { firstName: 'PAO', lastName: 'Officer' },
        issuer: { firstName: 'Store', lastName: 'Keeper' },
        items: [
          {
            quantityRequested: 10,
            inventoryItem: {
              itemCode: 'ENG-01',
              name: 'Oscilloscope',
              warehouse: { name: 'Lab Store' },
            },
          },
        ],
      } as any);

      const res = await request(app)
        .get('/api/gate-pass/verify/SIV-2026-0001')
        .set('Authorization', `Bearer ${securityToken}`);

      expect(res.status).toBe(200);
      expect(res.body.found).toBe(true);
      expect(res.body.authorized).toBe(true);
      expect(res.body.status).toBe('READY_FOR_EXIT');
      expect(res.body.document.sivNumber).toBe('SIV-2026-0001');
    });

    it('returns unauthorized status for unknown reference number', async () => {
      auditLogFindFirst.mockResolvedValue(null);
      requisitionFindFirst.mockResolvedValue(null);
      grnFindFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/gate-pass/verify/UNKNOWN-REF-999')
        .set('Authorization', `Bearer ${securityToken}`);

      expect(res.status).toBe(200);
      expect(res.body.found).toBe(false);
      expect(res.body.authorized).toBe(false);
      expect(res.body.status).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/gate-pass/history', () => {
    it('returns gate pass clearance history', async () => {
      auditLogFindMany.mockResolvedValue([
        {
          id: 'log-1',
          entityId: 'GP-2026-0001',
          action: 'GATE_PASS_EXIT_CLEARED',
          createdAt: new Date(),
          user: { id: 'u-1', firstName: 'Mulugeta', lastName: 'Chala', email: 'sec@ex.com' },
          details: {
            passNumber: 'GP-2026-0001',
            direction: 'OUTBOUND',
            referenceType: 'SIV',
            referenceNumber: 'SIV-2026-0001',
            vehiclePlate: '3-A-12345',
            driverName: 'Abebe Bekele',
            status: 'CLEARED',
            itemsCount: 5,
          },
        },
      ] as any);

      const res = await request(app)
        .get('/api/gate-pass/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].passNumber).toBe('GP-2026-0001');
      expect(res.body[0].status).toBe('CLEARED');
    });
  });
});

