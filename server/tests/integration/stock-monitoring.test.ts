import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-jwt-secret';

const mockGetStockLevels = jest.fn<() => Promise<unknown>>();
const mockGetItemStockLevel = jest.fn<() => Promise<unknown>>();
const mockGetStockAlerts = jest.fn<() => Promise<unknown>>();
const mockGetStockSummaryStats = jest.fn<() => Promise<unknown>>();

jest.unstable_mockModule('../../src/modules/stock-monitoring/service.ts', () => ({
  getStockLevels: mockGetStockLevels,
  getItemStockLevel: mockGetItemStockLevel,
  getStockAlerts: mockGetStockAlerts,
  getStockSummaryStats: mockGetStockSummaryStats,
}));

const { default: app } = await import('../../src/app.ts');

describe('Stock Monitoring Integration Tests', () => {
  const createToken = (role: string = 'STOREKEEPER', userId: string = 'user-1') => {
    return jwt.sign(
      { sub: userId, email: 'storekeeper@example.com', role },
      process.env.JWT_SECRET as string
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when token is missing', async () => {
    await request(app).get('/api/stock-monitoring').expect(401);
  });

  it('should return stock levels for authenticated user', async () => {
    const token = createToken('STOREKEEPER');
    mockGetStockLevels.mockResolvedValue({
      critical: [],
      warning: [],
      healthy: [],
      summary: { totalItems: 0, criticalCount: 0, warningCount: 0, healthyCount: 0 },
    });

    const res = await request(app)
      .get('/api/stock-monitoring')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.summary).toBeDefined();
    expect(mockGetStockLevels).toHaveBeenCalledTimes(1);
  });

  it('should return stock alerts for /api/stock-monitoring/alerts', async () => {
    const token = createToken('PAO');
    mockGetStockAlerts.mockResolvedValue([
      { id: 'item-1', name: 'Paper', severity: 'red' },
    ]);

    const res = await request(app)
      .get('/api/stock-monitoring/alerts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(1);
    expect(mockGetStockAlerts).toHaveBeenCalledTimes(1);
  });

  it('should return summary stats for /api/stock-monitoring/summary-stats', async () => {
    const token = createToken('ADMINISTRATOR');
    mockGetStockSummaryStats.mockResolvedValue({
      totalItemsMonitored: 10,
      totalAlerts: 2,
      criticalAlerts: 1,
      warningAlerts: 1,
      outOfStockCount: 0,
      adequateStockCount: 8,
      estimatedReplenishmentCost: 150,
      lastUpdated: new Date().toISOString(),
    });

    const res = await request(app)
      .get('/api/stock-monitoring/summary-stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.stats.totalItemsMonitored).toBe(10);
    expect(mockGetStockSummaryStats).toHaveBeenCalledTimes(1);
  });

  it('should return single item stock level', async () => {
    const token = createToken('STOREKEEPER');
    mockGetItemStockLevel.mockResolvedValue({
      id: 'item-100',
      itemCode: 'SKU-100',
      currentStock: 5,
    });

    const res = await request(app)
      .get('/api/stock-monitoring/item-100')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.id).toBe('item-100');
    expect(mockGetItemStockLevel).toHaveBeenCalledWith('item-100', undefined);
  });
});
