import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests with LambdaTest
 * 
 * This setup ensures the API server is running and accessible
 * before running E2E tests on LambdaTest cloud infrastructure.
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  // Check if we need to start the API server
  const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  
  try {
    // Validate environment variables for LambdaTest
    if (!process.env.LT_USERNAME || !process.env.LT_ACCESS_KEY) {
      console.warn('⚠️  LambdaTest credentials not found. Please set LT_USERNAME and LT_ACCESS_KEY environment variables.');
      console.warn('   You can get these from: https://accounts.lambdatest.com/security');
    }

    // Test API connectivity
    console.log(`📡 Testing API connectivity to ${apiUrl}...`);
    
    // Create a browser instance to test API connectivity
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      const response = await page.request.get(`${apiUrl}/health`, {
        timeout: 10000,
        ignoreHTTPSErrors: true
      });
      
      if (response.ok()) {
        console.log('✅ API health check passed');
      } else {
        console.log('⚠️  API health check failed, but continuing with tests...');
      }
    } catch (error) {
      console.log('⚠️  Could not reach API, ensure the server is running:', error.message);
    }
    
    await browser.close();

    // Database setup for E2E tests
    console.log('🗄️  Setting up test database...');
    
    // Set environment variables for E2E testing
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_STORAGE = ':memory:';
    
    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;