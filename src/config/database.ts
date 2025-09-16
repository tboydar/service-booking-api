import { Sequelize, Options } from 'sequelize';
import { config } from './environment';

/**
 * Database configuration interface
 */
interface DatabaseConfig extends Options {
  dialect: 'sqlite';
  storage?: string;
}

/**
 * Create Sequelize configuration based on environment
 */
const createSequelizeConfig = (): DatabaseConfig => {
  const baseConfig: DatabaseConfig = {
    dialect: 'sqlite',
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false,
      paranoid: false,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 3,
    },
  };

  // Environment-specific configurations
  switch (config.NODE_ENV) {
    case 'test':
      return {
        ...baseConfig,
        storage: ':memory:',
        logging: false,
      };

    case 'production':
      return {
        ...baseConfig,
        storage: config.DATABASE_STORAGE,
        logging: false,
        benchmark: false,
      };

    case 'development':
    default:
      return {
        ...baseConfig,
        storage: config.DATABASE_STORAGE,
        logging: config.LOG_LEVEL === 'debug' ? console.log : false,
        benchmark: config.LOG_LEVEL === 'debug',
      };
  }
};

/**
 * Validate database configuration
 */
const validateDatabaseConfig = (dbConfig: DatabaseConfig): void => {
  if (!dbConfig.dialect) {
    throw new Error('Database dialect is required');
  }

  if (dbConfig.dialect !== 'sqlite') {
    throw new Error('Only SQLite dialect is supported');
  }

  if (config.NODE_ENV !== 'test' && !dbConfig.storage) {
    throw new Error(
      'Database storage path is required for non-test environments'
    );
  }
};

// Create and validate Sequelize configuration
const sequelizeConfig = createSequelizeConfig();
validateDatabaseConfig(sequelizeConfig);

// Create Sequelize instance
const sequelize = new Sequelize(sequelizeConfig);

// Add connection event handlers
sequelize.addHook('beforeConnect', () => {
  console.log(
    `Connecting to SQLite database: ${sequelizeConfig.storage || ':memory:'}`
  );
});

sequelize.addHook('afterConnect', () => {
  console.log('Database connection established successfully');
});

sequelize.addHook('beforeDisconnect', () => {
  console.log('Disconnecting from database...');
});

// Export configuration and instance
export { sequelizeConfig };
export { sequelize };
export default sequelize;
