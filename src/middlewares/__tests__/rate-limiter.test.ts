import { Context, Next } from 'koa';
import { AppError } from '../error-handler';

// Mock better-sqlite3 before importing rate-limiter
jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation(() => ({
    prepare: jest.fn(() => ({
      run: jest.fn(() => ({ changes: 0 })),
      get: jest.fn(),
      all: jest.fn(() => []),
    })),
    exec: jest.fn(),
    close: jest.fn(),
  }));
});

// Mock rate-limiter-flexible
jest.mock('rate-limiter-flexible', () => {
  const consumeResults = new Map();

  class RateLimiterSQLite {
    constructor(private opts: any) {}

    async consume(key: string) {
      const fullKey = `${this.opts.keyPrefix}:${key}`;
      const current = consumeResults.get(fullKey) || 0;
      const newCount = current + 1;

      if (newCount > this.opts.points) {
        const error = new Error('Rate limit exceeded');
        (error as any).msBeforeNext = 60000;
        throw error;
      }

      consumeResults.set(fullKey, newCount);
      return {
        remainingPoints: this.opts.points - newCount,
        msBeforeNext: 60000,
      };
    }

    static resetKey(key: string) {
      consumeResults.delete(key);
    }
  }

  return { RateLimiterSQLite };
});

// Mock config
jest.mock('../../config/environment', () => ({
  config: {
    RATE_LIMIT_ENABLED: true,
    RATE_LIMIT_DB_PATH: ':memory:',
    RATE_LIMIT_GENERAL_POINTS: 100,
    RATE_LIMIT_STRICT_POINTS: 5,
    RATE_LIMIT_API_POINTS: 60,
    RATE_LIMIT_DURATION: 60,
    NODE_ENV: 'test',
  },
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  dirname: jest.fn(() => '.'),
}));

// Now import the module to test
import {
  generalRateLimit,
  strictRateLimit,
  apiRateLimit,
  initializeRateLimiters,
  closeRateLimiters,
} from '../rate-limiter';
import { config } from '../../config/environment';

describe('Rate Limiter Middleware', () => {
  let ctx: Partial<Context>;
  let next: Next;

  beforeAll(() => {
    // Initialize rate limiters for testing
    initializeRateLimiters();
  });

  afterAll(() => {
    // Clean up
    closeRateLimiters();
  });

  beforeEach(() => {
    ctx = {
      request: {
        ip: '192.168.1.100',
        headers: {},
        socket: {
          remoteAddress: '192.168.1.100',
        },
      } as any,
      set: jest.fn(),
      throw: jest.fn() as any,
    };
    next = jest.fn().mockResolvedValue(undefined);
  });

  describe('General Rate Limiter', () => {
    it('應該允許在限制內的請求通過', async () => {
      await generalRateLimit(ctx as Context, next);

      expect(next).toHaveBeenCalled();
      expect(ctx.set).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(ctx.set).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        expect.any(String)
      );
      expect(ctx.set).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(String)
      );
    });

    it('應該在開發環境跳過白名單 IP', async () => {
      const originalEnv = config.NODE_ENV;
      (config as any).NODE_ENV = 'development';
      ctx.request!.ip = '127.0.0.1';

      await generalRateLimit(ctx as Context, next);

      expect(next).toHaveBeenCalled();
      expect(ctx.set).not.toHaveBeenCalled();

      (config as any).NODE_ENV = originalEnv;
    });

    it('應該在停用時跳過限流', async () => {
      const originalEnabled = config.RATE_LIMIT_ENABLED;
      (config as any).RATE_LIMIT_ENABLED = false;

      await generalRateLimit(ctx as Context, next);

      expect(next).toHaveBeenCalled();
      expect(ctx.set).not.toHaveBeenCalled();

      (config as any).RATE_LIMIT_ENABLED = originalEnabled;
    });
  });

  describe('Strict Rate Limiter', () => {
    it('應該對認證端點套用嚴格限制', async () => {
      // Use a new IP to avoid conflicts with other tests
      ctx.request!.ip = '192.168.1.101';

      await strictRateLimit(ctx as Context, next);

      expect(next).toHaveBeenCalled();
      expect(ctx.set).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(ctx.set).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        expect.any(String)
      );
    });

    it('應該在超過限制時拋出錯誤', async () => {
      // Use a unique IP for this test
      ctx.request!.ip = '192.168.1.102';

      // Consume all points
      for (let i = 0; i < 5; i++) {
        await strictRateLimit(ctx as Context, next);
      }

      // This should exceed the limit
      await expect(strictRateLimit(ctx as Context, next)).rejects.toThrow(
        AppError
      );

      // Check that proper headers are set
      expect(ctx.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
      expect(ctx.set).toHaveBeenCalledWith(
        'Retry-After',
        expect.any(String)
      );
    });
  });

  describe('API Rate Limiter', () => {
    it('應該對 API 端點套用 API 限制', async () => {
      // Use a new IP to avoid conflicts
      ctx.request!.ip = '192.168.1.103';

      await apiRateLimit(ctx as Context, next);

      expect(next).toHaveBeenCalled();
      expect(ctx.set).toHaveBeenCalledWith('X-RateLimit-Limit', '60');
      expect(ctx.set).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        expect.any(String)
      );
    });

    it('應該正確處理不同的 IP 來源', async () => {
      // Test X-Forwarded-For header
      ctx.request!.headers['x-forwarded-for'] = '10.0.0.1';
      ctx.request!.ip = '' as any;

      await apiRateLimit(ctx as Context, next);

      expect(next).toHaveBeenCalled();

      // Test X-Real-IP header
      ctx.request!.headers = { 'x-real-ip': '10.0.0.2' };
      ctx.request!.ip = '' as any;

      await apiRateLimit(ctx as Context, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('錯誤處理', () => {
    it('應該在超過一般限制時返回 429 錯誤', async () => {
      // Use a unique IP
      ctx.request!.ip = '192.168.1.104';

      // Consume all points
      for (let i = 0; i < 100; i++) {
        await generalRateLimit(ctx as Context, next);
      }

      // This should exceed the limit
      try {
        await generalRateLimit(ctx as Context, next);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(429);
        expect((error as AppError).code).toBe('RATE_LIMIT_EXCEEDED');
        expect((error as AppError).message).toContain('Too many requests');
      }
    });

    it('應該在超過嚴格限制時返回適當的錯誤訊息', async () => {
      // Use a unique IP
      ctx.request!.ip = '192.168.1.105';

      // Consume all points
      for (let i = 0; i < 5; i++) {
        await strictRateLimit(ctx as Context, next);
      }

      // This should exceed the limit
      try {
        await strictRateLimit(ctx as Context, next);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(429);
        expect((error as AppError).message).toContain('authentication attempts');
      }
    });

    it('應該在超過 API 限制時返回適當的錯誤訊息', async () => {
      // Use a unique IP
      ctx.request!.ip = '192.168.1.106';

      // Consume all points
      for (let i = 0; i < 60; i++) {
        await apiRateLimit(ctx as Context, next);
      }

      // This should exceed the limit
      try {
        await apiRateLimit(ctx as Context, next);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(429);
        expect((error as AppError).message).toContain('API rate limit exceeded');
      }
    });
  });
});