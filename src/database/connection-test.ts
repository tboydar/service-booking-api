import { databaseManager } from './index';

/**
 * Test database connection
 * This utility can be used to verify database setup
 */
export const testDatabaseConnection = async (): Promise<void> => {
  try {
    console.log('Testing database connection...');

    // Initialize database connection
    await databaseManager.initialize();

    // Test connection
    const isConnected = await databaseManager.testConnection();

    if (isConnected) {
      console.log('✅ Database connection test passed');
    } else {
      console.log('❌ Database connection test failed');
      throw new Error('Database connection test failed');
    }

    // Close connection
    await databaseManager.close();
  } catch (error) {
    console.error('Database connection test error:', error);
    throw error;
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      console.log('Database connection test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database connection test failed:', error);
      process.exit(1);
    });
}
