import { ValidationUtils } from '../validation.utils';
import Joi from 'joi';

describe('ValidationUtils', () => {
  describe('validate', () => {
    const testSchema = Joi.object({
      name: Joi.string().required(),
      age: Joi.number().integer().min(0).required(),
    });

    it('應該回傳成功結果當資料有效時', () => {
      const validData = { name: 'John', age: 25 };
      const result = ValidationUtils.validate(testSchema, validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('應該回傳錯誤結果當資料無效時', () => {
      const invalidData = { name: '', age: -1 };
      const result = ValidationUtils.validate(testSchema, invalidData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toHaveLength(2);
    });

    it('應該移除未知欄位', () => {
      const dataWithUnknownField = {
        name: 'John',
        age: 25,
        unknownField: 'should be removed',
      };
      const result = ValidationUtils.validate(testSchema, dataWithUnknownField);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'John', age: 25 });
      expect(result.data).not.toHaveProperty('unknownField');
    });
  });

  describe('formatValidationErrors', () => {
    it('應該格式化單一錯誤', () => {
      const errors = [{ field: 'name', message: '名稱為必填欄位' }];

      const formatted = ValidationUtils.formatValidationErrors(errors);
      expect(formatted).toBe('name: 名稱為必填欄位');
    });

    it('應該格式化多個錯誤', () => {
      const errors = [
        { field: 'name', message: '名稱為必填欄位' },
        { field: 'age', message: '年齡必須為正數' },
      ];

      const formatted = ValidationUtils.formatValidationErrors(errors);
      expect(formatted).toBe('name: 名稱為必填欄位; age: 年齡必須為正數');
    });
  });

  describe('isValidUUID', () => {
    it('應該識別有效的 UUID v4', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      expect(ValidationUtils.isValidUUID(validUUID)).toBe(true);
    });

    it('應該拒絕無效的 UUID', () => {
      const invalidUUIDs = [
        'invalid-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-44665544000g',
        '',
      ];

      invalidUUIDs.forEach(uuid => {
        expect(ValidationUtils.isValidUUID(uuid)).toBe(false);
      });
    });
  });

  describe('normalizeEmail', () => {
    it('應該轉換為小寫並移除空白', () => {
      const email = '  TEST@EXAMPLE.COM  ';
      const normalized = ValidationUtils.normalizeEmail(email);
      expect(normalized).toBe('test@example.com');
    });

    it('應該處理已經正確格式的 email', () => {
      const email = 'test@example.com';
      const normalized = ValidationUtils.normalizeEmail(email);
      expect(normalized).toBe('test@example.com');
    });
  });

  describe('sanitizeString', () => {
    it('應該移除前後空白並合併多個空白', () => {
      const str = '  Hello    World  ';
      const sanitized = ValidationUtils.sanitizeString(str);
      expect(sanitized).toBe('Hello World');
    });

    it('應該處理只有空白的字串', () => {
      const str = '   ';
      const sanitized = ValidationUtils.sanitizeString(str);
      expect(sanitized).toBe('');
    });

    it('應該處理正常字串', () => {
      const str = 'Hello World';
      const sanitized = ValidationUtils.sanitizeString(str);
      expect(sanitized).toBe('Hello World');
    });
  });
});
