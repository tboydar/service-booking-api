import Router from 'koa-router';
import { Context } from 'koa';

const router = new Router({ prefix: '/health' });

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: 系統健康檢查 API
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 系統健康檢查
 *     description: 檢查系統整體健康狀態
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: 系統運行正常
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             example:
 *               status: "healthy"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               uptime: 3600
 *               database:
 *                 status: "connected"
 *                 responseTime: 15
 *               version: "1.0.0"
 *       503:
 *         description: 系統或依賴服務異常
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             example:
 *               status: "unhealthy"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               uptime: 3600
 *               database:
 *                 status: "disconnected"
 *                 responseTime: null
 *               version: "1.0.0"
 */
router.get('/', async (ctx: Context) => {
  const startTime = Date.now();
  
  try {
    // TODO: 實際檢查資料庫連線狀態
    const dbStatus = 'connected'; // 暫時硬編碼
    const dbResponseTime = Date.now() - startTime;
    
    const healthData = {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
      version: '1.0.0',
    };
    
    ctx.status = 200;
    ctx.body = healthData;
  } catch (error) {
    const healthData = {
      status: 'unhealthy' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'disconnected',
        responseTime: null,
      },
      version: '1.0.0',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    ctx.status = 503;
    ctx.body = healthData;
  }
});

/**
 * @swagger
 * /health/version:
 *   get:
 *     summary: 獲取 API 版本資訊
 *     description: 獲取當前 API 的版本和構建資訊
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: 成功獲取版本資訊
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [version, name, timestamp]
 *               properties:
 *                 version:
 *                   type: string
 *                   description: API 版本
 *                   example: "1.0.0"
 *                 name:
 *                   type: string
 *                   description: API 名稱
 *                   example: "Service Booking API"
 *                 description:
 *                   type: string
 *                   description: API 描述
 *                   example: "服務預約管理後端 API"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: 回應時間
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 environment:
 *                   type: string
 *                   description: 運行環境
 *                   example: "development"
 *                 nodeVersion:
 *                   type: string
 *                   description: Node.js 版本
 *                   example: "20.10.0"
 *             example:
 *               version: "1.0.0"
 *               name: "Service Booking API"
 *               description: "服務預約管理後端 API"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               environment: "development"
 *               nodeVersion: "20.10.0"
 */
router.get('/version', async (ctx: Context) => {
  ctx.status = 200;
  ctx.body = {
    version: '1.0.0',
    name: 'Service Booking API',
    description: '服務預約管理後端 API',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
    nodeVersion: process.version,
  };
});

export { router as healthRoutes };