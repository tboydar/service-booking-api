#!/usr/bin/env ts-node

/**
 * Seed data validation utility
 * This script validates that seed data meets all model validation rules
 */

import { User } from '../models/user';
import { AppointmentService } from '../models/appointment-service';
import { PasswordUtils } from '../utils/password';
import { initializeDatabase } from './init';

/**
 * Validate user seed data
 */
async function validateUserSeeds(): Promise<void> {
  console.log('🔍 Validating User seed data...');

  const testUsers = [
    {
      email: 'admin@example.com',
      password: 'password123',
      name: '系統管理員',
    },
    {
      email: 'john.doe@example.com',
      password: 'admin123',
      name: 'John Doe',
    },
    {
      email: 'jane.smith@example.com',
      password: 'user123',
      name: 'Jane Smith',
    },
    {
      email: 'test.user@example.com',
      password: 'password123',
      name: '測試使用者',
    },
  ];

  for (const userData of testUsers) {
    try {
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        throw new Error(`Invalid email format: ${userData.email}`);
      }

      // Validate password length
      if (!PasswordUtils.isValidPassword(userData.password)) {
        throw new Error(
          `Invalid password for user ${userData.email}: must be at least 6 characters`
        );
      }

      // Validate name length
      if (userData.name.length < 2 || userData.name.length > 255) {
        throw new Error(
          `Invalid name for user ${userData.email}: must be between 2 and 255 characters`
        );
      }

      // Test password hashing
      const hashedPassword = await PasswordUtils.hashPassword(
        userData.password
      );
      const isValid = await PasswordUtils.verifyPassword(
        userData.password,
        hashedPassword
      );

      if (!isValid) {
        throw new Error(
          `Password hashing validation failed for user ${userData.email}`
        );
      }

      console.log(`✅ User validation passed: ${userData.email}`);
    } catch (error) {
      console.error(
        `❌ User validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }
}

/**
 * Validate appointment service seed data
 */
async function validateServiceSeeds(): Promise<void> {
  console.log('🔍 Validating AppointmentService seed data...');

  const testServices = [
    {
      name: '基礎健康檢查',
      description: '包含基本的身體檢查項目，適合一般健康維護使用',
      price: 150000,
      showTime: 60,
      order: 1,
      isRemove: false,
      isPublic: true,
    },
    {
      name: '專業諮詢服務',
      description: '提供專業的健康諮詢和建議，由資深專家提供服務',
      price: 300000,
      showTime: 90,
      order: 2,
      isRemove: false,
      isPublic: true,
    },
    {
      name: '進階健康評估',
      description: '全面性的健康評估服務，包含詳細的檢查報告和後續追蹤',
      price: 500000,
      showTime: 120,
      order: 3,
      isRemove: false,
      isPublic: true,
    },
    {
      name: '快速檢測服務',
      description: '快速的基本檢測服務，適合忙碌的上班族',
      price: 80000,
      showTime: 30,
      order: 0,
      isRemove: false,
      isPublic: true,
    },
    {
      name: '私人定制服務',
      description: '根據個人需求定制的專屬服務方案',
      price: 800000,
      showTime: 180,
      order: 4,
      isRemove: false,
      isPublic: false,
    },
    {
      name: '已停用服務',
      description: '這是一個已經停用的服務，用於測試軟刪除功能',
      price: 100000,
      showTime: 45,
      order: 99,
      isRemove: true,
      isPublic: true,
    },
  ];

  for (const serviceData of testServices) {
    try {
      // Validate name
      if (
        !serviceData.name ||
        serviceData.name.length < 1 ||
        serviceData.name.length > 255
      ) {
        throw new Error(`Invalid service name: ${serviceData.name}`);
      }

      // Validate description
      if (serviceData.description && serviceData.description.length > 1000) {
        throw new Error(
          `Invalid description for service ${serviceData.name}: exceeds 1000 characters`
        );
      }

      // Validate price
      if (!Number.isInteger(serviceData.price) || serviceData.price < 0) {
        throw new Error(
          `Invalid price for service ${serviceData.name}: must be a non-negative integer`
        );
      }

      // Validate showTime
      if (
        serviceData.showTime !== undefined &&
        (!Number.isInteger(serviceData.showTime) || serviceData.showTime < 0)
      ) {
        throw new Error(
          `Invalid showTime for service ${serviceData.name}: must be a non-negative integer`
        );
      }

      // Validate order
      if (!Number.isInteger(serviceData.order) || serviceData.order < 0) {
        throw new Error(
          `Invalid order for service ${serviceData.name}: must be a non-negative integer`
        );
      }

      // Validate boolean fields
      if (typeof serviceData.isRemove !== 'boolean') {
        throw new Error(
          `Invalid isRemove for service ${serviceData.name}: must be boolean`
        );
      }

      if (typeof serviceData.isPublic !== 'boolean') {
        throw new Error(
          `Invalid isPublic for service ${serviceData.name}: must be boolean`
        );
      }

      console.log(`✅ Service validation passed: ${serviceData.name}`);
    } catch (error) {
      console.error(
        `❌ Service validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }
}

/**
 * Run all seed validations
 */
async function validateAllSeeds(): Promise<void> {
  try {
    console.log('🚀 Starting seed data validation...\n');

    await validateUserSeeds();
    console.log('');
    await validateServiceSeeds();

    console.log('\n✅ All seed data validation passed!');
    console.log('🌱 Seed data is ready to be used.');
  } catch (error) {
    console.error(
      '\n❌ Seed data validation failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}

/**
 * Test seed data by actually creating records in a test database
 */
async function testSeedDataInDatabase(): Promise<void> {
  try {
    console.log('🧪 Testing seed data in database...');

    // Initialize database connection
    await initializeDatabase();

    // Test creating a user with seed data
    const hashedPassword = await PasswordUtils.hashPassword('password123');
    const testUser = await User.create({
      email: 'test-validation@example.com',
      password: hashedPassword,
      name: 'Test Validation User',
    } as any); // Using 'as any' since UUID is auto-generated

    console.log('✅ User creation test passed');

    // Test creating a service with seed data
    const testService = await AppointmentService.create({
      name: 'Test Validation Service',
      description: 'This is a test service for validation',
      price: 100000,
      showTime: 60,
      order: 0,
      isRemove: false,
      isPublic: true,
    } as any); // Using 'as any' since UUID is auto-generated

    console.log('✅ Service creation test passed');

    // Clean up test data
    await testUser.destroy();
    await testService.destroy();

    console.log('✅ Database validation test completed successfully');
  } catch (error) {
    console.error(
      '❌ Database validation test failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'validate';

  switch (command) {
    case 'validate':
      validateAllSeeds().catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
      });
      break;

    case 'test-db':
      testSeedDataInDatabase().catch(error => {
        console.error('Database test failed:', error);
        process.exit(1);
      });
      break;

    case 'all':
      Promise.resolve()
        .then(() => validateAllSeeds())
        .then(() => testSeedDataInDatabase())
        .catch(error => {
          console.error('Full validation failed:', error);
          process.exit(1);
        });
      break;

    default:
      console.log(`
Usage: ts-node src/database/validate-seeds.ts [command]

Commands:
  validate    Validate seed data format and rules (default)
  test-db     Test seed data by creating records in database
  all         Run both validation and database test

Examples:
  ts-node src/database/validate-seeds.ts
  ts-node src/database/validate-seeds.ts validate
  ts-node src/database/validate-seeds.ts test-db
  ts-node src/database/validate-seeds.ts all
      `);
      process.exit(1);
  }
}
