import request from 'supertest';
// Adjust the app path below to match your main Express app entry configuration
import app from '../../src/app.ts'; 

describe('Auth Module Integration Tests (P0)', () => {
  it('should return 200 OK and a signed JWT for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should return 401 Unauthorized for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });
});
