import Router from 'koa-router';
import { Context } from 'koa';

const router = new Router({ prefix: '/services' });

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: 服務管理 API
 */

/**
 * @swagger
 * /services:
 *   get:
 *     summary: 獲取服務列表
 *     description: 獲取所有公開的服務列表，支援分頁和排序
 *     tags: [Services]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 頁碼
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每頁筆數
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, order, createdAt]
 *           default: order
 *         description: 排序欄位
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 成功獲取服務列表
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       required: [services, pagination]
 *                       properties:
 *                         services:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Service'
 *                         pagination:
 *                           type: object
 *                           required: [currentPage, totalPages, totalItems, pageSize]
 *                           properties:
 *                             currentPage:
 *                               type: integer
 *                               example: 1
 *                             totalPages:
 *                               type: integer
 *                               example: 5
 *                             totalItems:
 *                               type: integer
 *                               example: 50
 *                             pageSize:
 *                               type: integer
 *                               example: 10
 *             example:
 *               success: true
 *               data:
 *                 services:
 *                   - id: "123e4567-e89b-12d3-a456-426614174001"
 *                     name: "網站開發服務"
 *                     description: "提供專業的網站開發服務"
 *                     price: 50000
 *                     showTime: 60
 *                     order: 1
 *                     isPublic: true
 *                     createdAt: "2024-01-01T00:00:00.000Z"
 *                     updatedAt: "2024-01-01T00:00:00.000Z"
 *                 pagination:
 *                   currentPage: 1
 *                   totalPages: 3
 *                   totalItems: 25
 *                   pageSize: 10
 *               message: "成功獲取服務列表"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 */
router.get('/', async (ctx: Context) => {
  // TODO: 實作服務列表獲取邏輯
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
 * /services/{id}:
 *   get:
 *     summary: 獲取服務詳情
 *     description: 根據服務 ID 獲取特定服務的詳細資訊
 *     tags: [Services]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 服務 ID
 *         example: "123e4567-e89b-12d3-a456-426614174001"
 *     responses:
 *       200:
 *         description: 成功獲取服務詳情
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Service'
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174001"
 *                 name: "網站開發服務"
 *                 description: "提供專業的網站開發服務，包含前端和後端開發"
 *                 price: 50000
 *                 showTime: 60
 *                 order: 1
 *                 isPublic: true
 *                 createdAt: "2024-01-01T00:00:00.000Z"
 *                 updatedAt: "2024-01-01T00:00:00.000Z"
 *               message: "成功獲取服務詳情"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: 無效的服務 ID 格式
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "VALIDATION_ERROR"
 *                 message: "ID 格式不正確"
 *                 details:
 *                   - field: "id"
 *                     message: "請提供有效的 UUID 格式"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/services/invalid-id"
 *       404:
 *         description: 服務不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "SERVICE_NOT_FOUND"
 *                 message: "找不到指定的服務"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/services/123e4567-e89b-12d3-a456-426614174999"
 */
router.get('/:id', async (ctx: Context) => {
  // TODO: 實作服務詳情獲取邏輯
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
 * /services:
 *   post:
 *     summary: 創建新服務
 *     description: 創建新的服務項目（需要管理員權限）
 *     tags: [Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateServiceRequest'
 *           example:
 *             name: "網站開發服務"
 *             description: "提供專業的網站開發服務，包含前端和後端開發"
 *             price: 50000
 *             showTime: 60
 *             order: 1
 *             isPublic: true
 *     responses:
 *       201:
 *         description: 服務創建成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Service'
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174001"
 *                 name: "網站開發服務"
 *                 description: "提供專業的網站開發服務，包含前端和後端開發"
 *                 price: 50000
 *                 showTime: 60
 *                 order: 1
 *                 isPublic: true
 *                 createdAt: "2024-01-01T00:00:00.000Z"
 *                 updatedAt: "2024-01-01T00:00:00.000Z"
 *               message: "服務創建成功"
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
 *                   - field: "name"
 *                     message: "服務名稱不能為空"
 *                   - field: "price"
 *                     message: "價格不能為負數"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/services"
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
 *               path: "/services"
 *       403:
 *         description: 權限不足
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "FORBIDDEN"
 *                 message: "權限不足，無法執行此操作"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/services"
 */
router.post('/', async (ctx: Context) => {
  // TODO: 實作服務創建邏輯
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
 * /services/{id}:
 *   put:
 *     summary: 更新服務
 *     description: 更新指定的服務項目（需要管理員權限）
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 服務 ID
 *         example: "123e4567-e89b-12d3-a456-426614174001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateServiceRequest'
 *           example:
 *             name: "更新的網站開發服務"
 *             price: 60000
 *             description: "提供更全面的網站開發服務"
 *     responses:
 *       200:
 *         description: 服務更新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Service'
 *             example:
 *               success: true
 *               data:
 *                 id: "123e4567-e89b-12d3-a456-426614174001"
 *                 name: "更新的網站開發服務"
 *                 description: "提供更全面的網站開發服務"
 *                 price: 60000
 *                 showTime: 60
 *                 order: 1
 *                 isPublic: true
 *                 createdAt: "2024-01-01T00:00:00.000Z"
 *                 updatedAt: "2024-01-01T12:00:00.000Z"
 *               message: "服務更新成功"
 *               timestamp: "2024-01-01T12:00:00.000Z"
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
 *                   - field: "price"
 *                     message: "價格不能為負數"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/services/123e4567-e89b-12d3-a456-426614174001"
 *       401:
 *         description: 未提供有效的認證 Token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 權限不足
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 服務不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "SERVICE_NOT_FOUND"
 *                 message: "找不到指定的服務"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/services/123e4567-e89b-12d3-a456-426614174999"
 */
router.put('/:id', async (ctx: Context) => {
  // TODO: 實作服務更新邏輯
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
 * /services/{id}:
 *   delete:
 *     summary: 刪除服務
 *     description: 刪除指定的服務項目（需要管理員權限）
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 服務 ID
 *         example: "123e4567-e89b-12d3-a456-426614174001"
 *     responses:
 *       200:
 *         description: 服務刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "服務刪除成功"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: 無效的服務 ID 格式
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未提供有效的認證 Token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 權限不足
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 服務不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "SERVICE_NOT_FOUND"
 *                 message: "找不到指定的服務"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               path: "/services/123e4567-e89b-12d3-a456-426614174999"
 */
router.delete('/:id', async (ctx: Context) => {
  // TODO: 實作服務刪除邏輯
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

export { router as serviceRoutes };