import Router from 'koa-router';
import { koaSwagger } from 'koa-swagger-ui';
import { swaggerSpec } from '../config/swagger';
import type { Context } from 'koa';

const router = new Router();

/**
 * @swagger
 * /api-docs/json:
 *   get:
 *     summary: 獲取 Swagger JSON 規格
 *     description: 返回 OpenAPI 3.0 規格的 JSON 文檔
 *     tags:
 *       - Documentation
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/api-docs/json', async (ctx: Context) => {
  ctx.body = swaggerSpec;
});

// Swagger UI 配置
const swaggerOptions = {
  routePrefix: '/api-docs',
  swaggerOptions: {
    url: '/api-docs/json',
    deepLinking: true,
    docExpansion: 'none',
    filter: true,
    tryItOutEnabled: true,
    displayRequestDuration: true,
    syntaxHighlight: {
      theme: 'monokai'
    },
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    displayOperationId: false,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    layout: 'BaseLayout',
    customSiteTitle: 'Service Booking API - Swagger UI'
  },
  hideTopbar: false,
  favicon: '/favicon.ico'
};

// 設置 Swagger UI
router.get(
  '/api-docs',
  koaSwagger(swaggerOptions)
);

export default router;