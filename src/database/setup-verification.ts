#!/usr/bin/env ts-node

/**
 * Comprehensive database setup verification script
 * This script tests all aspects of the database configuration and ORM setup
 */

import { databaseManager } from './index';
import { databaseConnection } from './connection';

async function verifyDatabaseSetup(): Promise<void> {
  console.log('🔍 Database Setup Verification');
  console.log('================================');

  let allTestsPassed = true;

  // Test 1: Environment Configuration
  console.log('\n1. Environment Configuration');
  try {
    const { config } = await import('../config/environment');
    console.log(`   ✓ NODE_ENV: ${config.NODE_ENV}`);
    console.log(`   ✓ DATABASE_STORAGE: ${config.DATABASE_STORAGE}`);
    console.log(`   ✓ DATABASE_DIALECT: ${config.DATABASE_DIALECT}`);
  } catch (error) {
    console.log('   ✗ Environment configuration failed:', error);
    allTestsPassed = false;
  }

  // Test 2: Database Connection
  console.log('\n2. Database Connection');
  try {
    const status = await databaseConnection.testConnection();
    if (status.isConnected) {
      console.log('   ✓ Database connection successful');
    } else {
      console.log('   ✗ Database connection failed:', status.error);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('   ✗ Database connection test failed:', error);
    allTestsPassed = false;
  }

  // Test 3: Database Manager
  console.log('\n3. Database Manager');
  try {
    await databaseManager.initialize();
    console.log('   ✓ Database manager initialization successful');

    const isConnected = await databaseManager.testConnection();
    if (isConnected) {
      console.log('   ✓ Database manager connection test successful');
    } else {
      console.log('   ✗ Database manager connection test failed');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('   ✗ Database manager test failed:', error);
    allTestsPassed = false;
  }

  // Test 4: Sequelize Instance
  console.log('\n4. Sequelize Instance');
  try {
    const sequelize = databaseManager.getSequelize();
    if (sequelize) {
      console.log('   ✓ Sequelize instance available');

      // Test basic query
      const result = await sequelize.query('SELECT 1 as test');
      if (
        result &&
        result[0] &&
        result[0][0] &&
        (result[0][0] as any).test === 1
      ) {
        console.log('   ✓ Basic SQL query successful');
      } else {
        console.log('   ✗ Basic SQL query failed');
        allTestsPassed = false;
      }
    } else {
      console.log('   ✗ Sequelize instance not available');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('   ✗ Sequelize instance test failed:', error);
    allTestsPassed = false;
  }

  // Test 5: Migration System
  console.log('\n5. Migration System');
  try {
    // Check if SequelizeMeta table exists (created by migrations)
    const sequelize = databaseManager.getSequelize();
    const { QueryTypes } = await import('sequelize');
    const tables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='SequelizeMeta'",
      { type: QueryTypes.SELECT }
    );

    if (tables.length > 0) {
      console.log(
        '   ✓ Migration system initialized (SequelizeMeta table exists)'
      );
    } else {
      console.log(
        '   ⚠ Migration system not yet initialized (run migrations first)'
      );
    }
  } catch (error) {
    console.log('   ✗ Migration system test failed:', error);
    allTestsPassed = false;
  }

  // Test 6: Configuration Files
  console.log('\n6. Configuration Files');
  try {
    const fs = await import('fs');

    // Check .sequelizerc
    if (fs.existsSync('.sequelizerc')) {
      console.log('   ✓ .sequelizerc file exists');
    } else {
      console.log('   ✗ .sequelizerc file missing');
      allTestsPassed = false;
    }

    // Check database-cli.js for CLI
    if (fs.existsSync('src/config/database-cli.js')) {
      console.log('   ✓ database-cli.js (CLI config) exists');
    } else {
      console.log('   ✗ database-cli.js (CLI config) missing');
      allTestsPassed = false;
    }

    // Check migration directory
    if (fs.existsSync('src/database/migrations')) {
      console.log('   ✓ migrations directory exists');
    } else {
      console.log('   ✗ migrations directory missing');
      allTestsPassed = false;
    }

    // Check seeders directory
    if (fs.existsSync('src/database/seeders')) {
      console.log('   ✓ seeders directory exists');
    } else {
      console.log('   ✗ seeders directory missing');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('   ✗ Configuration files test failed:', error);
    allTestsPassed = false;
  }

  // Cleanup
  console.log('\n7. Cleanup');
  try {
    await databaseManager.close();
    console.log('   ✓ Database connections closed successfully');
  } catch (error) {
    console.log('   ✗ Cleanup failed:', error);
    allTestsPassed = false;
  }

  // Final Result
  console.log('\n================================');
  if (allTestsPassed) {
    console.log('🎉 All database setup tests passed!');
    console.log('✅ Database and ORM configuration is complete and working.');
  } else {
    console.log('❌ Some database setup tests failed.');
    console.log('Please review the errors above and fix the issues.');
    process.exit(1);
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyDatabaseSetup().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

export { verifyDatabaseSetup };
