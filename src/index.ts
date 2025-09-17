import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { config } from './config/environment';
import { initializeDatabase } from './database/init';
import { errorHandler } from './middlewares/error-handler';
import { getCorsMiddleware } from './middlewares/cors';
import { AppRoutes } from './routes/app-routes';

/**
 * Create and configure Koa application
 */
const createApp = (): Koa => {
  const app = new Koa();

  // Global error handler (must be first)
  app.use(errorHandler);

  // CORS middleware
  app.use(getCorsMiddleware());

  // Body parser middleware
  app.use(
    bodyParser({
      enableTypes: ['json'],
      jsonLimit: '10mb',
      strict: true,
      onerror: (_err, ctx) => {
        ctx.throw(400, 'Invalid JSON format');
      },
    })
  );

  // Request logging middleware
  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
  });

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

  // API routes
  const appRoutes = new AppRoutes();
  appRoutes.applyRoutes(app);

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

    // Create and start Koa app
    const app = createApp();
    const server = app.listen(config.PORT, () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log(`🏥 Health check: http://localhost:${config.PORT}/health`);
      console.log(`📚 API endpoints:`);
      console.log(`   POST /auth/register - User registration`);
      console.log(`   POST /auth/login - User login`);
      console.log(`   GET  /services - Get public services`);
      console.log(`   GET  /services/:id - Get service by ID`);
      console.log(`   POST /services - Create service (auth required)`);
      console.log(`   PUT  /services/:id - Update service (auth required)`);
      console.log(`   DELETE /services/:id - Delete service (auth required)`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed');
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
