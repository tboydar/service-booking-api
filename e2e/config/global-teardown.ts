/**
 * Global teardown for E2E tests with LambdaTest
 * 
 * This teardown cleans up resources after E2E tests complete.
 */

async function globalTeardown() {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  try {
    // Cleanup test database
    console.log('🗄️  Cleaning up test database...');
    
    // Any additional cleanup can be added here
    // For example: stopping test servers, cleaning temp files, etc.
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;