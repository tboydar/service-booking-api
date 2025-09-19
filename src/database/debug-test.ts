import { config } from '../config/environment';
import { Sequelize } from 'sequelize';

console.log('Environment config:', {
  NODE_ENV: config.NODE_ENV,
  DATABASE_STORAGE: config.DATABASE_STORAGE,
  DATABASE_DIALECT: config.DATABASE_DIALECT,
});

// Test creating Sequelize instance directly
const testSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: config.DATABASE_STORAGE,
  logging: false,
});

console.log('Sequelize instance created:', !!testSequelize);

testSequelize
  .authenticate()
  .then(() => {
    console.log('✅ Direct Sequelize connection successful');
    return testSequelize.close();
  })
  .then(() => {
    console.log('Connection closed');
  })
  .catch(error => {
    console.error('❌ Direct Sequelize connection failed:', error);
  });
