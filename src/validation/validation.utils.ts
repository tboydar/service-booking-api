import Joi from 'joi';

/**
 * 驗證錯誤的詳細資訊介面
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

/**
 * 驗證結果介面
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationErrorDetail[];
}

/**
 * 驗證工具類別
 */
export class ValidationUtils {
  /**
   * 驗證資料並回傳格式化的結果
   * @param schema Joi 驗證 schema
   * @param data 要驗證的資料
   * @returns 驗證結果
   */
  static validate<T>(schema: Joi.Schema, data: any): ValidationResult<T> {
    const { error, value } = schema.validate(data, {
      abortEarly: false, // 收集所有錯誤
      stripUnknown: true, // 移除未知欄位
      convert: true, // 自動轉換型別
    });

    if (error) {
      const errors: ValidationErrorDetail[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return {
        success: false,
        errors,
      };
    }

    return {
      success: true,
      data: value as T,
    };
  }

  /**
   * 格式化驗證錯誤訊息
   * @param errors 驗證錯誤陣列
   * @returns 格式化的錯誤訊息
   */
  static formatValidationErrors(errors: ValidationErrorDetail[]): string {
    return errors.map(error => `${error.field}: ${error.message}`).join('; ');
  }

  /**
   * 檢查是否為有效的 UUID v4
   * @param value 要檢查的值
   * @returns 是否為有效的 UUID v4
   */
  static isValidUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * 清理和標準化 email
   * @param email 原始 email
   * @returns 清理後的 email
   */
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * 清理字串，移除多餘空白
   * @param str 原始字串
   * @returns 清理後的字串
   */
  static sanitizeString(str: string): string {
    return str.trim().replace(/\s+/g, ' ');
  }
}
