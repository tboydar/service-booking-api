import { Sequelize, QueryInterface } from 'sequelize';
import { databaseConnection } from './connection';
import { config } from '../config/environment';

/**
 * Database utility functions for common operations
 */
export class DatabaseUtils {
  private static sequelize: Sequelize;

  /**
   * Initialize database utilities
   */
  public static initialize(): void {
    DatabaseUtils.sequelize = databaseConnection.getSequelize();
  }

  /**
   * Get Sequelize instance
   */
  public static getSequelize(): Sequelize {
    if (!DatabaseUtils.sequelize) {
      DatabaseUtils.initialize();
    }
    return DatabaseUtils.sequelize;
  }

  /**
   * Get QueryInterface for migrations
   */
  public static getQueryInterface(): QueryInterface {
    return DatabaseUtils.getSequelize().getQueryInterface();
  }

  /**
   * Check if table exists
   */
  public static async tableExists(tableName: string): Promise<boolean> {
    try {
      const queryInterface = DatabaseUtils.getQueryInterface();
      const tables = await queryInterface.showAllTables();
      return tables.includes(tableName);
    } catch (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  }

  /**
   * Check if column exists in table
   */
  public static async columnExists(
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    try {
      const queryInterface = DatabaseUtils.getQueryInterface();
      const tableDescription = await queryInterface.describeTable(tableName);
      return columnName in tableDescription;
    } catch (error) {
      console.error(
        `Error checking if column ${columnName} exists in table ${tableName}:`,
        error
      );
      return false;
    }
  }

  /**
   * Check if index exists
   */
  public static async indexExists(
    tableName: string,
    indexName: string
  ): Promise<boolean> {
    try {
      const queryInterface = DatabaseUtils.getQueryInterface();
      const indexes = await queryInterface.showIndex(tableName);
      return (indexes as any[]).some((index: any) => index.name === indexName);
    } catch (error) {
      console.error(
        `Error checking if index ${indexName} exists on table ${tableName}:`,
        error
      );
      return false;
    }
  }

  /**
   * Execute raw SQL query
   */
  public static async executeQuery(sql: string, options?: any): Promise<any> {
    try {
      const sequelize = DatabaseUtils.getSequelize();
      return await sequelize.query(sql, options);
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  /**
   * Get database file size (SQLite specific)
   */
  public static async getDatabaseSize(): Promise<number> {
    if (config.DATABASE_DIALECT !== 'sqlite') {
      throw new Error('Database size check is only supported for SQLite');
    }

    // Return 0 for in-memory database
    if (config.DATABASE_STORAGE === ':memory:') {
      return 0;
    }

    try {
      const fs = await import('fs');
      const stats = fs.statSync(config.DATABASE_STORAGE);
      return stats.size;
    } catch (error) {
      console.error('Error getting database size:', error);
      return 0;
    }
  }

  /**
   * Vacuum database (SQLite specific)
   */
  public static async vacuumDatabase(): Promise<void> {
    if (config.DATABASE_DIALECT !== 'sqlite') {
      throw new Error('Database vacuum is only supported for SQLite');
    }

    try {
      await DatabaseUtils.executeQuery('VACUUM;');
      console.log('Database vacuum completed successfully');
    } catch (error) {
      console.error('Error vacuuming database:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  public static async getDatabaseStats(): Promise<{
    tables: string[];
    size: number;
    version: string;
  }> {
    try {
      const queryInterface = DatabaseUtils.getQueryInterface();
      const tables = await queryInterface.showAllTables();
      const size = await DatabaseUtils.getDatabaseSize();
      const sequelize = DatabaseUtils.getSequelize();
      const version = await sequelize.databaseVersion();

      return {
        tables,
        size,
        version: version.toString(),
      };
    } catch (error) {
      console.error('Error getting database statistics:', error);
      throw error;
    }
  }

  /**
   * Test database performance
   */
  public static async testPerformance(): Promise<{
    connectionTime: number;
    queryTime: number;
  }> {
    const startConnection = Date.now();
    await databaseConnection.testConnection();
    const connectionTime = Date.now() - startConnection;

    const startQuery = Date.now();
    await DatabaseUtils.executeQuery('SELECT 1 as test;');
    const queryTime = Date.now() - startQuery;

    return {
      connectionTime,
      queryTime,
    };
  }
}

// Initialize on import
DatabaseUtils.initialize();
