import { Context } from 'koa';
import {
  errorHandler,
  AppError,
  createSuccessResponse,
} from '../error-handler';

// Mock context and next function
const createMockContext = (): Partial<Context> => ({
  status: 200,
  body: undefined,
  set: jest.fn(),
  headers: {},
});

const createMockNext = (error?: Error) => {
  return jest.fn().mockImplementation(() => {
    if (error) {
      throw error;
    }
    return Promise.resolve();
  });
};

describe('錯誤處理中介軟體', () => {
  let ctx: Partial<Context>;

  beforeEach(() => {
    ctx = createMockContext();
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('應該正常執行下一個中介軟體當沒有錯誤時', async () => {
      const next = createMockNext();

      await errorHandler(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.status).toBe(200);
    });

    it('應該處理 AppError 並設定正確的回應', async () => {
      const appError = new AppError('TEST_ERROR', 'Test error message', 400, {
        field: 'test',
      });
      const next = createMockNext(appError);

      await errorHandler(ctx as Context, next);

      expect(ctx.status).toBe(400);
      expect(ctx.body).toMatchObject({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
          details: { field: 'test' },
        },
      });
      expect((ctx.body as any).timestamp).toBeDefined();
    });

    it('應該處理 Joi 驗證錯誤', async () => {
      const joiError = {
        isJoi: true,
        details: [
          {
            path: ['email'],
            message: '"email" is required',
          },
          {
            path: ['password'],
            message: '"password" must be at least 6 characters',
          },
        ],
      };
      const next = createMockNext(joiError as any);

      await errorHandler(ctx as Context, next);

      expect(ctx.status).toBe(400);
      expect(ctx.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: [
            { field: 'email', message: '"email" is required' },
            {
              field: 'password',
              message: '"password" must be at least 6 characters',
            },
          ],
        },
      });
    });

    it('應該處理 Sequelize 驗證錯誤', async () => {
      const sequelizeError = {
        name: 'SequelizeValidationError',
        errors: [{ path: 'email', message: 'Email must be unique' }],
      };
      const next = createMockNext(sequelizeError as any);

      await errorHandler(ctx as Context, next);

      expect(ctx.status).toBe(400);
      expect(ctx.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Database validation failed',
          details: [{ field: 'email', message: 'Email must be unique' }],
        },
      });
    });

    it('應該處理 Sequelize 唯一約束錯誤', async () => {
      const uniqueError = {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'email', message: 'email must be unique' }],
      };
      const next = createMockNext(uniqueError as any);

      await errorHandler(ctx as Context, next);

      expect(ctx.status).toBe(409);
      expect(ctx.body).toMatchObject({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'Resource already exists',
        },
      });
    });

    it('應該處理 JWT 錯誤', async () => {
      const jwtError = {
        name: 'JsonWebTokenError',
        message: 'invalid token',
      };
      const next = createMockNext(jwtError as any);

      await errorHandler(ctx as Context, next);

      expect(ctx.status).toBe(401);
      expect(ctx.body).toMatchObject({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid token',
        },
      });
    });

    it('應該處理 JWT 過期錯誤', async () => {
      const expiredError = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
      };
      const next = createMockNext(expiredError as any);

      await errorHandler(ctx as Context, next);

      expect(ctx.status).toBe(401);
      expect(ctx.body).toMatchObject({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Token expired',
        },
      });
    });

    it('應該處理未預期的錯誤', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const unexpectedError = new Error('Unexpected error');
      const next = createMockNext(unexpectedError);

      await errorHandler(ctx as Context, next);

      expect(ctx.status).toBe(500);
      expect(ctx.body).toMatchObject({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unexpected error:',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('AppError', () => {
    it('應該建立具有正確屬性的 AppError', () => {
      const error = new AppError('TEST_CODE', 'Test message', 400, {
        extra: 'data',
      });

      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ extra: 'data' });
      expect(error.name).toBe('AppError');
    });

    it('應該使用預設狀態碼 500', () => {
      const error = new AppError('TEST_CODE', 'Test message');

      expect(error.statusCode).toBe(500);
    });
  });

  describe('createSuccessResponse', () => {
    it('應該建立成功回應格式', () => {
      const data = { id: '1', name: 'Test' };
      const response = createSuccessResponse(data);

      expect(response).toMatchObject({
        success: true,
        data: { id: '1', name: 'Test' },
      });
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp)).toBeInstanceOf(Date);
    });

    it('應該處理 null 資料', () => {
      const response = createSuccessResponse(null);

      expect(response).toMatchObject({
        success: true,
        data: null,
      });
    });

    it('應該處理陣列資料', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const response = createSuccessResponse(data);

      expect(response).toMatchObject({
        success: true,
        data: [{ id: '1' }, { id: '2' }],
      });
    });
  });
});
