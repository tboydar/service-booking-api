import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

console.log('Sequelize instance:', !!sequelize);

sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Connection successful');
    return sequelize.close();
  })
  .catch(error => {
    console.error('❌ Connection failed:', error);
  });
