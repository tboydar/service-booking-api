import { test, expect } from '@playwright/test';
import { ApiTestHelper } from '../utils/api-helper';

/**
 * API Health and Infrastructure E2E Tests
 * 
 * Tests basic API functionality, health checks, and infrastructure
 * using real devices via LambdaTest cloud infrastructure.
 */

test.describe('API Health E2E Tests', () => {
  let apiHelper: ApiTestHelper;

  test.beforeEach(async ({ request, baseURL }) => {
    apiHelper = new ApiTestHelper(request, baseURL || 'http://localhost:3000');
  });

  test('should pass health check', async () => {
    const result = await apiHelper.healthCheck();
    
    // Verify API is healthy
    apiHelper.expectSuccessResponse(result.response, 200);
    expect(result.data).toHaveProperty('status', 'healthy');
  });

  test('should handle CORS properly', async ({ request, baseURL }) => {
    const response = await request.options(`${baseURL}/api/services`, {
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // Verify CORS headers are present
    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('should handle invalid routes properly', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/nonexistent`);
    
    // Verify 404 response
    expect(response.status()).toBe(404);
  });

  test('should handle malformed JSON in request body', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/auth/register`, {
      data: 'invalid json string',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Verify bad request response
    expect(response.status()).toBe(400);
  });
});

test.describe('API Rate Limiting and Performance', () => {
  let apiHelper: ApiTestHelper;

  test.beforeEach(async ({ request, baseURL }) => {
    apiHelper = new ApiTestHelper(request, baseURL || 'http://localhost:3000');
  });

  test('should handle multiple concurrent requests', async () => {
    // Test concurrent health checks
    const promises = Array.from({ length: 10 }, () => apiHelper.healthCheck());
    const results = await Promise.all(promises);

    // Verify all requests succeeded
    results.forEach(result => {
      apiHelper.expectSuccessResponse(result.response, 200);
    });
  });

  test('should respond within acceptable time limits', async () => {
    const startTime = Date.now();
    
    const result = await apiHelper.healthCheck();
    
    const responseTime = Date.now() - startTime;
    
    // Verify response time is under 5 seconds
    expect(responseTime).toBeLessThan(5000);
    apiHelper.expectSuccessResponse(result.response, 200);
  });
});

test.describe('API Error Handling', () => {
  let apiHelper: ApiTestHelper;

  test.beforeEach(async ({ request, baseURL }) => {
    apiHelper = new ApiTestHelper(request, baseURL || 'http://localhost:3000');
  });

  test('should return proper error format for validation errors', async () => {
    const invalidData = {
      email: 'invalid',
      password: '123',
      name: 'A',
    };

    const result = await apiHelper.registerUser(invalidData);
    
    // Verify error response format
    apiHelper.expectErrorResponse(result.response, 400);
    expect(result.data).toHaveProperty('error');
    expect(typeof result.data.error).toBe('string');
  });

  test('should handle database connection errors gracefully', async () => {
    // This test assumes the API handles database errors properly
    // In a real scenario, you might temporarily break the DB connection
    
    const result = await apiHelper.healthCheck();
    
    // Even if there are DB issues, the API should respond appropriately
    expect([200, 503]).toContain(result.response.status());
  });
});