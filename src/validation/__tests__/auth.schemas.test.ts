import {
  registerSchema,
  loginSchema,
  RegisterRequest,
  LoginRequest,
} from '../auth.schemas';
import { ValidationUtils } from '../validation.utils';

describe('Authentication Schemas', () => {
  describe('registerSchema', () => {
    it('應該通過有效的註冊資料驗證', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const result = ValidationUtils.validate<RegisterRequest>(
        registerSchema,
        validData
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });

    it('應該拒絕無效的 email 格式', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      const result = ValidationUtils.validate<RegisterRequest>(
        registerSchema,
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].field).toBe('email');
      expect(result.errors![0].message).toBe('Email 格式不正確');
    });

    it('應該拒絕過短的密碼', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      };

      const result = ValidationUtils.validate<RegisterRequest>(
        registerSchema,
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      if (result.errors) {
        expect(result.errors[0].field).toBe('password');
        expect(result.errors[0].message).toBe('密碼長度至少需要 6 個字元');
      }
    });

    it('應該拒絕過短的姓名', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'A',
      };

      const result = ValidationUtils.validate<RegisterRequest>(
        registerSchema,
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      if (result.errors) {
        expect(result.errors[0].field).toBe('name');
        expect(result.errors[0].message).toBe('姓名長度至少需要 2 個字元');
      }
    });

    it('應該自動清理和轉換 email 為小寫', () => {
      const dataWithUppercaseEmail = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
        name: '  Test User  ',
      };

      const result = ValidationUtils.validate<RegisterRequest>(
        registerSchema,
        dataWithUppercaseEmail
      );

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.name).toBe('Test User');
      }
    });
  });

  describe('loginSchema', () => {
    it('應該通過有效的登入資料驗證', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = ValidationUtils.validate<LoginRequest>(
        loginSchema,
        validData
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('應該拒絕缺少必填欄位', () => {
      const invalidData = {
        email: 'test@example.com',
        // 缺少 password
      };

      const result = ValidationUtils.validate<LoginRequest>(
        loginSchema,
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      if (result.errors) {
        expect(result.errors[0].field).toBe('password');
        expect(result.errors[0].message).toBe('密碼為必填欄位');
      }
    });
  });
});
