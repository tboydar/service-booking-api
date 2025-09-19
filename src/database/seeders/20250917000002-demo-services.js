'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('AppointmentServices', [
      {
        id: uuidv4(),
        name: '基礎健康檢查',
        description: '包含基本的身體檢查項目，適合一般健康維護使用',
        price: 150000, // $1500.00 in cents
        showTime: 60, // 60 minutes
        order: 1,
        isRemove: false,
        isPublic: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: '專業諮詢服務',
        description: '提供專業的健康諮詢和建議，由資深專家提供服務',
        price: 300000, // $3000.00 in cents
        showTime: 90, // 90 minutes
        order: 2,
        isRemove: false,
        isPublic: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: '進階健康評估',
        description: '全面性的健康評估服務，包含詳細的檢查報告和後續追蹤',
        price: 500000, // $5000.00 in cents
        showTime: 120, // 120 minutes
        order: 3,
        isRemove: false,
        isPublic: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: '快速檢測服務',
        description: '快速的基本檢測服務，適合忙碌的上班族',
        price: 80000, // $800.00 in cents
        showTime: 30, // 30 minutes
        order: 0, // Higher priority (lower order number)
        isRemove: false,
        isPublic: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: '私人定制服務',
        description: '根據個人需求定制的專屬服務方案',
        price: 800000, // $8000.00 in cents
        showTime: 180, // 180 minutes
        order: 4,
        isRemove: false,
        isPublic: false, // Private service, not visible to public
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: '已停用服務',
        description: '這是一個已經停用的服務，用於測試軟刪除功能',
        price: 100000, // $1000.00 in cents
        showTime: 45,
        order: 99,
        isRemove: true, // Soft deleted
        isPublic: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('AppointmentServices', null, {});
  },
};
