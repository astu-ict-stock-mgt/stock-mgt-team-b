import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

const findMany = jest.fn<() => Promise<unknown[]>>();
const findUnique = jest.fn<() => Promise<unknown | null>>();
const create = jest.fn<() => Promise<unknown>>();
const update = jest.fn<() => Promise<unknown>>();
const auditLogCreate = jest.fn<() => Promise<unknown>>();

jest.unstable_mockModule('../../src/generated/prisma/client.js', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findMany,
      findUnique,
      create,
      update,
    },
    auditLog: {
      create: auditLogCreate,
    },
  })),
}));

const { default: app } = await import('../../src/app.ts');

const adminToken = jwt.sign(
  { sub: '10000000-0000-4000-8000-000000000001', email: 'admin@example.com', role: 'ADMINISTRATOR' },
  process.env.JWT_SECRET
);

const storekeeperToken = jwt.sign(
  { sub: '20000000-0000-4000-8000-000000000002', email: 'storekeeper@example.com', role: 'STOREKEEPER' },
  process.env.JWT_SECRET
);

const mockUser = {
  id: '30000000-0000-4000-8000-000000000003',
  email: 'john@example.com',
  passwordHash: '$2b$10$hashedpassword',
  firstName: 'John',
  lastName: 'Doe',
  role: 'STOREKEEPER' as const,
  department: 'Warehouse',
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('User Management API (/api/users)', () => {
  beforeEach(() => {
    findMany.mockReset();
    findUnique.mockReset();
    create.mockReset();
    update.mockReset();
    auditLogCreate.mockReset();
  });

  describe('Authentication & RBAC', () => {
    it('returns 401 Unauthorized if token is missing', async () => {
      await request(app).get('/api/users').expect(401);
    });

    it('returns 403 Forbidden if user is not an ADMINISTRATOR', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${storekeeperToken}`)
        .expect(403);
    });
  });

  describe('POST /api/users', () => {
    it('creates a new user and hashes password when requested by Administrator', async () => {
      findUnique.mockResolvedValue(null);
      create.mockResolvedValue({
        ...mockUser,
        id: '40000000-0000-4000-8000-000000000004',
        email: 'newuser@example.com',
      });

      const payload = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'PAO',
        department: 'Property Admin',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.email).toBe('newuser@example.com');
      expect(response.body.data.passwordHash).toBeUndefined();
      expect(create).toHaveBeenCalledTimes(1);
    });

    it('rejects user creation with duplicate email', async () => {
      findUnique.mockResolvedValue(mockUser);

      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: mockUser.email,
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'STOREKEEPER',
        })
        .expect(400);
    });
  });

  describe('GET /api/users', () => {
    it('returns a list of users without passwordHash', async () => {
      findMany.mockResolvedValue([mockUser]);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].passwordHash).toBeUndefined();
      expect(response.body.data[0].email).toBe(mockUser.email);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns user details by ID', async () => {
      findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(mockUser.id);
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('returns 404 if user does not exist', async () => {
      findUnique.mockResolvedValue(null);

      await request(app)
        .get('/api/users/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('updates user role and records audit log', async () => {
      findUnique.mockResolvedValue(mockUser);
      const updatedUserMock = { ...mockUser, role: 'PAO' };
      update.mockResolvedValue(updatedUserMock);

      const response = await request(app)
        .put(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'PAO' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.role).toBe('PAO');
      expect(response.body.data.passwordHash).toBeUndefined();
      expect(auditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: '10000000-0000-4000-8000-000000000001',
            action: 'USER_ROLE_CHANGED',
            entity: 'User',
            entityId: mockUser.id,
            details: { previousRole: 'STOREKEEPER', newRole: 'PAO' },
          }),
        })
      );
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('soft deletes (deactivates) the user', async () => {
      findUnique.mockResolvedValue(mockUser);
      update.mockResolvedValue({ ...mockUser, isActive: false });

      const response = await request(app)
        .delete(`/api/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.isActive).toBe(false);
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: { isActive: false },
        })
      );
    });
  });
});
