import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import express, { Request, Response } from 'express';

// Set env vars
process.env.JWT_SECRET = 'test-jwt-secret';

const mockCreateAuditLog = jest.fn<() => Promise<unknown>>();
const mockGetAuditLogs = jest.fn<() => Promise<unknown>>();

jest.unstable_mockModule('../../src/modules/audit-log/service.ts', () => ({
  createAuditLog: mockCreateAuditLog,
  getAuditLogs: mockGetAuditLogs,
}));

const { default: app } = await import('../../src/app.ts');
const { auditLogger } = await import('../../src/middlewares/auditLogger.ts');

describe('Audit Log Middleware & API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should intercept POST requests and create an audit log', async () => {
    const req = {
      method: 'POST',
      baseUrl: '/api/dummy',
      path: '/',
      body: { someData: 'test', password: 'secretpassword' },
      originalUrl: '/api/dummy',
      user: { id: 'user-1' },
      params: {}
    } as unknown as Request;

    let finishCb: () => void = () => {};
    const res = {
      statusCode: 201,
      on: jest.fn((event, cb) => {
        if (event === 'finish') finishCb = cb as () => void;
      }),
    } as unknown as Response;

    const next = jest.fn();

    mockCreateAuditLog.mockResolvedValue({});

    auditLogger(req, res, next);

    // Simulate response finish
    finishCb();

    // Wait a brief tick for async promises in the callback to flush
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockCreateAuditLog).toHaveBeenCalledTimes(1);
    expect(mockCreateAuditLog).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'CREATE',
      entity: 'dummy',
      entityId: undefined,
      details: expect.objectContaining({
        someData: 'test',
        method: 'POST',
        statusCode: 201,
      }),
    });

    // Check that sensitive fields are scrubbed
    expect(mockCreateAuditLog.mock.calls[0][0].details.password).toBeUndefined();
  });

  it('should require ADMINISTRATOR role to fetch audit logs', async () => {
    const createToken = (role: string = 'STOREKEEPER', userId: string = 'user-1') => {
      return jwt.sign(
        { sub: userId, email: 'test@example.com', role },
        process.env.JWT_SECRET as string
      );
    };
    const token = createToken('STOREKEEPER'); // not admin

    await request(app)
      .get('/api/audit-log')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should fetch audit logs if ADMINISTRATOR', async () => {
    const createToken = (role: string = 'STOREKEEPER', userId: string = 'user-1') => {
      return jwt.sign(
        { sub: userId, email: 'test@example.com', role },
        process.env.JWT_SECRET as string
      );
    };
    const token = createToken('ADMINISTRATOR');
    mockGetAuditLogs.mockResolvedValue([{ id: 'log-1' }]);

    const res = await request(app)
      .get('/api/audit-log')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data).toEqual([{ id: 'log-1' }]);
    expect(mockGetAuditLogs).toHaveBeenCalledTimes(1);
  });
});
