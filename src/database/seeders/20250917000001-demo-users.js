'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash passwords with bcrypt (using 12 rounds as per project standards)
    const hashedPassword1 = await bcrypt.hash('password123', 12);
    const hashedPassword2 = await bcrypt.hash('admin123', 12);
    const hashedPassword3 = await bcrypt.hash('user123', 12);

    const now = new Date();

    await queryInterface.bulkInsert('Users', [
      {
        id: uuidv4(),
        email: 'admin@example.com',
        password: hashedPassword1,
        name: '系統管理員',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        email: 'john.doe@example.com',
        password: hashedPassword2,
        name: 'John Doe',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        email: 'jane.smith@example.com',
        password: hashedPassword3,
        name: 'Jane Smith',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        email: 'test.user@example.com',
        password: hashedPassword1, // Same password as admin for testing
        name: '測試使用者',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
