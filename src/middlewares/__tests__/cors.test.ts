import { Context } from 'koa';
import { cors, developmentCors, productionCors } from '../cors';

// Mock environment
jest.mock('../../config/environment', () => ({
  environment: {
    NODE_ENV: 'development',
    ALLOWED_ORIGINS: 'https://example.com,https://app.example.com',
  },
}));

// Mock context and next function
const createMockContext = (
  overrides: Partial<Context> = {}
): Partial<Context> => ({
  method: 'GET',
  headers: {},
  status: 200,
  body: undefined,
  set: jest.fn(),
  ...overrides,
});

const createMockNext = () => jest.fn().mockResolvedValue(undefined);

describe('CORS 中介軟體', () => {
  let ctx: Partial<Context>;
  let next: jest.Mock;

  beforeEach(() => {
    ctx = createMockContext();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('cors', () => {
    it('應該設定預設的 CORS headers', async () => {
      const middleware = cors();

      await middleware(ctx as Context, next);

      expect(ctx.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Credentials',
        'true'
      );
      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,DELETE,OPTIONS'
      );
      expect(ctx.set).toHaveBeenCalledWith('Access-Control-Max-Age', '86400');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('應該處理 OPTIONS 預檢請求', async () => {
      ctx.method = 'OPTIONS';
      const middleware = cors();

      await middleware(ctx as Context, next);

      expect(ctx.status).toBe(204);
      expect(ctx.body).toBe('');
      expect(next).not.toHaveBeenCalled();
    });

    it('應該設定自訂的 origin', async () => {
      const middleware = cors({ origin: 'https://example.com' });

      await middleware(ctx as Context, next);

      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://example.com'
      );
    });

    it('應該處理陣列形式的 origins', async () => {
      ctx.headers = { origin: 'https://app.example.com' };
      const middleware = cors({
        origin: ['https://example.com', 'https://app.example.com'],
      });

      await middleware(ctx as Context, next);

      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://app.example.com'
      );
    });

    it('應該不設定 origin 當請求的 origin 不在允許清單中', async () => {
      ctx.headers = { origin: 'https://malicious.com' };
      const middleware = cors({
        origin: ['https://example.com', 'https://app.example.com'],
      });

      await middleware(ctx as Context, next);

      expect(ctx.set).not.toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://malicious.com'
      );
    });

    it('應該處理函數形式的 origin', async () => {
      const originFunction = jest.fn().mockResolvedValue('https://dynamic.com');
      const middleware = cors({ origin: originFunction });

      await middleware(ctx as Context, next);

      expect(originFunction).toHaveBeenCalledWith(ctx);
      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://dynamic.com'
      );
    });

    it('應該設定自訂的 allowed methods', async () => {
      const middleware = cors({
        allowMethods: ['GET', 'POST'],
      });

      await middleware(ctx as Context, next);

      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET,POST'
      );
    });

    it('應該設定自訂的 allowed headers', async () => {
      const middleware = cors({
        allowHeaders: ['Content-Type', 'Authorization'],
      });

      await middleware(ctx as Context, next);

      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        'Content-Type,Authorization'
      );
    });

    it('應該設定 exposed headers', async () => {
      const middleware = cors({
        exposeHeaders: ['X-Total-Count', 'X-Page-Count'],
      });

      await middleware(ctx as Context, next);

      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Expose-Headers',
        'X-Total-Count,X-Page-Count'
      );
    });

    it('應該不設定 credentials 當設為 false', async () => {
      const middleware = cors({ credentials: false });

      await middleware(ctx as Context, next);

      expect(ctx.set).not.toHaveBeenCalledWith(
        'Access-Control-Allow-Credentials',
        expect.anything()
      );
    });

    it('應該設定自訂的 max age', async () => {
      const middleware = cors({ maxAge: 3600 });

      await middleware(ctx as Context, next);

      expect(ctx.set).toHaveBeenCalledWith('Access-Control-Max-Age', '3600');
    });

    it('應該使用自訂的 OPTIONS 狀態碼', async () => {
      ctx.method = 'OPTIONS';
      const middleware = cors({ optionsSuccessStatus: 200 });

      await middleware(ctx as Context, next);

      expect(ctx.status).toBe(200);
    });

    it('應該處理字串形式的 methods 和 headers', async () => {
      const middleware = cors({
        allowMethods: 'GET,POST,PUT',
        allowHeaders: 'Content-Type,Authorization',
      });

      await middleware(ctx as Context, next);

      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT'
      );
      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        'Content-Type,Authorization'
      );
    });
  });

  describe('developmentCors', () => {
    it('應該允許開發環境的 origins', async () => {
      ctx.headers = { origin: 'http://localhost:3000' };

      await developmentCors(ctx as Context, next);

      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://localhost:3000'
      );
      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Credentials',
        'true'
      );
    });

    it('應該不設定不允許的 origin', async () => {
      ctx.headers = { origin: 'https://malicious.com' };

      await developmentCors(ctx as Context, next);

      expect(ctx.set).not.toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://malicious.com'
      );
    });
  });

  describe('productionCors', () => {
    it('應該使用環境變數中的 allowed origins', async () => {
      ctx.headers = { origin: 'https://example.com' };

      await productionCors(ctx as Context, next);

      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://example.com'
      );
    });

    it('應該使用第一個 origin 作為預設值當沒有匹配的 origin', async () => {
      ctx.headers = { origin: 'https://unknown.com' };

      await productionCors(ctx as Context, next);

      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://example.com'
      );
    });
  });

  describe('複雜情境測試', () => {
    it('應該正確處理多個 CORS headers 的組合', async () => {
      const middleware = cors({
        origin: 'https://example.com',
        allowMethods: ['GET', 'POST', 'PUT'],
        allowHeaders: ['Content-Type', 'Authorization'],
        exposeHeaders: ['X-Total-Count'],
        credentials: true,
        maxAge: 3600,
      });

      await middleware(ctx as Context, next);

      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://example.com'
      );
      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT'
      );
      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        'Content-Type,Authorization'
      );
      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Expose-Headers',
        'X-Total-Count'
      );
      expect(ctx.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Credentials',
        'true'
      );
      expect(ctx.set).toHaveBeenCalledWith('Access-Control-Max-Age', '3600');
    });

    it('應該在 OPTIONS 請求後不執行後續中介軟體', async () => {
      ctx.method = 'OPTIONS';
      const middleware = cors();

      await middleware(ctx as Context, next);

      expect(ctx.status).toBe(204);
      expect(next).not.toHaveBeenCalled();
    });

    it('應該在非 OPTIONS 請求後執行後續中介軟體', async () => {
      ctx.method = 'GET';
      const middleware = cors();

      await middleware(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
