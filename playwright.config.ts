import { PlaywrightTestConfig } from '@playwright/test';
import lambdaTestConfig from './e2e/config/lambdatest.config';

/**
 * Main Playwright Configuration
 * 
 * This configuration supports both local and LambdaTest cloud testing.
 * Use different configs based on environment variables.
 */

const config: PlaywrightTestConfig = {
  // Base configuration
  testDir: './e2e/tests',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Test configuration
  use: {
    baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Projects for different environments
  projects: [
    // Local testing (default)
    {
      name: 'local',
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      },
      testIgnore: process.env.USE_LAMBDATEST ? ['**/*'] : [],
    },
    
    // LambdaTest cloud testing
    ...process.env.USE_LAMBDATEST ? lambdaTestConfig.projects || [] : [],
  ],

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e-report' }],
    ['json', { outputFile: 'e2e-results/results.json' }],
    ['junit', { outputFile: 'e2e-results/results.xml' }]
  ],

  // Output directories
  outputDir: 'e2e-results/',

  // Global setup and teardown (when using LambdaTest)
  globalSetup: process.env.USE_LAMBDATEST ? 
    require.resolve('./e2e/config/global-setup.ts') : undefined,
  globalTeardown: process.env.USE_LAMBDATEST ? 
    require.resolve('./e2e/config/global-teardown.ts') : undefined,

  // Web server configuration for local testing
  webServer: process.env.USE_LAMBDATEST ? undefined : {
    command: 'npm run dev',
    port: 3000,
    timeout: 30000,
    reuseExistingServer: !process.env.CI,
  },
};

export default config;