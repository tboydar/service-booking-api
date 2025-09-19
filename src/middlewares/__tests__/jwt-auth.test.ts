import { Context } from 'koa';
import jwt from 'jsonwebtoken';
import {
  jwtAuth,
  optionalJwtAuth,
  generateJWT,
  verifyJWT,
  JWTPayload,
} from '../jwt-auth';
import { AppError } from '../error-handler';

// Mock environment
jest.mock('../../config/environment', () => ({
  environment: {
    JWT_SECRET: 'test-secret-key',
  },
}));

// Mock context and next function
const createMockContext = (
  overrides: Partial<Context> = {}
): Partial<Context> => ({
  headers: {},
  ...overrides,
});

const createMockNext = () => jest.fn().mockResolvedValue(undefined);

describe('JWT 驗證中介軟體', () => {
  let ctx: Partial<Context>;
  let next: jest.Mock;
  const testSecret = 'test-secret-key';
  const testPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  };

  beforeEach(() => {
    ctx = createMockContext();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('jwtAuth', () => {
    it('應該通過有效的 JWT token 驗證', async () => {
      const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
      ctx.headers = {
        authorization: `Bearer ${token}`,
      };

      await jwtAuth(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.user).toMatchObject({
        userId: testPayload.userId,
        email: testPayload.email,
      });
      expect(ctx.user!.iat).toBeDefined();
      expect(ctx.user!.exp).toBeDefined();
    });

    it('應該拋出錯誤當缺少 Authorization header', async () => {
      ctx.headers = {};

      await expect(jwtAuth(ctx as Context, next)).rejects.toThrow(AppError);
      await expect(jwtAuth(ctx as Context, next)).rejects.toMatchObject({
        code: 'AUTHENTICATION_ERROR',
        message: 'Authorization header is required',
        statusCode: 401,
      });

      expect(next).not.toHaveBeenCalled();
      expect(ctx.user).toBeUndefined();
    });

    it('應該拋出錯誤當 Authorization header 格式不正確', async () => {
      ctx.headers = {
        authorization: 'InvalidFormat token',
      };

      await expect(jwtAuth(ctx as Context, next)).rejects.toThrow(AppError);
      await expect(jwtAuth(ctx as Context, next)).rejects.toMatchObject({
        code: 'AUTHENTICATION_ERROR',
        message:
          'Invalid authorization header format. Expected: Bearer <token>',
        statusCode: 401,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it('應該拋出錯誤當缺少 token', async () => {
      ctx.headers = {
        authorization: 'Bearer ',
      };

      await expect(jwtAuth(ctx as Context, next)).rejects.toThrow(AppError);
      await expect(jwtAuth(ctx as Context, next)).rejects.toMatchObject({
        code: 'AUTHENTICATION_ERROR',
        message: 'Token is required',
        statusCode: 401,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it('應該拋出錯誤當 token 無效', async () => {
      ctx.headers = {
        authorization: 'Bearer invalid-token',
      };

      await expect(jwtAuth(ctx as Context, next)).rejects.toThrow(AppError);
      await expect(jwtAuth(ctx as Context, next)).rejects.toMatchObject({
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid token',
        statusCode: 401,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it('應該拋出錯誤當 token 已過期', async () => {
      const expiredToken = jwt.sign(testPayload, testSecret, {
        expiresIn: '-1h',
      });
      ctx.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      await expect(jwtAuth(ctx as Context, next)).rejects.toThrow(AppError);
      await expect(jwtAuth(ctx as Context, next)).rejects.toMatchObject({
        code: 'AUTHENTICATION_ERROR',
        message: 'Token has expired',
        statusCode: 401,
      });

      expect(next).not.toHaveBeenCalled();
    });

    it('應該拋出錯誤當使用錯誤的密鑰簽署 token', async () => {
      const wrongSecretToken = jwt.sign(testPayload, 'wrong-secret', {
        expiresIn: '1h',
      });
      ctx.headers = {
        authorization: `Bearer ${wrongSecretToken}`,
      };

      await expect(jwtAuth(ctx as Context, next)).rejects.toThrow(AppError);
      await expect(jwtAuth(ctx as Context, next)).rejects.toMatchObject({
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid token',
        statusCode: 401,
      });

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalJwtAuth', () => {
    it('應該設定使用者資訊當提供有效 token', async () => {
      const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });
      ctx.headers = {
        authorization: `Bearer ${token}`,
      };

      await optionalJwtAuth(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.user).toMatchObject({
        userId: testPayload.userId,
        email: testPayload.email,
      });
    });

    it('應該繼續執行當沒有 Authorization header', async () => {
      ctx.headers = {};

      await optionalJwtAuth(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.user).toBeUndefined();
    });

    it('應該繼續執行當 Authorization header 格式不正確', async () => {
      ctx.headers = {
        authorization: 'InvalidFormat token',
      };

      await optionalJwtAuth(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.user).toBeUndefined();
    });

    it('應該繼續執行當 token 無效', async () => {
      ctx.headers = {
        authorization: 'Bearer invalid-token',
      };

      await optionalJwtAuth(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.user).toBeUndefined();
    });

    it('應該繼續執行當 token 已過期', async () => {
      const expiredToken = jwt.sign(testPayload, testSecret, {
        expiresIn: '-1h',
      });
      ctx.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      await optionalJwtAuth(ctx as Context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.user).toBeUndefined();
    });
  });

  describe('generateJWT', () => {
    it('應該生成有效的 JWT token', () => {
      const token = generateJWT(testPayload);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

      // Verify the token can be decoded
      const decoded = jwt.verify(token, testSecret) as JWTPayload;
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('應該設定正確的過期時間', () => {
      const token = generateJWT(testPayload);
      const decoded = jwt.verify(token, testSecret) as JWTPayload;

      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + 24 * 60 * 60; // 24 hours

      // Allow 1 second tolerance
      expect(decoded.exp!).toBeGreaterThan(expectedExp - 1);
      expect(decoded.exp!).toBeLessThan(expectedExp + 1);
    });
  });

  describe('verifyJWT', () => {
    it('應該驗證並解碼有效的 token', () => {
      const token = jwt.sign(testPayload, testSecret, { expiresIn: '1h' });

      const decoded = verifyJWT(token);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('應該拋出錯誤當 token 無效', () => {
      expect(() => verifyJWT('invalid-token')).toThrow();
    });

    it('應該拋出錯誤當 token 已過期', () => {
      const expiredToken = jwt.sign(testPayload, testSecret, {
        expiresIn: '-1h',
      });

      expect(() => verifyJWT(expiredToken)).toThrow('jwt expired');
    });

    it('應該拋出錯誤當使用錯誤的密鑰', () => {
      const wrongSecretToken = jwt.sign(testPayload, 'wrong-secret', {
        expiresIn: '1h',
      });

      expect(() => verifyJWT(wrongSecretToken)).toThrow('invalid signature');
    });
  });

  describe('Context 型別擴展', () => {
    it('應該允許在 Context 上設定 user 屬性', () => {
      const mockContext = createMockContext() as Context;

      mockContext.user = {
        userId: '123',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };

      expect(mockContext.user).toBeDefined();
      expect(mockContext.user.userId).toBe('123');
      expect(mockContext.user.email).toBe('test@example.com');
    });
  });
});
