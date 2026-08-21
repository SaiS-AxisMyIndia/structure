const request = require('supertest');
const app = require('../../src/app');

describe('Auth routes', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should return 201 on successful registration', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
