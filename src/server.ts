#!/usr/bin/env node

/**
 * Server startup script
 * Handles graceful startup and shutdown of the application
 */

import { config } from './config/environment';
import { initializeDatabase } from './database/init';
import { createApp } from './index';

/**
 * Application startup handler
 */
class ServerManager {
  private server: any = null;
  private isShuttingDown = false;

  /**
   * Start the server with proper error handling
   */
  public async start(): Promise<void> {
    try {
      console.log('🚀 Starting Service Booking API...');
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log(`🔧 Node.js version: ${process.version}`);

      // Validate environment
      this.validateEnvironment();

      // Initialize database
      console.log('🗄️  Initializing database...');
      await initializeDatabase();
      console.log('✅ Database initialized successfully');

      // Create and start Koa app
      const app = createApp();

      this.server = app.listen(config.PORT, () => {
        console.log(`🌟 Server running on port ${config.PORT}`);
        console.log(`🏥 Health check: http://localhost:${config.PORT}/health`);
        console.log('📚 Available endpoints:');
        console.log('   Authentication:');
        console.log('     POST /auth/register - User registration');
        console.log('     POST /auth/login - User login');
        console.log('   Services:');
        console.log('     GET  /services - Get public services');
        console.log('     GET  /services/:id - Get service by ID');
        console.log('     POST /services - Create service (auth required)');
        console.log('     PUT  /services/:id - Update service (auth required)');
        console.log(
          '     DELETE /services/:id - Delete service (auth required)'
        );
        console.log('🎉 Server started successfully!');
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Validate required environment variables
   */
  private validateEnvironment(): void {
    const required = ['NODE_ENV', 'PORT', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }

    console.log('✅ Environment validation passed');
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      if (this.isShuttingDown) {
        console.log('⚠️  Force shutdown...');
        process.exit(1);
      }

      this.isShuttingDown = true;
      console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);

      if (this.server) {
        this.server.close((err: any) => {
          if (err) {
            console.error('❌ Error during server shutdown:', err);
            process.exit(1);
          }
          console.log('✅ Server closed successfully');
          process.exit(0);
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
          console.log('⚠️  Force shutdown after timeout');
          process.exit(1);
        }, 10000);
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const serverManager = new ServerManager();
  void serverManager.start();
}

export { ServerManager };
