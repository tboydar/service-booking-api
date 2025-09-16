import Joi from 'joi';

/**
 * 會員註冊驗證 Schema
 * 驗證 email、password 和 name 欄位
 */
export const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Email 格式不正確',
      'string.empty': 'Email 不能為空',
      'any.required': 'Email 為必填欄位',
    }),

  password: Joi.string().min(6).max(128).required().messages({
    'string.min': '密碼長度至少需要 6 個字元',
    'string.max': '密碼長度不能超過 128 個字元',
    'string.empty': '密碼不能為空',
    'any.required': '密碼為必填欄位',
  }),

  name: Joi.string().min(2).max(50).trim().required().messages({
    'string.min': '姓名長度至少需要 2 個字元',
    'string.max': '姓名長度不能超過 50 個字元',
    'string.empty': '姓名不能為空',
    'any.required': '姓名為必填欄位',
  }),
});

/**
 * 會員登入驗證 Schema
 * 驗證 email 和 password 欄位
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Email 格式不正確',
      'string.empty': 'Email 不能為空',
      'any.required': 'Email 為必填欄位',
    }),

  password: Joi.string().required().messages({
    'string.empty': '密碼不能為空',
    'any.required': '密碼為必填欄位',
  }),
});

/**
 * 註冊請求的 TypeScript 介面
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * 登入請求的 TypeScript 介面
 */
export interface LoginRequest {
  email: string;
  password: string;
}
