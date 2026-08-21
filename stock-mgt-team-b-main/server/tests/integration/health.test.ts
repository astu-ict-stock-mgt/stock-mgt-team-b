import request from 'supertest';
import app from '../../src/app.ts';

describe('GET /api/health', () => {
  it('responds with ok status', async () => {
    const res = await request(app).get('/api/health').expect(200);

    expect(res.body).toEqual({
      status: 'ok',
      message: 'API is running',
    });
  });

  it('returns 404 for unknown routes', async () => {
    await request(app).get('/api/does-not-exist').expect(404);
  });
});
