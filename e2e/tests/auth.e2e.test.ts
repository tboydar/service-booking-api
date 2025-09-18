import { test, expect } from '@playwright/test';
import { ApiTestHelper } from '../utils/api-helper';

/**
 * Authentication E2E Tests
 * 
 * Tests user registration, login, and authentication flows
 * using real devices via LambdaTest cloud infrastructure.
 */

test.describe('Authentication E2E Tests', () => {
  let apiHelper: ApiTestHelper;

  test.beforeEach(async ({ request, baseURL }) => {
    apiHelper = new ApiTestHelper(request, baseURL || 'http://localhost:3000');
  });

  test.afterEach(async () => {
    // Cleanup after each test
    apiHelper.clearAuthToken();
  });

  test('should register a new user successfully', async () => {
    // Generate unique test data
    const userData = apiHelper.generateTestUser('register');

    // Register user
    const result = await apiHelper.registerUser(userData);
    
    // Verify successful registration
    apiHelper.expectSuccessResponse(result.response, 201);
    expect(result.data).toHaveProperty('id');
    expect(result.data).toHaveProperty('email', userData.email);
    expect(result.data).toHaveProperty('name', userData.name);
    expect(result.data).not.toHaveProperty('password'); // Password should not be returned
  });

  test('should reject registration with invalid email', async () => {
    const invalidUserData = {
      email: 'invalid-email',
      password: 'password123',
      name: 'Test User',
    };

    const result = await apiHelper.registerUser(invalidUserData);
    
    // Verify validation error
    apiHelper.expectErrorResponse(result.response, 400);
    apiHelper.expectValidationError(result.data);
  });

  test('should reject registration with weak password', async () => {
    const weakPasswordData = {
      email: 'test@example.com',
      password: '123', // Too short
      name: 'Test User',
    };

    const result = await apiHelper.registerUser(weakPasswordData);
    
    // Verify validation error
    apiHelper.expectErrorResponse(result.response, 400);
    apiHelper.expectValidationError(result.data);
  });

  test('should login successfully with valid credentials', async () => {
    // First register a user
    const userData = apiHelper.generateTestUser('login');
    await apiHelper.registerUser(userData);

    // Then login
    const loginResult = await apiHelper.loginUser({
      email: userData.email,
      password: userData.password,
    });

    // Verify successful login
    apiHelper.expectSuccessResponse(loginResult.response, 200);
    expect(loginResult.data).toHaveProperty('token');
    expect(loginResult.data).toHaveProperty('user');
    expect(loginResult.data.user).toHaveProperty('email', userData.email);
  });

  test('should reject login with invalid credentials', async () => {
    const invalidCredentials = {
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
    };

    const result = await apiHelper.loginUser(invalidCredentials);
    
    // Verify authentication error
    apiHelper.expectErrorResponse(result.response, 401);
    apiHelper.expectAuthError(result.data);
  });

  test('should handle duplicate email registration', async () => {
    // Register user first time
    const userData = apiHelper.generateTestUser('duplicate');
    await apiHelper.registerUser(userData);

    // Try to register same email again
    const duplicateResult = await apiHelper.registerUser(userData);
    
    // Verify conflict error
    apiHelper.expectErrorResponse(duplicateResult.response, 409);
    expect(duplicateResult.data?.error).toContain('already registered');
  });
});

test.describe('Authentication Flow Integration', () => {
  let apiHelper: ApiTestHelper;

  test.beforeEach(async ({ request, baseURL }) => {
    apiHelper = new ApiTestHelper(request, baseURL || 'http://localhost:3000');
  });

  test('complete user registration and login flow', async () => {
    const userData = apiHelper.generateTestUser('flow');

    // Step 1: Register user
    const registerResult = await apiHelper.registerUser(userData);
    apiHelper.expectSuccessResponse(registerResult.response, 201);

    // Step 2: Login with registered credentials
    const loginResult = await apiHelper.loginUser({
      email: userData.email,
      password: userData.password,
    });
    apiHelper.expectSuccessResponse(loginResult.response, 200);
    expect(loginResult.data?.token).toBeDefined();

    // Step 3: Verify token is stored for subsequent requests
    // This would be tested by making an authenticated request
    // (e.g., creating a service) in the next test suite
  });
});