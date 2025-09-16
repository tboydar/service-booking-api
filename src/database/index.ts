import { databaseConnection, ConnectionOptions } from './connection';
import { config, isDevelopment, isTest } from '../config/environment';

/**
 * Database initialization options
 */
export interface DatabaseInitOptions {
  syncModels?: boolean;
  force?: boolean;
  connectionOptions?: ConnectionOptions;
}

/**
 * Database manager class
 * Handles database initialization, connection management, and cleanup
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private isInitialized: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance of DatabaseManager
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database connection and setup
   */
  public async initialize(options?: DatabaseInitOptions): Promise<void> {
    if (this.isInitialized) {
      console.log('Database already initialized');
      return;
    }

    const opts: DatabaseInitOptions = {
      syncModels: isDevelopment() || isTest(),
      force: false,
      ...options,
    };

    try {
      console.log(
        `Initializing database for ${config.NODE_ENV} environment...`
      );

      // Establish database connection
      await databaseConnection.connect(opts.connectionOptions);

      // Sync models if requested (typically for development/test)
      if (opts.syncModels) {
        console.log('Synchronizing database models...');
        await databaseConnection.syncModels(opts.force);
      }

      this.isInitialized = true;
      console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection and cleanup
   */
  public async close(): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.log('Database not initialized');
        return;
      }

      await databaseConnection.disconnect();
      this.isInitialized = false;
      console.log('Database manager closed successfully');
    } catch (error) {
      console.error('Error closing database manager:', error);
      throw error;
    }
  }

  /**
   * Get database connection status
   */
  public getConnectionStatus() {
    return databaseConnection.getConnectionStatus();
  }

  /**
   * Get Sequelize instance
   */
  public getSequelize() {
    return databaseConnection.getSequelize();
  }

  /**
   * Test database connection
   */
  public async testConnection(options?: ConnectionOptions): Promise<boolean> {
    const status = await databaseConnection.testConnection(options);
    return status.isConnected;
  }

  /**
   * Sync database models (for development/test)
   */
  public async syncModels(force: boolean = false): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    await databaseConnection.syncModels(force);
  }

  /**
   * Check if database is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && databaseConnection.isConnected();
  }

  /**
   * Get database information
   */
  public async getDatabaseInfo() {
    return await databaseConnection.getDatabaseInfo();
  }

  /**
   * Reset database (for testing)
   */
  public async reset(): Promise<void> {
    if (!isTest()) {
      throw new Error('Database reset is only allowed in test environment');
    }

    await this.syncModels(true);
    console.log('Database reset completed');
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();

// Export database connection for direct access
export { databaseConnection };

// Export sequelize instance for model definitions
export const sequelize = databaseConnection.getSequelize();

// Export database utilities and initializer
export { DatabaseUtils } from './database-utils';
export {
  DatabaseInitializer,
  initializeDatabase,
  shutdownDatabase,
  databaseHealthCheck,
} from './init';
