import request from 'supertest';
import { createApp } from '../index';
import { initializeDatabase } from '../database/init';

describe('Koa Application', () => {
  let app: any;

  beforeAll(async () => {
    // Initialize test database
    await initializeDatabase();
    app = createApp().callback();
  });

  describe('Health Check', () => {
    it('應該回傳健康狀態', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          environment: expect.any(String),
          version: expect.any(String),
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('CORS Headers', () => {
    it('應該包含 CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      // CORS headers should be present when origin is set
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('應該處理 OPTIONS 請求', async () => {
      await request(app).options('/auth/register').expect(204);
    });
  });

  describe('Error Handling', () => {
    it('應該回傳 404 對於不存在的路由', async () => {
      const response = await request(app).get('/nonexistent').expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: expect.stringContaining('Route GET /nonexistent not found'),
        },
        timestamp: expect.any(String),
      });
    });

    it('應該處理無效的 JSON', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(500); // Error handler catches and returns 500

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
      });
    });
  });

  describe('Route Integration', () => {
    it('應該可以存取認證路由', async () => {
      // Test registration endpoint exists (will fail validation but route exists)
      const response = await request(app)
        .post('/auth/register')
        .send({})
        .expect(400); // Validation error, but route exists

      expect(response.body.success).toBe(false);
    });

    it('應該可以存取服務路由', async () => {
      const response = await request(app).get('/services').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        timestamp: expect.any(String),
      });
    });
  });

  describe('Middleware Integration', () => {
    it('應該解析 JSON body', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('應該記錄請求', async () => {
      // This test verifies that the logging middleware doesn't break the request
      const response = await request(app).get('/health').expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Security Headers', () => {
    it('應該不暴露敏感的伺服器資訊', async () => {
      const response = await request(app).get('/health').expect(200);

      // Should not expose server technology details
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });
});
