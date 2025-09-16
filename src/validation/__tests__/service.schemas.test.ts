import {
  createServiceSchema,
  updateServiceSchema,
  uuidParamSchema,
  CreateServiceRequest,
  UpdateServiceRequest,
  UuidParam,
} from '../service.schemas';
import { ValidationUtils } from '../validation.utils';

describe('Service Schemas', () => {
  describe('createServiceSchema', () => {
    it('應該通過有效的服務建立資料驗證', () => {
      const validData = {
        name: 'Test Service',
        description: 'A test service',
        price: 1000,
        showTime: 60,
        order: 1,
        isPublic: true,
      };

      const result = ValidationUtils.validate<CreateServiceRequest>(
        createServiceSchema,
        validData
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('應該通過只有必填欄位的資料驗證', () => {
      const minimalData = {
        name: 'Test Service',
        price: 1000,
      };

      const result = ValidationUtils.validate<CreateServiceRequest>(
        createServiceSchema,
        minimalData
      );

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.name).toBe('Test Service');
        expect(result.data.price).toBe(1000);
        expect(result.data.order).toBe(0); // 預設值
        expect(result.data.isPublic).toBe(true); // 預設值
      }
    });

    it('應該拒絕空的服務名稱', () => {
      const invalidData = {
        name: '',
        price: 1000,
      };

      const result = ValidationUtils.validate<CreateServiceRequest>(
        createServiceSchema,
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      if (result.errors) {
        expect(result.errors[0].field).toBe('name');
        expect(result.errors[0].message).toBe('服務名稱不能為空');
      }
    });

    it('應該拒絕負數價格', () => {
      const invalidData = {
        name: 'Test Service',
        price: -100,
      };

      const result = ValidationUtils.validate<CreateServiceRequest>(
        createServiceSchema,
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      if (result.errors) {
        expect(result.errors[0].field).toBe('price');
        expect(result.errors[0].message).toBe('價格不能為負數');
      }
    });

    it('應該拒絕非整數價格', () => {
      const invalidData = {
        name: 'Test Service',
        price: 100.5,
      };

      const result = ValidationUtils.validate<CreateServiceRequest>(
        createServiceSchema,
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      if (result.errors) {
        expect(result.errors[0].field).toBe('price');
        expect(result.errors[0].message).toBe('價格必須為整數');
      }
    });

    it('應該自動清理服務名稱和描述的空白', () => {
      const dataWithWhitespace = {
        name: '  Test Service  ',
        description: '  A test service  ',
        price: 1000,
      };

      const result = ValidationUtils.validate<CreateServiceRequest>(
        createServiceSchema,
        dataWithWhitespace
      );

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.name).toBe('Test Service');
        expect(result.data.description).toBe('A test service');
      }
    });
  });

  describe('updateServiceSchema', () => {
    it('應該通過有效的更新資料驗證', () => {
      const validData = {
        name: 'Updated Service',
        price: 2000,
      };

      const result = ValidationUtils.validate<UpdateServiceRequest>(
        updateServiceSchema,
        validData
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('應該通過單一欄位更新', () => {
      const singleFieldData = {
        name: 'Updated Service',
      };

      const result = ValidationUtils.validate<UpdateServiceRequest>(
        updateServiceSchema,
        singleFieldData
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(singleFieldData);
    });

    it('應該拒絕空的更新資料', () => {
      const emptyData = {};

      const result = ValidationUtils.validate<UpdateServiceRequest>(
        updateServiceSchema,
        emptyData
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      if (result.errors) {
        expect(result.errors[0].message).toBe('至少需要提供一個要更新的欄位');
      }
    });

    it('應該允許空字串描述', () => {
      const dataWithEmptyDescription = {
        description: '',
      };

      const result = ValidationUtils.validate<UpdateServiceRequest>(
        updateServiceSchema,
        dataWithEmptyDescription
      );

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.description).toBe('');
      }
    });
  });

  describe('uuidParamSchema', () => {
    it('應該通過有效的 UUID v4', () => {
      const validData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = ValidationUtils.validate<UuidParam>(
        uuidParamSchema,
        validData
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('應該拒絕無效的 UUID 格式', () => {
      const invalidData = {
        id: 'invalid-uuid',
      };

      const result = ValidationUtils.validate<UuidParam>(
        uuidParamSchema,
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      if (result.errors) {
        expect(result.errors[0].field).toBe('id');
        expect(result.errors[0].message).toBe('ID 格式不正確');
      }
    });

    it('應該拒絕缺少 ID', () => {
      const invalidData = {};

      const result = ValidationUtils.validate<UuidParam>(
        uuidParamSchema,
        invalidData
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      if (result.errors) {
        expect(result.errors[0].field).toBe('id');
        expect(result.errors[0].message).toBe('ID 為必填欄位');
      }
    });
  });
});
