import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const password = 'correct-horse-battery-staple';
const user = {
  id: 'user-1',
  email: 'admin@example.com',
  passwordHash: await bcrypt.hash(password, 10),
  firstName: 'Ada',
  lastName: 'Admin',
  role: 'ADMINISTRATOR' as const,
  department: null,
};
const findUnique = jest.fn<() => Promise<typeof user | null>>();

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

jest.unstable_mockModule('../../src/generated/prisma/client.js', () => ({
  PrismaClient: jest.fn(() => ({ user: { findUnique } })),
  Prisma: {},
}));

const { default: app } = await import('../../src/app.ts');
const { requireAuth, requireRole } = await import('../../src/middlewares/rbac.ts');
const { errorHandler } = await import('../../src/middlewares/errorHandler.ts');

const protectedApp = express();
protectedApp.get('/protected', requireAuth, (_req, res) => res.sendStatus(204));
protectedApp.get('/administrator-only', requireAuth, requireRole('ADMINISTRATOR'), (_req, res) =>
  res.sendStatus(204)
);
protectedApp.use(errorHandler);

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it('returns a signed JWT for valid credentials', async () => {
    findUnique.mockResolvedValue(user);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password })
      .expect(200);

    expect(jwt.verify(response.body.token, process.env.JWT_SECRET as string)).toMatchObject({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    expect(response.body.user).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
    });
  });

  it('rejects invalid credentials', async () => {
    findUnique.mockResolvedValue(user);

    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401);
  });
});

describe('authentication and role middleware', () => {
  it('rejects missing and invalid bearer tokens', async () => {
    await request(protectedApp).get('/protected').expect(401);
    await request(protectedApp).get('/protected').set('Authorization', 'Bearer invalid').expect(401);
  });

  it('blocks authenticated users without the required role', async () => {
    const token = jwt.sign(
      { sub: 'user-2', email: 'clerk@example.com', role: 'STOCK_CLERK' },
      process.env.JWT_SECRET as string
    );

    await request(protectedApp)
      .get('/administrator-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
