import { databaseManager } from './index';
import { DatabaseUtils } from './database-utils';
import { config, isDevelopment, isTest } from '../config/environment';

/**
 * Database initialization and setup
 */
export class DatabaseInitializer {
  /**
   * Initialize database with full setup
   */
  public static async initialize(): Promise<void> {
    try {
      console.log('🚀 Starting database initialization...');

      // Step 1: Initialize database manager
      await databaseManager.initialize();

      // Step 2: Run migrations in production
      if (!isDevelopment() && !isTest()) {
        console.log('📦 Running database migrations...');
        await DatabaseInitializer.runMigrations();
      }

      // Step 3: Verify database setup
      console.log('🔍 Verifying database setup...');
      await DatabaseInitializer.verifySetup();

      // Step 4: Log database statistics
      await DatabaseInitializer.logDatabaseInfo();

      console.log('✅ Database initialization completed successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Run database migrations programmatically
   */
  public static async runMigrations(): Promise<void> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout, stderr } = await execAsync('npm run migrate');

      if (stderr && !stderr.includes('Sequelize CLI')) {
        console.error('Migration stderr:', stderr);
      }

      if (stdout) {
        console.log('Migration output:', stdout);
      }

      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Verify database setup
   */
  public static async verifySetup(): Promise<void> {
    try {
      // Test connection
      const isConnected = await databaseManager.testConnection();
      if (!isConnected) {
        throw new Error('Database connection test failed');
      }

      // Check if SequelizeMeta table exists (migration system)
      const metaTableExists = await DatabaseUtils.tableExists('SequelizeMeta');
      if (!metaTableExists) {
        console.warn(
          '⚠️  SequelizeMeta table not found - migrations may not have run'
        );
      }

      console.log('✅ Database setup verification completed');
    } catch (error) {
      console.error('❌ Database setup verification failed:', error);
      throw error;
    }
  }

  /**
   * Log database information
   */
  public static async logDatabaseInfo(): Promise<void> {
    try {
      const stats = await DatabaseUtils.getDatabaseStats();
      const performance = await DatabaseUtils.testPerformance();

      console.log('📊 Database Information:');
      console.log(`   Environment: ${config.NODE_ENV}`);
      console.log(`   Dialect: ${config.DATABASE_DIALECT}`);
      console.log(`   Storage: ${config.DATABASE_STORAGE}`);
      console.log(
        `   Tables: ${stats.tables.length} (${stats.tables.join(', ')})`
      );
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   Version: ${stats.version}`);
      console.log(`   Connection Time: ${performance.connectionTime}ms`);
      console.log(`   Query Time: ${performance.queryTime}ms`);
    } catch (error) {
      console.warn(
        '⚠️  Could not retrieve database information:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Graceful shutdown
   */
  public static async shutdown(): Promise<void> {
    try {
      console.log('🔄 Shutting down database connections...');
      await databaseManager.close();
      console.log('✅ Database shutdown completed');
    } catch (error) {
      console.error('❌ Database shutdown failed:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  public static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connected: boolean;
      responseTime: number;
      error?: string;
    };
  }> {
    try {
      const startTime = Date.now();
      const isConnected = await databaseManager.testConnection();
      const responseTime = Date.now() - startTime;

      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        details: {
          connected: isConnected,
          responseTime,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          responseTime: -1,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Export for convenience
export const initializeDatabase = DatabaseInitializer.initialize;
export const shutdownDatabase = DatabaseInitializer.shutdown;
export const databaseHealthCheck = DatabaseInitializer.healthCheck;

// Main execution when run directly
if (require.main === module) {
  DatabaseInitializer.initialize()
    .then(() => {
      console.log('✅ Database initialization completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}
