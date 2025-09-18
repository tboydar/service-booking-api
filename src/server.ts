import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import cors from 'koa-cors';
import serve from 'koa-static';
import path from 'path';
import { koaSwagger } from 'koa2-swagger-ui';
import { swaggerSpec, swaggerOptions } from './config/swagger';
import { authRoutes, serviceRoutes, healthRoutes } from './routes';

export const createApp = (): Koa => {
  const app = new Koa();
  const mainRouter = new Router();

  // Middlewares
  app.use(cors());
  app.use(bodyParser());
  
  // Serve static files from public directory
  app.use(serve(path.join(__dirname, 'public')));

  // API Routes
  app.use(authRoutes.routes());
  app.use(authRoutes.allowedMethods());
  
  app.use(serviceRoutes.routes());
  app.use(serviceRoutes.allowedMethods());
  
  app.use(healthRoutes.routes());
  app.use(healthRoutes.allowedMethods());

  // Swagger JSON endpoint
  mainRouter.get('/swagger.json', async (ctx) => {
    ctx.type = 'application/json';
    ctx.body = swaggerSpec;
  });

  // Documentation route
  mainRouter.get('/docs', async (ctx) => {
    ctx.redirect('/index.html');
  });

  // API Index endpoint
  mainRouter.get('/', async (ctx) => {
    ctx.body = {
      success: true,
      message: '🎯 Service Booking API - 服務預約管理系統',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      documentation: {
        docs: '/docs',
        openapi: '/swagger.json',
      },
      endpoints: {
        auth: {
          register: 'POST /auth/register',
          login: 'POST /auth/login',
          logout: 'POST /auth/logout',
          refresh: 'POST /auth/refresh',
        },
        services: {
          list: 'GET /services',
          detail: 'GET /services/:id',
          create: 'POST /services (🔒 Auth Required)',
          update: 'PUT /services/:id (🔒 Auth Required)',
          delete: 'DELETE /services/:id (🔒 Auth Required)',
        },
        health: {
          status: 'GET /health',
          version: 'GET /health/version',
        },
      },
      features: [
        '🔐 JWT 認證系統',
        '👥 會員管理',
        '🏪 服務管理',
        '📱 RESTful API',
        '🔍 輸入驗證',
        '📊 健康檢查',
        '📚 API 文檔',
      ],
    };
  });

  app.use(mainRouter.routes());
  app.use(mainRouter.allowedMethods());

  // Error handling middleware
  app.use(async (ctx, next) => {
    try {
      await next();
      
      // Handle 404
      if (ctx.status === 404) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '找不到指定的端點',
          },
          timestamp: new Date().toISOString(),
          path: ctx.path,
          availableEndpoints: '/docs',
        };
      }
    } catch (error) {
      console.error('Error:', error);
      
      ctx.status = (error as any).status || 500;
      ctx.body = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '伺服器內部錯誤',
        },
        timestamp: new Date().toISOString(),
        path: ctx.path,
      };
    }
  });

  return app;
};