console.log('Starting minimal test...');

try {
  console.log('1. Loading dotenv...');
  require('dotenv').config();
  
  console.log('2. Environment variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_STORAGE:', process.env.DATABASE_STORAGE);
  
  console.log('3. Loading Sequelize...');
  const { Sequelize } = require('sequelize');
  
  console.log('4. Creating instance...');
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DATABASE_STORAGE || './database.sqlite',
    logging: false,
  });
  
  console.log('5. Testing connection...');
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Connection successful');
      return sequelize.close();
    })
    .then(() => {
      console.log('Connection closed');
    })
    .catch((error: any) => {
      console.error('❌ Connection failed:', error);
    });
    
} catch (error) {
  console.error('Error in test:', error);
}