import { PlaywrightTestConfig } from '@playwright/test';

/**
 * LambdaTest Configuration for E2E Testing on Real Devices
 * 
 * This configuration integrates with LambdaTest's cloud testing platform
 * to run E2E tests on real devices and browsers.
 */

const lambdaTestConfig: PlaywrightTestConfig = {
  testDir: '../tests',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // LambdaTest specific configuration
  use: {
    // Connect to LambdaTest cloud
    connectOptions: {
      wsEndpoint: `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify({
        'browserName': 'Chrome',
        'browserVersion': 'latest',
        'LT:Options': {
          'platform': 'Windows 10',
          'build': 'Service Booking API E2E Tests',
          'name': 'API E2E Test Suite',
          'user': process.env.LT_USERNAME,
          'accessKey': process.env.LT_ACCESS_KEY,
          'network': true,
          'video': true,
          'console': true,
          'tunnel': false, // Set to true if testing local API
        }
      }))}`,
    },
    
    // Test configuration
    baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Define multiple browser configurations for cross-platform testing
  projects: [
    {
      name: 'chrome-windows',
      use: {
        connectOptions: {
          wsEndpoint: `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify({
            'browserName': 'Chrome',
            'browserVersion': 'latest',
            'LT:Options': {
              'platform': 'Windows 10',
              'build': 'Service Booking API E2E Tests',
              'name': 'Chrome Windows - API Tests',
              'user': process.env.LT_USERNAME,
              'accessKey': process.env.LT_ACCESS_KEY,
              'network': true,
              'video': true,
              'console': true,
            }
          }))}`,
        }
      }
    },
    {
      name: 'chrome-macos',
      use: {
        connectOptions: {
          wsEndpoint: `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify({
            'browserName': 'Chrome',
            'browserVersion': 'latest',
            'LT:Options': {
              'platform': 'macOS Big Sur',
              'build': 'Service Booking API E2E Tests',
              'name': 'Chrome macOS - API Tests',
              'user': process.env.LT_USERNAME,
              'accessKey': process.env.LT_ACCESS_KEY,
              'network': true,
              'video': true,
              'console': true,
            }
          }))}`,
        }
      }
    },
    {
      name: 'firefox-linux',
      use: {
        connectOptions: {
          wsEndpoint: `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify({
            'browserName': 'Firefox',
            'browserVersion': 'latest',
            'LT:Options': {
              'platform': 'Ubuntu 22.04',
              'build': 'Service Booking API E2E Tests',
              'name': 'Firefox Linux - API Tests',
              'user': process.env.LT_USERNAME,
              'accessKey': process.env.LT_ACCESS_KEY,
              'network': true,
              'video': true,
              'console': true,
            }
          }))}`,
        }
      }
    },
    {
      name: 'edge-windows',
      use: {
        connectOptions: {
          wsEndpoint: `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify({
            'browserName': 'MicrosoftEdge',
            'browserVersion': 'latest',
            'LT:Options': {
              'platform': 'Windows 11',
              'build': 'Service Booking API E2E Tests',
              'name': 'Edge Windows - API Tests',
              'user': process.env.LT_USERNAME,
              'accessKey': process.env.LT_ACCESS_KEY,
              'network': true,
              'video': true,
              'console': true,
            }
          }))}`,
        }
      }
    }
  ],

  // Reporter configuration for LambdaTest
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),
};

export default lambdaTestConfig;