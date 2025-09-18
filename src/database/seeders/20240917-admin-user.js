'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    await queryInterface.bulkInsert('Users', [{
      id: uuidv4(),
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Administrator',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      email: 'admin@example.com'
    }, {});
  }
};