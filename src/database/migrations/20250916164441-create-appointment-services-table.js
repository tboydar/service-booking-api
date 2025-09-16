'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AppointmentServices', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      showTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isRemove: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes
    await queryInterface.addIndex('AppointmentServices', ['order'], {
      name: 'appointment_services_order_index',
    });

    await queryInterface.addIndex(
      'AppointmentServices',
      ['isPublic', 'isRemove'],
      {
        name: 'appointment_services_public_remove_index',
      }
    );

    await queryInterface.addIndex('AppointmentServices', ['isRemove'], {
      name: 'appointment_services_remove_index',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex(
      'AppointmentServices',
      'appointment_services_order_index'
    );
    await queryInterface.removeIndex(
      'AppointmentServices',
      'appointment_services_public_remove_index'
    );
    await queryInterface.removeIndex(
      'AppointmentServices',
      'appointment_services_remove_index'
    );

    // Drop table
    await queryInterface.dropTable('AppointmentServices');
  },
};
