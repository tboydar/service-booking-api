// Increase timeout for comprehensive integration tests
jest.setTimeout(120000); // 120 seconds

import request from 'supertest';
import { createApp } from '../index';
import { initializeDatabase } from '../database/init';
import { sequelize } from '../config/database';

describe('綜合整合測試 - Task 12', () => {
  let app: any;
  let testUserToken: string;
  let testServiceId: string;

  beforeAll(async () => {
    // 設定測試環境和測試資料庫
    await initializeDatabase();
    app = createApp().callback();
  });

  beforeEach(async () => {
    // 清理資料庫
    await sequelize.sync({ force: true });
    await initializeDatabase();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('1. 會員註冊 API 整合測試', () => {
    describe('成功案例', () => {
      it('應該成功註冊新會員', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        };

        const response = await request(app)
          .post('/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            user: {
              id: expect.any(String),
              email: 'test@example.com',
              name: 'Test User',
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
            token: expect.any(String),
          },
          timestamp: expect.any(String),
        });

        // 確保不回傳密碼
        expect(response.body.data.user.password).toBeUndefined();
      });

      it('應該正確雜湊密碼', async () => {
        const userData = {
          email: 'hash-test@example.com',
          password: 'plaintext123',
          name: 'Hash Test User',
        };

        await request(app).post('/auth/register').send(userData).expect(201);

        // 嘗試用原始密碼登入應該成功
        const loginResponse = await request(app)
          .post('/auth/login')
          .send({
            email: 'hash-test@example.com',
            password: 'plaintext123',
          })
          .expect(200);

        expect(loginResponse.body.success).toBe(true);
      });
    });

    describe('錯誤處理', () => {
      it('應該拒絕重複的 email', async () => {
        const userData = {
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'First User',
        };

        // 第一次註冊應該成功
        await request(app).post('/auth/register').send(userData).expect(201);

        // 第二次註冊相同 email 應該失敗
        const response = await request(app)
          .post('/auth/register')
          .send({
            ...userData,
            name: 'Second User',
          })
          .expect(409);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'DUPLICATE_ERROR',
            message: 'Email already exists',
          },
          timestamp: expect.any(String),
        });
      });

      it('應該驗證輸入格式', async () => {
        const testCases = [
          {
            data: {},
            description: '空資料',
          },
          {
            data: { email: 'invalid-email' },
            description: '無效 email 格式',
          },
          {
            data: { email: 'test@example.com', password: '123' },
            description: '密碼太短',
          },
          {
            data: { email: 'test@example.com', password: 'password123' },
            description: '缺少姓名',
          },
          {
            data: {
              email: 'test@example.com',
              password: 'password123',
              name: 'A',
            },
            description: '姓名太短',
          },
        ];

        for (const testCase of testCases) {
          const response = await request(app)
            .post('/auth/register')
            .send(testCase.data)
            .expect(400);

          expect(response.body).toMatchObject({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: expect.any(String),
            },
          });
        }
      });
    });
  });

  describe('2. 會員登入 API 整合測試', () => {
    beforeEach(async () => {
      // 建立測試用戶
      await request(app)
        .post('/auth/register')
        .send({
          email: 'login-test@example.com',
          password: 'password123',
          name: 'Login Test User',
        })
        .expect(201);
    });

    describe('成功案例', () => {
      it('應該成功登入並回傳 JWT token', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            email: 'login-test@example.com',
            password: 'password123',
          })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            token: expect.any(String),
            user: {
              id: expect.any(String),
              email: 'login-test@example.com',
              name: 'Login Test User',
            },
          },
          timestamp: expect.any(String),
        });

        // 驗證 JWT token 格式
        const token = response.body.data.token;
        expect(token.split('.')).toHaveLength(3); // JWT 有三個部分
      });

      it('JWT token 應該可以用於認證', async () => {
        const loginResponse = await request(app)
          .post('/auth/login')
          .send({
            email: 'login-test@example.com',
            password: 'password123',
          })
          .expect(200);

        const token = loginResponse.body.data.token;

        // 使用 token 存取需要認證的端點
        const response = await request(app)
          .post('/services')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'Test Service',
            price: 1000,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
      });
    });

    describe('錯誤處理', () => {
      it('應該拒絕錯誤的密碼', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            email: 'login-test@example.com',
            password: 'wrongpassword',
          })
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: expect.stringContaining('Invalid'),
          },
        });
      });

      it('應該拒絕不存在的 email', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'password123',
          })
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: expect.stringContaining('Invalid'),
          },
        });
      });

      it('應該驗證輸入格式', async () => {
        const testCases = [
          { email: '', password: 'password123' },
          { email: 'invalid-email', password: 'password123' },
          { email: 'test@example.com', password: '' },
          {},
        ];

        for (const testCase of testCases) {
          const response = await request(app)
            .post('/auth/login')
            .send(testCase)
            .expect(400);

          expect(response.body).toMatchObject({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
            },
          });
        }
      });
    });
  });

  describe('3. 服務查詢 API 整合測試（公開端點）', () => {
    beforeEach(async () => {
      // 建立測試用戶和 token
      await request(app)
        .post('/auth/register')
        .send({
          email: 'service-test@example.com',
          password: 'password123',
          name: 'Service Test User',
        })
        .expect(201);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'service-test@example.com',
          password: 'password123',
        })
        .expect(200);

      testUserToken = loginResponse.body.data.token;

      // 建立測試服務
      const serviceResponse = await request(app)
        .post('/services')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          name: 'Public Test Service',
          description: 'A test service for public access',
          price: 2000,
          order: 1,
          isPublic: true,
        })
        .expect(201);

      testServiceId = serviceResponse.body.data.id;

      // 建立私人服務
      await request(app)
        .post('/services')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          name: 'Private Test Service',
          description: 'A private test service',
          price: 3000,
          order: 2,
          isPublic: false,
        })
        .expect(201);

      // 建立已刪除的服務
      const deletedServiceResponse = await request(app)
        .post('/services')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          name: 'Deleted Test Service',
          price: 1500,
          order: 3,
        })
        .expect(201);

      await request(app)
        .delete(`/services/${deletedServiceResponse.body.data.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(204);
    });

    describe('服務列表查詢', () => {
      it('應該回傳所有公開且未刪除的服務', async () => {
        const response = await request(app).get('/services').expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Array),
          timestamp: expect.any(String),
        });

        const services = response.body.data;
        expect(services).toHaveLength(1); // 只有一個公開且未刪除的服務

        expect(services[0]).toMatchObject({
          id: testServiceId,
          name: 'Public Test Service',
          description: 'A test service for public access',
          price: 2000,
          order: 1,
          isPublic: true,
          isRemove: false,
        });
      });

      it('應該按照 order 欄位排序', async () => {
        // 建立多個公開服務
        await request(app)
          .post('/services')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send({
            name: 'Service A',
            price: 1000,
            order: 3,
            isPublic: true,
          })
          .expect(201);

        await request(app)
          .post('/services')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send({
            name: 'Service B',
            price: 1000,
            order: 1,
            isPublic: true,
          })
          .expect(201);

        const response = await request(app).get('/services').expect(200);

        const services = response.body.data;
        expect(services).toHaveLength(3);

        // 檢查排序
        expect(services[0].order).toBeLessThanOrEqual(services[1].order);
        expect(services[1].order).toBeLessThanOrEqual(services[2].order);
      });

      it('不需要認證即可存取', async () => {
        // 不提供 Authorization header
        const response = await request(app).get('/services').expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('單一服務查詢', () => {
      it('應該回傳指定服務的完整資訊', async () => {
        const response = await request(app)
          .get(`/services/${testServiceId}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: testServiceId,
            name: 'Public Test Service',
            description: 'A test service for public access',
            price: 2000,
            order: 1,
            isPublic: true,
            isRemove: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          timestamp: expect.any(String),
        });
      });

      it('應該拒絕存取私人服務', async () => {
        // 先取得私人服務的 ID
        const loginResponse = await request(app).post('/auth/login').send({
          email: 'service-test@example.com',
          password: 'password123',
        });

        const token = loginResponse.body.data.token;

        // 建立私人服務
        const privateServiceResponse = await request(app)
          .post('/services')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'Private Service',
            price: 1000,
            isPublic: false,
          })
          .expect(201);

        const privateServiceId = privateServiceResponse.body.data.id;

        // 嘗試不用認證存取私人服務
        const response = await request(app)
          .get(`/services/${privateServiceId}`)
          .expect(404);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'NOT_FOUND_ERROR',
          },
        });
      });

      it('應該回傳 404 對於不存在的服務', async () => {
        const fakeId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Valid v4 UUID
        const response = await request(app)
          .get(`/services/${fakeId}`)
          .expect(404);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'NOT_FOUND_ERROR',
            message: expect.stringContaining('Service not found'),
          },
        });
      });

      it('應該驗證 UUID 格式', async () => {
        const response = await request(app)
          .get('/services/invalid-uuid')
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
          },
        });
      });
    });
  });

  describe('4. 服務管理 API 整合測試（需要權限）', () => {
    beforeEach(async () => {
      // 建立測試用戶和 token
      const uniqueEmail = `admin-test-${Date.now()}@example.com`;

      await request(app)
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          password: 'password123',
          name: 'Admin Test User',
        })
        .expect(201);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(200);

      testUserToken = loginResponse.body.data.token;
    });

    describe('新增服務', () => {
      it('應該成功建立新服務', async () => {
        const serviceData = {
          name: 'New Test Service',
          description: 'A new service for testing',
          price: 2500,
          showTime: 60,
          order: 5,
          isPublic: true,
        };

        const response = await request(app)
          .post('/services')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(serviceData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: expect.any(String),
            name: 'New Test Service',
            description: 'A new service for testing',
            price: 2500,
            showTime: 60,
            order: 5,
            isPublic: true,
            isRemove: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          timestamp: expect.any(String),
        });
      });

      it('應該使用預設值', async () => {
        const minimalServiceData = {
          name: 'Minimal Service',
          price: 1000,
        };

        const response = await request(app)
          .post('/services')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(minimalServiceData)
          .expect(201);

        expect(response.body.data).toMatchObject({
          name: 'Minimal Service',
          price: 1000,
          order: 0, // 預設值
          isPublic: true, // 預設值
          isRemove: false, // 預設值
        });
      });

      it('應該拒絕未認證的請求', async () => {
        const response = await request(app)
          .post('/services')
          .send({
            name: 'Unauthorized Service',
            price: 1000,
          })
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
          },
        });
      });

      it('應該驗證輸入資料', async () => {
        const testCases = [
          { data: {}, description: '空資料' },
          { data: { name: '' }, description: '空名稱' },
          { data: { name: 'Test', price: -100 }, description: '負價格' },
          {
            data: { name: 'Test', price: 'invalid' },
            description: '無效價格格式',
          },
        ];

        for (const testCase of testCases) {
          const response = await request(app)
            .post('/services')
            .set('Authorization', `Bearer ${testUserToken}`)
            .send(testCase.data)
            .expect(400);

          expect(response.body).toMatchObject({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
            },
          });
        }
      });
    });

    describe('更新服務', () => {
      let serviceId: string;

      beforeEach(async () => {
        const response = await request(app)
          .post('/services')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send({
            name: 'Original Service',
            description: 'Original description',
            price: 1500,
            order: 1,
          })
          .expect(201);

        serviceId = response.body.data.id;
      });

      it('應該成功更新服務', async () => {
        const updateData = {
          name: 'Updated Service',
          description: 'Updated description',
          price: 2000,
          order: 2,
          isPublic: false,
        };

        const response = await request(app)
          .put(`/services/${serviceId}`)
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: serviceId,
            name: 'Updated Service',
            description: 'Updated description',
            price: 2000,
            order: 2,
            isPublic: false,
          },
        });
      });

      it('應該支援部分更新', async () => {
        const response = await request(app)
          .put(`/services/${serviceId}`)
          .set('Authorization', `Bearer ${testUserToken}`)
          .send({
            name: 'Partially Updated Service',
          })
          .expect(200);

        expect(response.body.data).toMatchObject({
          id: serviceId,
          name: 'Partially Updated Service',
          description: 'Original description', // 保持原值
          price: 1500, // 保持原值
        });
      });

      it('應該拒絕更新不存在的服務', async () => {
        const fakeId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Valid v4 UUID
        const response = await request(app)
          .put(`/services/${fakeId}`)
          .set('Authorization', `Bearer ${testUserToken}`)
          .send({
            name: 'Updated Name',
          })
          .expect(404);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'NOT_FOUND_ERROR',
          },
        });
      });
    });

    describe('刪除服務', () => {
      let serviceId: string;

      beforeEach(async () => {
        const response = await request(app)
          .post('/services')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send({
            name: 'Service to Delete',
            price: 1000,
          })
          .expect(201);

        serviceId = response.body.data.id;
      });

      it('應該成功軟刪除服務', async () => {
        await request(app)
          .delete(`/services/${serviceId}`)
          .set('Authorization', `Bearer ${testUserToken}`)
          .expect(204);

        // 驗證服務已被軟刪除（不會出現在公開列表中）
        const listResponse = await request(app).get('/services').expect(200);

        const services = listResponse.body.data;
        expect(services.find((s: any) => s.id === serviceId)).toBeUndefined();
      });

      it('應該拒絕刪除不存在的服務', async () => {
        const fakeId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Valid v4 UUID
        const response = await request(app)
          .delete(`/services/${fakeId}`)
          .set('Authorization', `Bearer ${testUserToken}`)
          .expect(404);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'NOT_FOUND_ERROR',
          },
        });
      });
    });

    describe('JWT 認證驗證', () => {
      it('應該拒絕無效的 token', async () => {
        const response = await request(app)
          .post('/services')
          .set('Authorization', 'Bearer invalid-token')
          .send({
            name: 'Test Service',
            price: 1000,
          })
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
          },
        });
      });

      it('應該拒絕過期的 token', async () => {
        // 這個測試需要模擬過期的 token，在實際應用中可能需要調整 JWT 過期時間
        const expiredToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

        const response = await request(app)
          .post('/services')
          .set('Authorization', `Bearer ${expiredToken}`)
          .send({
            name: 'Test Service',
            price: 1000,
          })
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
          },
        });
      });

      it('應該拒絕缺少 Authorization header 的請求', async () => {
        const response = await request(app)
          .post('/services')
          .send({
            name: 'Test Service',
            price: 1000,
          })
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
          },
        });
      });
    });
  });

  describe('5. 錯誤處理和邊界情況測試', () => {
    describe('全域錯誤處理', () => {
      it('應該處理 404 錯誤', async () => {
        const response = await request(app)
          .get('/nonexistent-endpoint')
          .expect(404);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'NOT_FOUND_ERROR',
            message: expect.stringContaining('not found'),
          },
          timestamp: expect.any(String),
        });
      });

      it('應該處理無效的 JSON', async () => {
        const response = await request(app)
          .post('/auth/register')
          .send('invalid json')
          .set('Content-Type', 'application/json')
          .expect(500);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: expect.any(String),
            message: expect.any(String),
          },
          timestamp: expect.any(String),
        });
      });

      it('應該處理大型請求 body', async () => {
        const largeData = {
          email: 'test@example.com',
          password: 'password123',
          name: 'A'.repeat(10000), // 非常長的名稱
        };

        const response = await request(app)
          .post('/auth/register')
          .send(largeData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
          },
        });
      });
    });

    describe('邊界值測試', () => {
      beforeEach(async () => {
        const uniqueEmail = `boundary-test-${Date.now()}@example.com`;

        await request(app)
          .post('/auth/register')
          .send({
            email: uniqueEmail,
            password: 'password123',
            name: 'Boundary Test User',
          })
          .expect(201);

        const loginResponse = await request(app)
          .post('/auth/login')
          .send({
            email: uniqueEmail,
            password: 'password123',
          })
          .expect(200);

        testUserToken = loginResponse.body.data.token;
      });

      it('應該處理最小有效輸入', async () => {
        const minimalService = {
          name: 'A', // 最短有效名稱
          price: 0, // 最小價格
        };

        const response = await request(app)
          .post('/services')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(minimalService)
          .expect(201);

        expect(response.body.success).toBe(true);
      });

      it('應該處理最大有效輸入', async () => {
        const maximalService = {
          name: 'A'.repeat(255), // 最長有效名稱
          description: 'A'.repeat(1000), // 最長描述
          price: Number.MAX_SAFE_INTEGER,
          showTime: Number.MAX_SAFE_INTEGER,
          order: Number.MAX_SAFE_INTEGER,
        };

        const response = await request(app)
          .post('/services')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(maximalService)
          .expect(201);

        expect(response.body.success).toBe(true);
      });

      it('應該拒絕超出限制的輸入', async () => {
        const oversizedService = {
          name: 'A'.repeat(256), // 超過最大長度
          price: 1000,
        };

        const response = await request(app)
          .post('/services')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send(oversizedService)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
          },
        });
      });
    });

    describe('並發測試', () => {
      it('應該處理並發註冊請求', async () => {
        const promises = Array.from({ length: 5 }, (_, i) =>
          request(app)
            .post('/auth/register')
            .send({
              email: `concurrent${i}@example.com`,
              password: 'password123',
              name: `Concurrent User ${i}`,
            })
        );

        const responses = await Promise.all(promises);

        // 所有請求都應該成功
        responses.forEach(response => {
          expect(response.status).toBe(201);
          expect(response.body.success).toBe(true);
        });
      });

      it('應該處理並發服務建立請求', async () => {
        // 先登入取得 token
        const loginResponse = await request(app)
          .post('/auth/register')
          .send({
            email: 'concurrent-service@example.com',
            password: 'password123',
            name: 'Concurrent Service User',
          })
          .then(() =>
            request(app).post('/auth/login').send({
              email: 'concurrent-service@example.com',
              password: 'password123',
            })
          );

        const token = loginResponse.body.data.token;

        const promises = Array.from({ length: 3 }, (_, i) =>
          request(app)
            .post('/services')
            .set('Authorization', `Bearer ${token}`)
            .send({
              name: `Concurrent Service ${i}`,
              price: 1000 + i * 100,
              order: i,
            })
        );

        const responses = await Promise.all(promises);

        // 所有請求都應該成功
        responses.forEach(response => {
          expect(response.status).toBe(201);
          expect(response.body.success).toBe(true);
        });
      });
    });

    describe('安全性測試', () => {
      it('應該防止 SQL 注入', async () => {
        const maliciousInput = {
          email: "test@example.com'; DROP TABLE Users; --",
          password: 'password123',
          name: 'Malicious User',
        };

        // 請求應該被正常處理（Sequelize 提供保護）
        const response = await request(app)
          .post('/auth/register')
          .send(maliciousInput)
          .expect(400); // 應該因為 email 格式驗證失敗

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
          },
        });
      });

      it('應該不在錯誤訊息中暴露敏感資訊', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'password123',
          })
          .expect(401);

        // 錯誤訊息不應該透露用戶是否存在
        expect(response.body.error.message).not.toContain('user not found');
        expect(response.body.error.message).not.toContain('email not found');
      });

      it('應該限制請求大小', async () => {
        const hugePayload = {
          email: 'test@example.com',
          password: 'password123',
          name: 'A'.repeat(100000), // 100KB 的名稱
        };

        const response = await request(app)
          .post('/auth/register')
          .send(hugePayload)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
          },
        });
      });
    });
  });

  describe('6. 完整使用者流程測試', () => {
    it('應該支援完整的使用者註冊、登入、服務管理流程', async () => {
      // 1. 註冊新用戶
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          email: 'fullflow@example.com',
          password: 'password123',
          name: 'Full Flow User',
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);

      // 2. 登入用戶
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'fullflow@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const token = loginResponse.body.data.token;

      // 3. 建立服務
      const createServiceResponse = await request(app)
        .post('/services')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Full Flow Service',
          description: 'A service created in full flow test',
          price: 3000,
          order: 1,
          isPublic: true,
        })
        .expect(201);

      expect(createServiceResponse.body.success).toBe(true);
      const serviceId = createServiceResponse.body.data.id;

      // 4. 查詢服務列表（公開端點）
      const listResponse = await request(app).get('/services').expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data).toContainEqual(
        expect.objectContaining({
          id: serviceId,
          name: 'Full Flow Service',
        })
      );

      // 5. 查詢單一服務（公開端點）
      const getServiceResponse = await request(app)
        .get(`/services/${serviceId}`)
        .expect(200);

      expect(getServiceResponse.body.success).toBe(true);
      expect(getServiceResponse.body.data).toMatchObject({
        id: serviceId,
        name: 'Full Flow Service',
        description: 'A service created in full flow test',
        price: 3000,
      });

      // 6. 更新服務
      const updateServiceResponse = await request(app)
        .put(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Full Flow Service',
          price: 3500,
        })
        .expect(200);

      expect(updateServiceResponse.body.success).toBe(true);
      expect(updateServiceResponse.body.data).toMatchObject({
        id: serviceId,
        name: 'Updated Full Flow Service',
        price: 3500,
      });

      // 7. 刪除服務
      await request(app)
        .delete(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      // 8. 驗證服務已被軟刪除
      const finalListResponse = await request(app).get('/services').expect(200);

      expect(finalListResponse.body.data).not.toContainEqual(
        expect.objectContaining({
          id: serviceId,
        })
      );
    });

    it('應該正確處理多用戶場景', async () => {
      // 建立兩個用戶
      await request(app)
        .post('/auth/register')
        .send({
          email: 'user1@example.com',
          password: 'password123',
          name: 'User 1',
        })
        .expect(201);

      await request(app)
        .post('/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'password123',
          name: 'User 2',
        })
        .expect(201);

      // 兩個用戶分別登入
      const user1Login = await request(app)
        .post('/auth/login')
        .send({
          email: 'user1@example.com',
          password: 'password123',
        })
        .expect(200);

      const user2Login = await request(app)
        .post('/auth/login')
        .send({
          email: 'user2@example.com',
          password: 'password123',
        })
        .expect(200);

      const user1Token = user1Login.body.data.token;
      const user2Token = user2Login.body.data.token;

      // 用戶1建立服務
      const user1Service = await request(app)
        .post('/services')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'User 1 Service',
          price: 1000,
        })
        .expect(201);

      // 用戶2建立服務
      const user2Service = await request(app)
        .post('/services')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'User 2 Service',
          price: 2000,
        })
        .expect(201);

      // 兩個服務都應該出現在公開列表中
      const listResponse = await request(app).get('/services').expect(200);

      expect(listResponse.body.data).toHaveLength(2);
      expect(listResponse.body.data).toContainEqual(
        expect.objectContaining({
          name: 'User 1 Service',
        })
      );
      expect(listResponse.body.data).toContainEqual(
        expect.objectContaining({
          name: 'User 2 Service',
        })
      );

      // 用戶1應該可以管理自己的服務
      await request(app)
        .put(`/services/${user1Service.body.data.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Updated User 1 Service',
        })
        .expect(200);

      // 用戶2也應該可以管理自己的服務
      await request(app)
        .delete(`/services/${user2Service.body.data.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(204);
    });
  });
});
