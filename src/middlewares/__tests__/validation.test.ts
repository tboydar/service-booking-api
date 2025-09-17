import { Context } from 'koa';
import Joi from 'joi';
import {
  validateBody,
  validateParams,
  validateQuery,
  commonSchemas,
} from '../validation';

// Mock context and next function
const createMockContext = (
  overrides: Partial<Context> = {}
): Partial<Context> => ({
  request: {
    body: {},
  } as any,
  params: {} as any,
  query: {} as any,
  ...overrides,
});

const createMockNext = () => jest.fn().mockResolvedValue(undefined);

describe('驗證中介軟體', () => {
  let ctx: Partial<Context>;
  let next: jest.Mock;

  beforeEach(() => {
    ctx = createMockContext();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('validateBody', () => {
    const testSchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      age: Joi.number().optional(),
    });

    it('應該通過有效的請求體驗證', async () => {
      ctx.request!.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const middleware = validateBody(testSchema);
      await middleware(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.request!.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      });
    });

    it('應該移除未知欄位當 stripUnknown 為 true', async () => {
      ctx.request!.body = {
        name: 'John Doe',
        email: 'john@example.com',
        unknownField: 'should be removed',
      };

      const middleware = validateBody(testSchema, { stripUnknown: true });
      await middleware(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.request!.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(ctx.request!.body).not.toHaveProperty('unknownField');
    });

    it('應該拋出驗證錯誤當必填欄位缺失', async () => {
      ctx.request!.body = {
        name: 'John Doe',
        // email is missing
      };

      const middleware = validateBody(testSchema);

      await expect(middleware(ctx as Context, next)).rejects.toMatchObject({
        isJoi: true,
        details: expect.arrayContaining([
          expect.objectContaining({
            path: ['email'],
          }),
        ]),
      });

      expect(next).not.toHaveBeenCalled();
    });

    it('應該拋出驗證錯誤當欄位格式不正確', async () => {
      ctx.request!.body = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 'not-a-number',
      };

      const middleware = validateBody(testSchema);

      await expect(middleware(ctx as Context, next)).rejects.toMatchObject({
        isJoi: true,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it('應該處理空的請求體', async () => {
      ctx.request!.body = {};

      const middleware = validateBody(testSchema);

      await expect(middleware(ctx as Context, next)).rejects.toMatchObject({
        isJoi: true,
      });
    });
  });

  describe('validateParams', () => {
    const paramsSchema = Joi.object({
      id: Joi.string().uuid().required(),
      slug: Joi.string().optional(),
    });

    it('應該通過有效的參數驗證', async () => {
      (ctx as any).params = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test-slug',
      };

      const middleware = validateParams(paramsSchema);
      await middleware(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect((ctx as any).params).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test-slug',
      });
    });

    it('應該拋出驗證錯誤當 UUID 格式不正確', async () => {
      (ctx as any).params = {
        id: 'invalid-uuid',
      };

      const middleware = validateParams(paramsSchema);

      await expect(middleware(ctx as Context, next)).rejects.toMatchObject({
        isJoi: true,
      });

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateQuery', () => {
    const querySchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().optional(),
    });

    it('應該通過有效的查詢參數驗證', async () => {
      (ctx as any).query = {
        page: '2',
        limit: '20',
        search: 'test',
      };

      const middleware = validateQuery(querySchema);
      await middleware(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect((ctx as any).query).toEqual({
        page: 2,
        limit: 20,
        search: 'test',
      });
    });

    it('應該使用預設值當參數缺失', async () => {
      (ctx as any).query = {};

      const middleware = validateQuery(querySchema);
      await middleware(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect((ctx as any).query).toEqual({
        page: 1,
        limit: 10,
      });
    });

    it('應該拋出驗證錯誤當參數超出範圍', async () => {
      (ctx as any).query = {
        page: '0',
        limit: '200',
      };

      const middleware = validateQuery(querySchema);

      await expect(middleware(ctx as Context, next)).rejects.toMatchObject({
        isJoi: true,
      });

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('commonSchemas', () => {
    describe('uuid', () => {
      it('應該驗證有效的 UUID', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const { error } = commonSchemas.uuid.validate(validUuid);

        expect(error).toBeUndefined();
      });

      it('應該拒絕無效的 UUID', () => {
        const invalidUuid = 'invalid-uuid';
        const { error } = commonSchemas.uuid.validate(invalidUuid);

        expect(error).toBeDefined();
      });
    });

    describe('pagination', () => {
      it('應該驗證有效的分頁參數', () => {
        const validPagination = { page: 2, limit: 20 };
        const { error, value } =
          commonSchemas.pagination.validate(validPagination);

        expect(error).toBeUndefined();
        expect(value).toEqual({ page: 2, limit: 20 });
      });

      it('應該使用預設值', () => {
        const { error, value } = commonSchemas.pagination.validate({});

        expect(error).toBeUndefined();
        expect(value).toEqual({ page: 1, limit: 10 });
      });

      it('應該拒絕無效的分頁參數', () => {
        const invalidPagination = { page: 0, limit: 200 };
        const { error } = commonSchemas.pagination.validate(invalidPagination);

        expect(error).toBeDefined();
      });
    });
  });

  describe('驗證選項', () => {
    const testSchema = Joi.object({
      name: Joi.string().required(),
      extra: Joi.string().optional(),
    });

    it('應該允許未知欄位當 allowUnknown 為 true', async () => {
      ctx.request!.body = {
        name: 'John',
        unknownField: 'allowed',
      };

      const middleware = validateBody(testSchema, {
        allowUnknown: true,
        stripUnknown: false,
      });
      await middleware(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.request!.body).toHaveProperty('unknownField');
    });

    it('應該在第一個錯誤時停止當 abortEarly 為 true', async () => {
      ctx.request!.body = {
        // name is missing
        extra: 123, // wrong type
      };

      const middleware = validateBody(testSchema, { abortEarly: true });

      try {
        await middleware(ctx as Context, next);
      } catch (error: any) {
        expect(error.details).toHaveLength(1);
      }

      expect(next).not.toHaveBeenCalled();
    });
  });
});
