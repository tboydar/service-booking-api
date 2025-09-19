try {
  console.log('Importing environment config...');
  const { config } = require('../config/environment');
  console.log('Environment config loaded:', config);

  console.log('Importing Sequelize...');
  const { Sequelize } = require('sequelize');
  console.log('Sequelize loaded');

  console.log('Creating instance...');
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.DATABASE_STORAGE,
    logging: false,
  });

  console.log('Instance created:', !!sequelize);
} catch (error) {
  console.error('Error:', error);
}
