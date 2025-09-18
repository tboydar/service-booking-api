'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rate_limits', {
      key: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        allowNull: false,
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      expire: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add index on expire column for efficient cleanup
    await queryInterface.addIndex('rate_limits', ['expire'], {
      name: 'idx_expire',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rate_limits');
  },
};
