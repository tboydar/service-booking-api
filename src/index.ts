// Initialize OpenTelemetry tracing (must be first)
import './tracing';

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { config } from './config/environment';
import { initializeDatabase } from './database/init';
import { errorHandler } from './middlewares/error-handler';
import { getCorsMiddleware } from './middlewares/cors';
import { requestStatsMiddleware } from './middlewares/request-stats';
import { AppRoutes } from './routes/app-routes';
import { createAdminRoutes } from './routes/admin-routes';
import { bookingRoutes } from './routes/booking-routes';
import koaStatic from 'koa-static';
import * as path from 'path';
import { tracingMiddleware, performanceTracingMiddleware } from './middlewares/tracing-middleware';
import swaggerRoutes from './routes/swagger-routes';
import { initializeRateLimiters, generalRateLimit, closeRateLimiters } from './middlewares/rate-limiter';

/**
 * Create and configure Koa application
 */
const createApp = (): Koa => {
  const app = new Koa();

  // Global error handler (must be first)
  app.use(errorHandler);

  // OpenTelemetry tracing middleware (should be early in the chain)
  app.use(tracingMiddleware());
  app.use(performanceTracingMiddleware());

  // CORS middleware
  app.use(getCorsMiddleware());

  // Rate limiting middleware (before body parser)
  app.use(generalRateLimit);

  // Body parser middleware
  app.use(
    bodyParser({
      enableTypes: ['json'],
      jsonLimit: '10mb',
      strict: true,
      onerror: (err, ctx) => {
        console.error('Body parser error:', err);
        ctx.throw(400, 'Invalid JSON format');
      },
    })
  );

  // Request statistics middleware
  app.use(requestStatsMiddleware);

  // Health check endpoint
  app.use(async (ctx, next) => {
    if (ctx.path === '/health' && ctx.method === 'GET') {
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: config.NODE_ENV,
          version: process.env['npm_package_version'] || '1.0.0',
        },
        timestamp: new Date().toISOString(),
      };
      return;
    }
    await next();
  });

  // Static files for admin panel
  app.use(koaStatic(path.join(__dirname, '../admin/public')));

  // Swagger API documentation
  app.use(swaggerRoutes.routes());
  app.use(swaggerRoutes.allowedMethods());

  // Admin routes
  const adminRouter = createAdminRoutes();
  app.use(adminRouter.routes());
  app.use(adminRouter.allowedMethods());

  // API routes
  const appRoutes = new AppRoutes();
  appRoutes.applyRoutes(app);

  // Booking routes (with external service calls)
  app.use(bookingRoutes.routes());
  app.use(bookingRoutes.allowedMethods());

  // 404 handler (must be last)
  app.use(async ctx => {
    ctx.status = 404;
    ctx.body = {
      success: false,
      error: {
        code: 'NOT_FOUND_ERROR',
        message: `Route ${ctx.method} ${ctx.path} not found`,
      },
      timestamp: new Date().toISOString(),
    };
  });

  return app;
};

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Initialize database
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Initialize rate limiters
    initializeRateLimiters();

    // Create and start Koa app
    const app = createApp();
    const server = app.listen(config.PORT, () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log(`🏥 Health check: http://localhost:${config.PORT}/health`);
      if (config.RATE_LIMIT_ENABLED) {
        console.log(`🔒 Rate limiting: Enabled`);
      }
      console.log(`🖥️  Admin Panel: http://localhost:${config.PORT}/admin`);
      console.log(`📚 API endpoints:`);
      console.log(`   POST /auth/register - User registration`);
      console.log(`   POST /auth/login - User login`);
      console.log(`   GET  /services - Get public services`);
      console.log(`   GET  /services/:id - Get service by ID`);
      console.log(`   POST /services - Create service (auth required)`);
      console.log(`   PUT  /services/:id - Update service (auth required)`);
      console.log(`   DELETE /services/:id - Delete service (auth required)`);
      console.log(`💳 Booking endpoints (with payment):`);
      console.log(`   POST /booking/create - Create booking with payment`);
      console.log(`   GET  /booking/status/:id - Check booking status`);
      console.log(`   POST /booking/cancel/:id - Cancel booking with refund`);
      console.log(`🔐 Admin endpoints:`);
      console.log(`   POST /admin/login - Admin login`);
      console.log(`   GET  /admin/dashboard - Admin dashboard`);
      console.log(`   GET  /admin/api/system - System information`);
      console.log(`   GET  /admin/api/logs - View logs`);
      console.log(`   GET  /admin/api/scheduler - Scheduler tasks`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed');
        closeRateLimiters();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Export app for testing
export { createApp };

// Start server if this file is run directly
if (require.main === module) {
  void startServer();
}
