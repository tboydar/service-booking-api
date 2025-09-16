import { QueryInterface, DataTypes } from 'sequelize';
import { DatabaseUtils } from './database-utils';

/**
 * Migration utility functions for safe database schema changes
 */
export class MigrationUtils {
  /**
   * Create UUID column definition
   */
  static uuidColumn(allowNull: boolean = false) {
    return {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull,
      primaryKey: !allowNull,
    };
  }

  /**
   * Create standard timestamp columns
   */
  static timestampColumns() {
    return {
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    };
  }

  /**
   * Create email column with validation
   */
  static emailColumn(allowNull: boolean = false) {
    return {
      type: DataTypes.STRING(255),
      allowNull,
      unique: true,
      validate: {
        isEmail: true,
      },
    };
  }

  /**
   * Create password column
   */
  static passwordColumn() {
    return {
      type: DataTypes.STRING(255),
      allowNull: false,
    };
  }

  /**
   * Create name column
   */
  static nameColumn(maxLength: number = 255, allowNull: boolean = false) {
    return {
      type: DataTypes.STRING(maxLength),
      allowNull,
    };
  }

  /**
   * Create description column
   */
  static descriptionColumn(allowNull: boolean = true) {
    return {
      type: DataTypes.TEXT,
      allowNull,
    };
  }

  /**
   * Create price column (stored as integer in cents)
   */
  static priceColumn(allowNull: boolean = false) {
    return {
      type: DataTypes.INTEGER,
      allowNull,
      validate: {
        min: 0,
      },
    };
  }

  /**
   * Create boolean column with default value
   */
  static booleanColumn(
    defaultValue: boolean = false,
    allowNull: boolean = false
  ) {
    return {
      type: DataTypes.BOOLEAN,
      allowNull,
      defaultValue,
    };
  }

  /**
   * Create integer column with default value
   */
  static integerColumn(defaultValue: number = 0, allowNull: boolean = false) {
    return {
      type: DataTypes.INTEGER,
      allowNull,
      defaultValue,
    };
  }

  /**
   * Create table with standard columns (id, timestamps)
   */
  static async createTableWithDefaults(
    queryInterface: QueryInterface,
    tableName: string,
    columns: any,
    options?: any
  ): Promise<void> {
    const defaultColumns = {
      id: MigrationUtils.uuidColumn(),
      ...columns,
      ...MigrationUtils.timestampColumns(),
    };

    await queryInterface.createTable(tableName, defaultColumns, options);
    console.log(`✅ Created table: ${tableName}`);
  }

  /**
   * Add index to table safely (check if exists first)
   */
  static async addIndex(
    queryInterface: QueryInterface,
    tableName: string,
    columns: string[],
    options: { unique?: boolean; name?: string } = {}
  ): Promise<void> {
    const indexName = options.name || `${tableName}_${columns.join('_')}_idx`;

    try {
      const indexExists = await DatabaseUtils.indexExists(tableName, indexName);
      if (!indexExists) {
        await queryInterface.addIndex(tableName, columns, {
          name: indexName,
          unique: options.unique || false,
        });
        console.log(
          `✅ Created index: ${indexName} on ${tableName}(${columns.join(', ')})`
        );
      } else {
        console.log(`ℹ️  Index ${indexName} already exists on ${tableName}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Remove index from table safely (check if exists first)
   */
  static async removeIndex(
    queryInterface: QueryInterface,
    tableName: string,
    indexName: string
  ): Promise<void> {
    try {
      const indexExists = await DatabaseUtils.indexExists(tableName, indexName);
      if (indexExists) {
        await queryInterface.removeIndex(tableName, indexName);
        console.log(`✅ Removed index: ${indexName} from ${tableName}`);
      } else {
        console.log(`ℹ️  Index ${indexName} does not exist on ${tableName}`);
      }
    } catch (error) {
      console.error(`❌ Failed to remove index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Add column safely (check if exists first)
   */
  static async addColumnSafely(
    queryInterface: QueryInterface,
    tableName: string,
    columnName: string,
    columnDefinition: any
  ): Promise<void> {
    try {
      const columnExists = await DatabaseUtils.columnExists(
        tableName,
        columnName
      );
      if (!columnExists) {
        await queryInterface.addColumn(tableName, columnName, columnDefinition);
        console.log(`✅ Added column: ${columnName} to ${tableName}`);
      } else {
        console.log(`ℹ️  Column ${columnName} already exists in ${tableName}`);
      }
    } catch (error) {
      console.error(
        `❌ Failed to add column ${columnName} to ${tableName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Remove column safely (check if exists first)
   */
  static async removeColumnSafely(
    queryInterface: QueryInterface,
    tableName: string,
    columnName: string
  ): Promise<void> {
    try {
      const columnExists = await DatabaseUtils.columnExists(
        tableName,
        columnName
      );
      if (columnExists) {
        await queryInterface.removeColumn(tableName, columnName);
        console.log(`✅ Removed column: ${columnName} from ${tableName}`);
      } else {
        console.log(`ℹ️  Column ${columnName} does not exist in ${tableName}`);
      }
    } catch (error) {
      console.error(
        `❌ Failed to remove column ${columnName} from ${tableName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Drop table safely (check if exists first)
   */
  static async dropTableSafely(
    queryInterface: QueryInterface,
    tableName: string
  ): Promise<void> {
    try {
      const tableExists = await DatabaseUtils.tableExists(tableName);
      if (tableExists) {
        await queryInterface.dropTable(tableName);
        console.log(`✅ Dropped table: ${tableName}`);
      } else {
        console.log(`ℹ️  Table ${tableName} does not exist`);
      }
    } catch (error) {
      console.error(`❌ Failed to drop table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create Users table with all required columns
   */
  static async createUsersTable(queryInterface: QueryInterface): Promise<void> {
    const columns = {
      email: MigrationUtils.emailColumn(),
      password: MigrationUtils.passwordColumn(),
      name: MigrationUtils.nameColumn(),
    };

    await MigrationUtils.createTableWithDefaults(
      queryInterface,
      'Users',
      columns
    );

    // Add email index for faster lookups
    await MigrationUtils.addIndex(queryInterface, 'Users', ['email'], {
      name: 'users_email_idx',
      unique: true,
    });
  }

  /**
   * Create AppointmentServices table with all required columns
   */
  static async createAppointmentServicesTable(
    queryInterface: QueryInterface
  ): Promise<void> {
    const columns = {
      name: MigrationUtils.nameColumn(),
      description: MigrationUtils.descriptionColumn(true),
      price: MigrationUtils.priceColumn(),
      showTime: MigrationUtils.integerColumn(0, true),
      order: MigrationUtils.integerColumn(0),
      isRemove: MigrationUtils.booleanColumn(false),
      isPublic: MigrationUtils.booleanColumn(true),
    };

    await MigrationUtils.createTableWithDefaults(
      queryInterface,
      'AppointmentServices',
      columns
    );

    // Add indexes for common queries
    await MigrationUtils.addIndex(
      queryInterface,
      'AppointmentServices',
      ['order'],
      {
        name: 'appointment_services_order_idx',
      }
    );

    await MigrationUtils.addIndex(
      queryInterface,
      'AppointmentServices',
      ['isPublic', 'isRemove'],
      {
        name: 'appointment_services_public_idx',
      }
    );
  }
}

export default MigrationUtils;
