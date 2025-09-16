import { Sequelize } from 'sequelize';
import { sequelize as configuredSequelize } from '../config/database';
import { config } from '../config/environment';

/**
 * Database connection status interface
 */
export interface ConnectionStatus {
  isConnected: boolean;
  error?: string;
  lastChecked?: Date;
  responseTime?: number;
}

/**
 * Database connection options interface
 */
export interface ConnectionOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Database connection manager class
 * Handles SQLite database connections using Sequelize
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    lastChecked: new Date(),
  };
  private readonly defaultOptions: ConnectionOptions = {
    retries: 3,
    retryDelay: 1000,
    timeout: 10000,
  };

  private constructor() {}

  /**
   * Get singleton instance of DatabaseConnection
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Test database connection with retry logic
   */
  public async testConnection(
    options?: ConnectionOptions
  ): Promise<ConnectionStatus> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    for (let attempt = 1; attempt <= opts.retries!; attempt++) {
      try {
        await Promise.race([
          configuredSequelize.authenticate(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Connection timeout')),
              opts.timeout
            )
          ),
        ]);

        const responseTime = Date.now() - startTime;
        this.connectionStatus = {
          isConnected: true,
          lastChecked: new Date(),
          responseTime,
        };

        return this.connectionStatus;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown database error';

        if (attempt === opts.retries) {
          this.connectionStatus = {
            isConnected: false,
            error: errorMessage,
            lastChecked: new Date(),
          };
          return this.connectionStatus;
        }

        console.warn(
          `Database connection attempt ${attempt} failed: ${errorMessage}. Retrying in ${opts.retryDelay}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, opts.retryDelay));
      }
    }

    return this.connectionStatus;
  }

  /**
   * Establish database connection
   */
  public async connect(options?: ConnectionOptions): Promise<void> {
    const status = await this.testConnection(options);

    if (!status.isConnected) {
      throw new Error(`Failed to connect to database: ${status.error}`);
    }

    console.log(
      `Database connection established successfully (${status.responseTime}ms)`
    );
  }

  /**
   * Close database connection
   */
  public async disconnect(): Promise<void> {
    try {
      if (!this.connectionStatus.isConnected) {
        console.log('Database is not connected');
        return;
      }

      await configuredSequelize.close();
      this.connectionStatus = {
        isConnected: false,
        lastChecked: new Date(),
      };

      console.log('Database connection closed successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error';
      console.error('Error closing database connection:', errorMessage);
      throw error;
    }
  }

  /**
   * Synchronize database models
   */
  public async syncModels(force: boolean = false): Promise<void> {
    try {
      if (!this.connectionStatus.isConnected) {
        throw new Error('Database is not connected');
      }

      const startTime = Date.now();
      await configuredSequelize.sync({ force });
      const duration = Date.now() - startTime;

      console.log(
        `Database models synchronized${force ? ' (forced)' : ''} in ${duration}ms`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error';
      console.error('Database synchronization failed:', errorMessage);
      throw error;
    }
  }

  /**
   * Get Sequelize instance
   */
  public getSequelize(): Sequelize {
    return configuredSequelize;
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Check if database is connected
   */
  public isConnected(): boolean {
    return this.connectionStatus.isConnected;
  }

  /**
   * Get database information
   */
  public async getDatabaseInfo(): Promise<Record<string, any>> {
    try {
      const version = await configuredSequelize.databaseVersion();
      return {
        dialect: configuredSequelize.getDialect(),
        version: version.toString(),
        config: {
          storage: config.DATABASE_STORAGE,
          environment: config.NODE_ENV,
        },
        status: this.connectionStatus,
      };
    } catch (error) {
      return {
        dialect: configuredSequelize.getDialect(),
        version: 'unknown',
        config: {
          storage: config.DATABASE_STORAGE,
          environment: config.NODE_ENV,
        },
        status: this.connectionStatus,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const databaseConnection = DatabaseConnection.getInstance();
