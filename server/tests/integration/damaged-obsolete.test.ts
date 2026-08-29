import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-jwt-secret';

const mockCreateWriteOff = jest.fn<() => Promise<unknown>>();
const mockGetWriteOffs = jest.fn<() => Promise<unknown>>();
const mockGetWriteOffById = jest.fn<() => Promise<unknown>>();
const mockApproveWriteOff = jest.fn<() => Promise<unknown>>();
const mockRejectWriteOff = jest.fn<() => Promise<unknown>>();
const mockDisposeWriteOff = jest.fn<() => Promise<unknown>>();

jest.unstable_mockModule('../../src/modules/damaged-obsolete/service.ts', () => ({
  createWriteOff: mockCreateWriteOff,
  getWriteOffs: mockGetWriteOffs,
  getWriteOffById: mockGetWriteOffById,
  approveWriteOff: mockApproveWriteOff,
  rejectWriteOff: mockRejectWriteOff,
  disposeWriteOff: mockDisposeWriteOff,
}));

const { default: app } = await import('../../src/app.ts');

describe('Damaged/Obsolete Write-Offs Integration Tests', () => {
  const createToken = (role: string = 'STOREKEEPER', userId: string = 'user-1') => {
    return jwt.sign(
      { sub: userId, email: 'storekeeper@example.com', role },
      process.env.JWT_SECRET as string
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when unauthenticated', async () => {
    await request(app).get('/api/write-off').expect(401);
  });

  it('should create write-off request when input is valid', async () => {
    const token = createToken('STOREKEEPER', 'usr-1');
    mockCreateWriteOff.mockResolvedValue({
      id: 'wo-1',
      itemId: 'item-1',
      quantity: 5,
      reasonCode: 'DAMAGED',
      status: 'PENDING',
    });

    const res = await request(app)
      .post('/api/write-off')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: 'item-1',
        quantity: 5,
        reasonCode: 'DAMAGED',
        notes: 'Water damaged',
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data.id).toBe('wo-1');
    expect(mockCreateWriteOff).toHaveBeenCalledTimes(1);
  });

  it('should return list of write-offs', async () => {
    const token = createToken('PAO');
    mockGetWriteOffs.mockResolvedValue([
      { id: 'wo-1', status: 'PENDING' },
    ]);

    const res = await request(app)
      .get('/api/write-off')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(1);
  });

  it('should approve write-off request', async () => {
    const validUuid = '10000000-0000-4000-8000-000000000001';
    const token = createToken('PAO', 'pao-user-1');
    mockApproveWriteOff.mockResolvedValue({
      id: validUuid,
      status: 'APPROVED',
    });

    const res = await request(app)
      .put(`/api/write-off/${validUuid}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('APPROVED');
    expect(mockApproveWriteOff).toHaveBeenCalledWith(validUuid, 'pao-user-1');
  });

  it('should reject write-off request', async () => {
    const validUuid = '10000000-0000-4000-8000-000000000002';
    const token = createToken('ADMINISTRATOR', 'admin-1');
    mockRejectWriteOff.mockResolvedValue({
      id: validUuid,
      status: 'REJECTED',
    });

    const res = await request(app)
      .put(`/api/write-off/${validUuid}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Insufficient evidence' })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('REJECTED');
    expect(mockRejectWriteOff).toHaveBeenCalledWith(validUuid, 'admin-1', 'Insufficient evidence');
  });

  it('should dispose write-off request and update inventory', async () => {
    const validUuid = '10000000-0000-4000-8000-000000000003';
    const token = createToken('STOREKEEPER', 'storekeeper-1');
    mockDisposeWriteOff.mockResolvedValue({
      id: validUuid,
      status: 'DISPOSED',
    });

    const res = await request(app)
      .put(`/api/write-off/${validUuid}/dispose`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('DISPOSED');
    expect(mockDisposeWriteOff).toHaveBeenCalledWith(validUuid, 'storekeeper-1');
  });
});
