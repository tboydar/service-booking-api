import request from 'supertest';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { errorHandler } from '../middlewares/error-handler';
import { generalRateLimit, strictRateLimit, apiRateLimit, initializeRateLimiters, closeRateLimiters } from '../middlewares/rate-limiter';
import Router from '@koa/router';

// Mock config
jest.mock('../config/environment', () => ({
  config: {
    RATE_LIMIT_ENABLED: true,
    RATE_LIMIT_DB_PATH: ':memory:',
    RATE_LIMIT_GENERAL_POINTS: 10, // Lower for testing
    RATE_LIMIT_STRICT_POINTS: 3, // Lower for testing
    RATE_LIMIT_API_POINTS: 5, // Lower for testing
    RATE_LIMIT_DURATION: 60,
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret',
  },
  environment: {
    NODE_ENV: 'test',
  },
}));

// Mock fs and path
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));

jest.mock('path', () => ({
  dirname: jest.fn(() => '.'),
}));

describe('Rate Limiter Integration Tests', () => {
  let app: Koa;
  let server: any;

  beforeAll(() => {
    // Initialize rate limiters
    initializeRateLimiters();
  });

  afterAll(() => {
    // Clean up
    closeRateLimiters();
  });

  beforeEach(() => {
    app = new Koa();
    app.use(errorHandler);
    app.use(bodyParser());
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe('General Rate Limiting', () => {
    it('應該在一般端點限制請求數量', async () => {
      const router = new Router();
      router.get('/test', generalRateLimit, async (ctx) => {
        ctx.body = { success: true };
      });

      app.use(router.routes());
      server = app.listen();

      // Make requests within limit
      for (let i = 0; i < 10; i++) {
        const response = await request(server)
          .get('/test')
          .set('X-Forwarded-For', `10.0.0.${i}`); // Use different IPs

        expect(response.status).toBe(200);
        expect(response.headers['x-ratelimit-limit']).toBe('10');
        expect(parseInt(response.headers['x-ratelimit-remaining'])).toBeLessThanOrEqual(9);
      }

      // Next request from same IP should be rate limited
      const response = await request(server)
        .get('/test')
        .set('X-Forwarded-For', '10.0.0.0');

      expect(response.status).toBe(429);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.headers['x-ratelimit-remaining']).toBe('0');
      expect(response.headers['retry-after']).toBeDefined();
    });

    it('應該正確設定 rate limit 標頭', async () => {
      const router = new Router();
      router.get('/test', generalRateLimit, async (ctx) => {
        ctx.body = { success: true };
      });

      app.use(router.routes());
      server = app.listen();

      const response = await request(server)
        .get('/test')
        .set('X-Forwarded-For', '10.0.1.1');

      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('10');
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();

      // Parse reset time and check it's a valid date
      const resetTime = new Date(response.headers['x-ratelimit-reset']);
      expect(resetTime.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Strict Rate Limiting for Auth', () => {
    it('應該對認證端點套用嚴格限制', async () => {
      const router = new Router();
      router.post('/auth/login', strictRateLimit, async (ctx) => {
        ctx.body = { success: true };
      });

      app.use(router.routes());
      server = app.listen();

      const testIp = '10.0.2.1';

      // Make requests within limit
      for (let i = 0; i < 3; i++) {
        const response = await request(server)
          .post('/auth/login')
          .set('X-Forwarded-For', testIp)
          .send({ email: 'test@example.com', password: 'password' });

        expect(response.status).toBe(200);
        expect(response.headers['x-ratelimit-limit']).toBe('3');
      }

      // Next request should be rate limited
      const response = await request(server)
        .post('/auth/login')
        .set('X-Forwarded-For', testIp)
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).toBe(429);
      expect(response.body.error.message).toContain('authentication attempts');
    });

    it('應該對註冊端點套用嚴格限制', async () => {
      const router = new Router();
      router.post('/auth/register', strictRateLimit, async (ctx) => {
        ctx.body = { success: true };
      });

      app.use(router.routes());
      server = app.listen();

      const testIp = '10.0.3.1';

      // Make requests within limit
      for (let i = 0; i < 3; i++) {
        const response = await request(server)
          .post('/auth/register')
          .set('X-Forwarded-For', testIp)
          .send({
            email: `user${i}@example.com`,
            password: 'password',
            name: `User ${i}`,
          });

        expect(response.status).toBe(200);
      }

      // Next request should be rate limited
      const response = await request(server)
        .post('/auth/register')
        .set('X-Forwarded-For', testIp)
        .send({
          email: 'blocked@example.com',
          password: 'password',
          name: 'Blocked User',
        });

      expect(response.status).toBe(429);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('API Rate Limiting', () => {
    it('應該對 API 端點套用 API 限制', async () => {
      const router = new Router();
      router.get('/api/data', apiRateLimit, async (ctx) => {
        ctx.body = { data: 'test' };
      });

      app.use(router.routes());
      server = app.listen();

      const testIp = '10.0.4.1';

      // Make requests within limit
      for (let i = 0; i < 5; i++) {
        const response = await request(server)
          .get('/api/data')
          .set('X-Forwarded-For', testIp);

        expect(response.status).toBe(200);
        expect(response.headers['x-ratelimit-limit']).toBe('5');
      }

      // Next request should be rate limited
      const response = await request(server)
        .get('/api/data')
        .set('X-Forwarded-For', testIp);

      expect(response.status).toBe(429);
      expect(response.body.error.message).toContain('API rate limit');
    });

    it('應該對不同 IP 獨立計算限制', async () => {
      const router = new Router();
      router.get('/api/test', apiRateLimit, async (ctx) => {
        ctx.body = { success: true };
      });

      app.use(router.routes());
      server = app.listen();

      // Make requests from different IPs
      const ips = ['10.0.5.1', '10.0.5.2', '10.0.5.3'];

      for (const ip of ips) {
        const response = await request(server)
          .get('/api/test')
          .set('X-Forwarded-For', ip);

        expect(response.status).toBe(200);
        expect(response.headers['x-ratelimit-remaining']).toBe('4'); // Each IP starts with full limit
      }
    });
  });

  describe('並發請求處理', () => {
    it('應該正確處理並發請求', async () => {
      const router = new Router();
      router.get('/concurrent', apiRateLimit, async (ctx) => {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 10));
        ctx.body = { success: true };
      });

      app.use(router.routes());
      server = app.listen();

      const testIp = '10.0.6.1';

      // Make concurrent requests
      const promises = [];
      for (let i = 0; i < 7; i++) {
        promises.push(
          request(server)
            .get('/concurrent')
            .set('X-Forwarded-For', testIp)
        );
      }

      const responses = await Promise.all(promises);

      // Count successful and rate-limited responses
      const successful = responses.filter(r => r.status === 200);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(successful.length).toBe(5); // API limit is 5
      expect(rateLimited.length).toBe(2); // 2 requests should be rate limited
    });
  });

  describe('錯誤回應格式', () => {
    it('應該返回正確格式的錯誤回應', async () => {
      const router = new Router();
      router.get('/error-test', strictRateLimit, async (ctx) => {
        ctx.body = { success: true };
      });

      app.use(router.routes());
      server = app.listen();

      const testIp = '10.0.7.1';

      // Exhaust the limit
      for (let i = 0; i < 3; i++) {
        await request(server)
          .get('/error-test')
          .set('X-Forwarded-For', testIp);
      }

      // This request should be rate limited
      const response = await request(server)
        .get('/error-test')
        .set('X-Forwarded-For', testIp);

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('retryAfter');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});