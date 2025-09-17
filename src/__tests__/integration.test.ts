import request from 'supertest';
import { createApp } from '../index';
import { AppRoutes } from '../routes/app-routes';
import { initializeDatabase } from '../database/init';

describe('Integration Tests - Task 10 Verification', () => {
  let app: any;
  let appRoutes: AppRoutes;

  beforeAll(async () => {
    // Initialize test database
    await initializeDatabase();
    app = createApp().callback();
    appRoutes = new AppRoutes();
  });

  describe('1. 建立路由設定檔案，定義所有 API 端點', () => {
    it('應該有完整的路由設定檔案', () => {
      const routeInfo = appRoutes.getRouteInfo();

      // Should have auth and service route groups
      expect(routeInfo).toHaveLength(2);

      // Check auth routes
      const authRoutes = routeInfo.find(r => r.prefix === '/auth');
      expect(authRoutes).toBeDefined();
      expect(authRoutes?.routes).toHaveLength(2);

      // Check service routes
      const serviceRoutes = routeInfo.find(r => r.prefix === '/services');
      expect(serviceRoutes).toBeDefined();
      expect(serviceRoutes?.routes).toHaveLength(5);
    });

    it('應該定義所有必要的 API 端點', async () => {
      // Test all endpoints exist and return appropriate responses

      // Auth endpoints
      await request(app).post('/auth/register').expect(400); // Validation error but route exists
      await request(app).post('/auth/login').expect(400); // Validation error but route exists

      // Service endpoints (public)
      await request(app).get('/services').expect(200);
      await request(app).get('/services/test-id').expect(400); // Invalid UUID format

      // Service endpoints (protected) - should return 401 without auth
      await request(app).post('/services').expect(401);
      await request(app).put('/services/test-id').expect(401);
      await request(app).delete('/services/test-id').expect(401);
    });
  });

  describe('2. 設定 Koa 應用程式主檔案', () => {
    it('應該正確建立 Koa 應用程式', () => {
      expect(app).toBeDefined();
    });

    it('應該有健康檢查端點', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          timestamp: expect.any(String),
          environment: expect.any(String),
          version: expect.any(String),
        },
      });
    });

    it('應該處理 404 錯誤', async () => {
      const response = await request(app).get('/nonexistent').expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND_ERROR',
          message: expect.stringContaining('not found'),
        },
      });
    });
  });

  describe('3. 整合所有中介軟體到 Koa 應用程式', () => {
    it('應該整合錯誤處理中介軟體', async () => {
      const response = await request(app).get('/nonexistent').expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(Object),
        timestamp: expect.any(String),
      });
    });

    it('應該整合 CORS 中介軟體', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('應該整合 body parser 中介軟體', async () => {
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

    it('應該整合請求日誌中介軟體', async () => {
      // This middleware logs requests but doesn't affect response
      const response = await request(app).get('/health').expect(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('4. 設定路由中介軟體和控制器', () => {
    it('應該正確連接認證控制器', async () => {
      // Test that auth controller is properly connected
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'password123',
          name: 'Test User 2',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          email: 'test2@example.com',
          name: 'Test User 2',
        }),
      });
    });

    it('應該正確連接服務控制器', async () => {
      const response = await request(app).get('/services').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });
    });

    it('應該正確套用驗證中介軟體', async () => {
      // Test validation middleware is applied
      const response = await request(app)
        .post('/auth/register')
        .send({}) // Empty body should trigger validation error
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('應該正確套用 JWT 認證中介軟體', async () => {
      // Test JWT middleware is applied to protected routes
      const response = await request(app)
        .post('/services')
        .send({
          name: 'Test Service',
          price: 1000,
        })
        .expect(401); // Should require authentication

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
        },
      });
    });
  });

  describe('5. 實作應用程式啟動邏輯', () => {
    it('應該可以建立應用程式實例', () => {
      const testApp = createApp();
      expect(testApp).toBeDefined();
      expect(typeof testApp.listen).toBe('function');
    });

    it('應該正確匯出 createApp 函數', () => {
      const { createApp: importedCreateApp } = require('../index');
      expect(typeof importedCreateApp).toBe('function');
    });

    it('應該有 ServerManager 類別', () => {
      const { ServerManager } = require('../server');
      expect(ServerManager).toBeDefined();
      expect(typeof ServerManager).toBe('function');
    });
  });

  describe('完整功能驗證', () => {
    it('應該支援完整的使用者註冊和登入流程', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          email: 'integration@example.com',
          password: 'password123',
          name: 'Integration Test User',
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);

      // Login user
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'integration@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();
    });

    it('應該支援完整的服務管理流程', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'integration@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // Create service
      const createResponse = await request(app)
        .post('/services')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Integration Test Service',
          description: 'Test service for integration',
          price: 5000,
          order: 1,
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const serviceId = createResponse.body.data.id;

      // Get service
      const getResponse = await request(app)
        .get(`/services/${serviceId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.name).toBe('Integration Test Service');

      // Update service
      const updateResponse = await request(app)
        .put(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Integration Test Service',
          price: 6000,
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe(
        'Updated Integration Test Service'
      );

      // Delete service
      await request(app)
        .delete(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204); // Delete returns 204 No Content
    });
  });
});
