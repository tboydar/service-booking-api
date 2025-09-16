import Joi from 'joi';

/**
 * 服務建立驗證 Schema
 * 驗證所有必要和可選欄位
 */
export const createServiceSchema = Joi.object({
  name: Joi.string().min(1).max(255).trim().required().messages({
    'string.min': '服務名稱不能為空',
    'string.max': '服務名稱長度不能超過 255 個字元',
    'string.empty': '服務名稱不能為空',
    'any.required': '服務名稱為必填欄位',
  }),

  description: Joi.string().max(1000).trim().allow('').optional().messages({
    'string.max': '服務描述長度不能超過 1000 個字元',
  }),

  price: Joi.number().integer().min(0).required().messages({
    'number.base': '價格必須為數字',
    'number.integer': '價格必須為整數',
    'number.min': '價格不能為負數',
    'any.required': '價格為必填欄位',
  }),

  showTime: Joi.number().integer().min(0).optional().messages({
    'number.base': '顯示時間必須為數字',
    'number.integer': '顯示時間必須為整數',
    'number.min': '顯示時間不能為負數',
  }),

  order: Joi.number().integer().min(0).default(0).optional().messages({
    'number.base': '排序必須為數字',
    'number.integer': '排序必須為整數',
    'number.min': '排序不能為負數',
  }),

  isPublic: Joi.boolean().default(true).optional().messages({
    'boolean.base': '公開狀態必須為布林值',
  }),
});

/**
 * 服務更新驗證 Schema
 * 所有欄位都是可選的，但至少要有一個欄位
 */
export const updateServiceSchema = Joi.object({
  name: Joi.string().min(1).max(255).trim().optional().messages({
    'string.min': '服務名稱不能為空',
    'string.max': '服務名稱長度不能超過 255 個字元',
    'string.empty': '服務名稱不能為空',
  }),

  description: Joi.string().max(1000).trim().allow('').optional().messages({
    'string.max': '服務描述長度不能超過 1000 個字元',
  }),

  price: Joi.number().integer().min(0).optional().messages({
    'number.base': '價格必須為數字',
    'number.integer': '價格必須為整數',
    'number.min': '價格不能為負數',
  }),

  showTime: Joi.number().integer().min(0).optional().messages({
    'number.base': '顯示時間必須為數字',
    'number.integer': '顯示時間必須為整數',
    'number.min': '顯示時間不能為負數',
  }),

  order: Joi.number().integer().min(0).optional().messages({
    'number.base': '排序必須為數字',
    'number.integer': '排序必須為整數',
    'number.min': '排序不能為負數',
  }),

  isPublic: Joi.boolean().optional().messages({
    'boolean.base': '公開狀態必須為布林值',
  }),
})
  .min(1)
  .messages({
    'object.min': '至少需要提供一個要更新的欄位',
  });

/**
 * UUID 參數驗證 Schema
 * 用於驗證路由參數中的 ID
 */
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'ID 格式不正確',
    'any.required': 'ID 為必填欄位',
  }),
});

/**
 * 服務建立請求的 TypeScript 介面
 */
export interface CreateServiceRequest {
  name: string;
  description?: string;
  price: number;
  showTime?: number;
  order?: number;
  isPublic?: boolean;
}

/**
 * 服務更新請求的 TypeScript 介面
 */
export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  price?: number;
  showTime?: number;
  order?: number;
  isPublic?: boolean;
}

/**
 * UUID 參數的 TypeScript 介面
 */
export interface UuidParam {
  id: string;
}
