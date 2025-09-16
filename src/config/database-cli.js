require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_STORAGE = process.env.DATABASE_STORAGE || './database.sqlite';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: DATABASE_STORAGE,
    logging: LOG_LEVEL === 'debug' ? console.log : false,
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
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
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
  },
  production: {
    dialect: 'sqlite',
    storage: DATABASE_STORAGE,
    logging: false,
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
  },
};
