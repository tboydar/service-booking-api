console.log('Step 1: Importing config');
import { config } from '../config/environment';
console.log('Step 2: Config imported:', config);

console.log('Step 3: Importing Sequelize');
import { Sequelize, Options } from 'sequelize';
console.log('Step 4: Sequelize imported');

console.log('Step 5: Creating database config');
const databaseConfig = {
  development: {
    dialect: 'sqlite' as const,
    storage: config.DATABASE_STORAGE,
    logging: config.LOG_LEVEL === 'debug' ? console.log : false,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false,
    },
  },
};

console.log('Step 6: Database config created:', databaseConfig);

console.log('Step 7: Getting current config');
const currentConfig =
  databaseConfig[config.NODE_ENV as keyof typeof databaseConfig] ||
  databaseConfig.development;
console.log('Step 8: Current config:', currentConfig);

console.log('Step 9: Creating Sequelize instance');
const sequelize = new Sequelize(currentConfig as Options);
console.log('Step 10: Sequelize instance created:', !!sequelize);
