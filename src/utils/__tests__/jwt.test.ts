// Set test environment variables before importing modules
process.env['JWT_SECRET'] = 'test-jwt-secret';
process.env['JWT_EXPIRES_IN'] = '24h';

import { JWTUtils, JWTPayload } from '../jwt';
import { config } from '../../config/environment';

// Mock jsonwebtoken module
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
  TokenExpiredError: class TokenExpiredError extends Error {
    constructor(message: string, _expiredAt: Date) {
      super(message);
      this.name = 'TokenExpiredError';
    }
  },
  JsonWebTokenError: class JsonWebTokenError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'JsonWebTokenError';
    }
  },
}));

// Mock config
jest.mock('../../config/environment', () => ({
  config: {
    JWT_SECRET: 'test-secret-key',
    JWT_EXPIRES_IN: '24h',
  },
}));

describe('JWTUtils', () => {
  const jwt = require('jsonwebtoken');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('應該成功生成 JWT token', () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const expectedToken = 'jwt.token.here';

      jwt.sign.mockReturnValue(expectedToken);

      const result = JWTUtils.generateToken(userId, email);

      expect(result).toBe(expectedToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId, email },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
      );
    });

    it('當 userId 為空字串時應該拋出錯誤', () => {
      expect(() => JWTUtils.generateToken('', 'test@example.com')).toThrow(
        'User ID must be a non-empty string'
      );
    });

    it('當 email 為空字串時應該拋出錯誤', () => {
      expect(() => JWTUtils.generateToken('user-123', '')).toThrow(
        'Email must be a non-empty string'
      );
    });

    it('當參數不是字串時應該拋出錯誤', () => {
      expect(() =>
        JWTUtils.generateToken(null as any, 'test@example.com')
      ).toThrow('User ID must be a non-empty string');

      expect(() => JWTUtils.generateToken('user-123', null as any)).toThrow(
        'Email must be a non-empty string'
      );
    });

    it('當 jwt.sign 失敗時應該拋出錯誤', () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const error = new Error('JWT sign error');

      jwt.sign.mockImplementation(() => {
        throw error;
      });

      expect(() => JWTUtils.generateToken(userId, email)).toThrow(
        'Failed to generate JWT token: JWT sign error'
      );
    });
  });

  describe('verifyToken', () => {
    it('應該成功驗證並解碼 token', () => {
      const token = 'valid.jwt.token';
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890 + 86400,
      };

      jwt.verify.mockReturnValue(payload);

      const result = JWTUtils.verifyToken(token);

      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalledWith(token, config.JWT_SECRET);
    });

    it('當 token 為空字串時應該拋出錯誤', () => {
      expect(() => JWTUtils.verifyToken('')).toThrow(
        'Token must be a non-empty string'
      );
    });

    it('當 token 不是字串時應該拋出錯誤', () => {
      expect(() => JWTUtils.verifyToken(null as any)).toThrow(
        'Token must be a non-empty string'
      );
    });

    it('當 token 過期時應該拋出特定錯誤', () => {
      const token = 'expired.jwt.token';
      const error = new jwt.TokenExpiredError('jwt expired', new Date());

      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => JWTUtils.verifyToken(token)).toThrow('Token has expired');
    });

    it('當 token 無效時應該拋出特定錯誤', () => {
      const token = 'invalid.jwt.token';
      const error = new jwt.JsonWebTokenError('invalid token');

      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => JWTUtils.verifyToken(token)).toThrow('Invalid token');
    });

    it('當其他 JWT 錯誤時應該拋出一般錯誤', () => {
      const token = 'problematic.jwt.token';
      const error = new Error('Other JWT error');

      jwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => JWTUtils.verifyToken(token)).toThrow(
        'Failed to verify JWT token: Other JWT error'
      );
    });
  });

  describe('extractTokenFromHeader', () => {
    it('應該從正確格式的 Authorization header 中提取 token', () => {
      const authHeader = 'Bearer valid.jwt.token';
      const result = JWTUtils.extractTokenFromHeader(authHeader);

      expect(result).toBe('valid.jwt.token');
    });

    it('當 header 格式不正確時應該回傳 null', () => {
      expect(JWTUtils.extractTokenFromHeader('InvalidFormat')).toBeNull();
      expect(JWTUtils.extractTokenFromHeader('Bearer')).toBeNull();
      expect(JWTUtils.extractTokenFromHeader('Basic token')).toBeNull();
      expect(JWTUtils.extractTokenFromHeader('Bearer token extra')).toBeNull();
    });

    it('當 header 為空或不是字串時應該回傳 null', () => {
      expect(JWTUtils.extractTokenFromHeader('')).toBeNull();
      expect(JWTUtils.extractTokenFromHeader(null as any)).toBeNull();
      expect(JWTUtils.extractTokenFromHeader(undefined as any)).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('當 token 有效時應該回傳 false', () => {
      const token = 'valid.jwt.token';
      jwt.verify.mockReturnValue({} as any);

      const result = JWTUtils.isTokenExpired(token);

      expect(result).toBe(false);
      expect(jwt.verify).toHaveBeenCalledWith(token, config.JWT_SECRET);
    });

    it('當 token 過期時應該回傳 true', () => {
      const token = 'expired.jwt.token';
      const error = new jwt.TokenExpiredError('jwt expired', new Date());

      jwt.verify.mockImplementation(() => {
        throw error;
      });

      const result = JWTUtils.isTokenExpired(token);

      expect(result).toBe(true);
    });

    it('當 token 無效時應該回傳 true', () => {
      const token = 'invalid.jwt.token';
      const error = new jwt.JsonWebTokenError('invalid token');

      jwt.verify.mockImplementation(() => {
        throw error;
      });

      const result = JWTUtils.isTokenExpired(token);

      expect(result).toBe(true);
    });

    it('當 token 為空或不是字串時應該回傳 true', () => {
      expect(JWTUtils.isTokenExpired('')).toBe(true);
      expect(JWTUtils.isTokenExpired(null as any)).toBe(true);
      expect(JWTUtils.isTokenExpired(undefined as any)).toBe(true);
    });
  });

  describe('decodeToken', () => {
    it('應該成功解碼 token 而不驗證', () => {
      const token = 'jwt.token.here';
      const decodedPayload = { userId: 'user-123', email: 'test@example.com' };

      jwt.decode.mockReturnValue(decodedPayload);

      const result = JWTUtils.decodeToken(token);

      expect(result).toEqual(decodedPayload);
      expect(jwt.decode).toHaveBeenCalledWith(token);
    });

    it('當 token 為空字串時應該拋出錯誤', () => {
      expect(() => JWTUtils.decodeToken('')).toThrow(
        'Token must be a non-empty string'
      );
    });

    it('當 token 不是字串時應該拋出錯誤', () => {
      expect(() => JWTUtils.decodeToken(null as any)).toThrow(
        'Token must be a non-empty string'
      );
    });

    it('當 jwt.decode 失敗時應該拋出錯誤', () => {
      const token = 'malformed.token';
      const error = new Error('Decode error');

      jwt.decode.mockImplementation(() => {
        throw error;
      });

      expect(() => JWTUtils.decodeToken(token)).toThrow(
        'Failed to decode JWT token: Decode error'
      );
    });
  });
});
