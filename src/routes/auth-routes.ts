import Router from 'koa-router';
import { Context } from 'koa';

const router = new Router({ prefix: '/auth' });

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 用戶認證管理 API
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: 用戶註冊
 *     description: 註冊新的用戶帳號
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "password123"
 *             name: "張三"
 *     responses:
 *       201:
 *         description: 註冊成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   email: "user@example.com"
 *                   name: "張三"
 *                   createdAt: "2024-01-01T00:00:00.000Z"
 *                   updatedAt: "2024-01-01T00:00:00.000Z"
 *               message: "註冊成功"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: 請求資料驗證失敗
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "VALIDATION_ERROR"
 *                 message: "輸入資料驗證失敗"
 *                 details:
 *                   - field: "email"
 *                     message: "請輸入有效的電子郵件"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/auth/register"
 *       409:
 *         description: 電子郵件已被使用
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "EMAIL_EXISTS"
 *                 message: "此電子郵件已被使用"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/auth/register"
 */
router.post('/register', async (ctx: Context) => {
  // TODO: 實作註冊邏輯
  ctx.status = 501;
  ctx.body = {
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: '此端點尚未實作',
    },
    timestamp: new Date().toISOString(),
    path: ctx.path,
  };
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 用戶登入
 *     description: 用戶登入並獲取 JWT Token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: 登入成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   email: "user@example.com"
 *                   name: "張三"
 *                   createdAt: "2024-01-01T00:00:00.000Z"
 *                   updatedAt: "2024-01-01T00:00:00.000Z"
 *               message: "登入成功"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: 請求資料驗證失敗
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "VALIDATION_ERROR"
 *                 message: "輸入資料驗證失敗"
 *                 details:
 *                   - field: "email"
 *                     message: "請輸入有效的電子郵件"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/auth/login"
 *       401:
 *         description: 認證失敗
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "INVALID_CREDENTIALS"
 *                 message: "電子郵件或密碼錯誤"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/auth/login"
 */
router.post('/login', async (ctx: Context) => {
  // TODO: 實作登入邏輯
  ctx.status = 501;
  ctx.body = {
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: '此端點尚未實作',
    },
    timestamp: new Date().toISOString(),
    path: ctx.path,
  };
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 用戶登出
 *     description: 登出當前用戶，使 Token 失效
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: 登出成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "登出成功"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       401:
 *         description: 未提供有效的認證 Token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "UNAUTHORIZED"
 *                 message: "請提供有效的認證 Token"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/auth/logout"
 */
router.post('/logout', async (ctx: Context) => {
  // TODO: 實作登出邏輯
  ctx.status = 501;
  ctx.body = {
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: '此端點尚未實作',
    },
    timestamp: new Date().toISOString(),
    path: ctx.path,
  };
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: 更新 Token
 *     description: 使用現有的 Token 獲取新的 Token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   email: "user@example.com"
 *                   name: "張三"
 *                   createdAt: "2024-01-01T00:00:00.000Z"
 *                   updatedAt: "2024-01-01T00:00:00.000Z"
 *               message: "Token 更新成功"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       401:
 *         description: Token 已過期或無效
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "TOKEN_EXPIRED"
 *                 message: "Token 已過期，請重新登入"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/auth/refresh"
 */
router.post('/refresh', async (ctx: Context) => {
  // TODO: 實作 Token 更新邏輯
  ctx.status = 501;
  ctx.body = {
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: '此端點尚未實作',
    },
    timestamp: new Date().toISOString(),
    path: ctx.path,
  };
});

export { router as authRoutes };