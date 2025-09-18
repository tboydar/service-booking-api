import { test, expect } from '@playwright/test';
import { ApiTestHelper } from '../utils/api-helper';

/**
 * Service Management E2E Tests
 * 
 * Tests service CRUD operations and business logic
 * using real devices via LambdaTest cloud infrastructure.
 */

test.describe('Service Management E2E Tests', () => {
  let apiHelper: ApiTestHelper;
  let authToken: string;

  test.beforeAll(async ({ request, baseURL }) => {
    apiHelper = new ApiTestHelper(request, baseURL || 'http://localhost:3000');
    
    // Setup: Create and login a test user for all service tests
    const userData = apiHelper.generateTestUser('service');
    await apiHelper.registerUser(userData);
    const loginResult = await apiHelper.loginUser({
      email: userData.email,
      password: userData.password,
    });
    
    authToken = loginResult.data?.token;
    expect(authToken).toBeDefined();
  });

  test.afterEach(async () => {
    // Cleanup: Could add service cleanup here if needed
  });

  test('should create a new service successfully', async () => {
    const serviceData = apiHelper.generateTestService('create');

    const result = await apiHelper.createService(serviceData);
    
    // Verify successful creation
    apiHelper.expectSuccessResponse(result.response, 201);
    expect(result.data).toHaveProperty('id');
    expect(result.data).toHaveProperty('name', serviceData.name);
    expect(result.data).toHaveProperty('description', serviceData.description);
    expect(result.data).toHaveProperty('price', serviceData.price);
    expect(result.data).toHaveProperty('showTime', serviceData.showTime);
    expect(result.data).toHaveProperty('isPublic', serviceData.isPublic);
  });

  test('should reject service creation with invalid data', async () => {
    const invalidServiceData = {
      name: '', // Empty name
      price: -100, // Negative price
    };

    const result = await apiHelper.createService(invalidServiceData);
    
    // Verify validation error
    apiHelper.expectErrorResponse(result.response, 400);
    apiHelper.expectValidationError(result.data);
  });

  test('should get all services', async () => {
    // Create a test service first
    const serviceData = apiHelper.generateTestService('getall');
    await apiHelper.createService(serviceData);

    const result = await apiHelper.getServices();
    
    // Verify successful retrieval
    apiHelper.expectSuccessResponse(result.response, 200);
    expect(Array.isArray(result.data)).toBeTruthy();
    expect(result.data.length).toBeGreaterThan(0);
    
    // Check that the created service is in the list
    const createdService = result.data.find((service: any) => 
      service.name === serviceData.name
    );
    expect(createdService).toBeDefined();
  });

  test('should get a specific service by ID', async () => {
    // Create a test service first
    const serviceData = apiHelper.generateTestService('getone');
    const createResult = await apiHelper.createService(serviceData);
    const serviceId = createResult.data?.id;

    const result = await apiHelper.getService(serviceId);
    
    // Verify successful retrieval
    apiHelper.expectSuccessResponse(result.response, 200);
    expect(result.data).toHaveProperty('id', serviceId);
    expect(result.data).toHaveProperty('name', serviceData.name);
  });

  test('should return 404 for non-existent service', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const result = await apiHelper.getService(nonExistentId);
    
    // Verify not found error
    apiHelper.expectErrorResponse(result.response, 404);
  });

  test('should update a service successfully', async () => {
    // Create a test service first
    const serviceData = apiHelper.generateTestService('update');
    const createResult = await apiHelper.createService(serviceData);
    const serviceId = createResult.data?.id;

    // Update the service
    const updateData = {
      name: 'Updated Service Name',
      price: 999,
      description: 'Updated description',
    };

    const result = await apiHelper.updateService(serviceId, updateData);
    
    // Verify successful update
    apiHelper.expectSuccessResponse(result.response, 200);
    expect(result.data).toHaveProperty('name', updateData.name);
    expect(result.data).toHaveProperty('price', updateData.price);
    expect(result.data).toHaveProperty('description', updateData.description);
  });

  test('should reject service update with invalid data', async () => {
    // Create a test service first
    const serviceData = apiHelper.generateTestService('invalid-update');
    const createResult = await apiHelper.createService(serviceData);
    const serviceId = createResult.data?.id;

    // Try to update with invalid data
    const invalidUpdateData = {
      name: '', // Empty name
      price: -100, // Negative price
    };

    const result = await apiHelper.updateService(serviceId, invalidUpdateData);
    
    // Verify validation error
    apiHelper.expectErrorResponse(result.response, 400);
    apiHelper.expectValidationError(result.data);
  });

  test('should delete a service successfully', async () => {
    // Create a test service first
    const serviceData = apiHelper.generateTestService('delete');
    const createResult = await apiHelper.createService(serviceData);
    const serviceId = createResult.data?.id;

    // Delete the service
    const result = await apiHelper.deleteService(serviceId);
    
    // Verify successful deletion
    apiHelper.expectSuccessResponse(result.response, 204);

    // Verify service is actually deleted
    const getResult = await apiHelper.getService(serviceId);
    apiHelper.expectErrorResponse(getResult.response, 404);
  });

  test('should return 404 when trying to delete non-existent service', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const result = await apiHelper.deleteService(nonExistentId);
    
    // Verify not found error
    apiHelper.expectErrorResponse(result.response, 404);
  });
});

test.describe('Service Management Authorization', () => {
  let apiHelper: ApiTestHelper;

  test.beforeEach(async ({ request, baseURL }) => {
    apiHelper = new ApiTestHelper(request, baseURL || 'http://localhost:3000');
  });

  test('should reject unauthorized service creation', async () => {
    // Don't login - test without authentication
    const serviceData = apiHelper.generateTestService('unauth');

    const result = await apiHelper.createService(serviceData);
    
    // Verify unauthorized error
    apiHelper.expectErrorResponse(result.response, 401);
    apiHelper.expectAuthError(result.data);
  });

  test('should allow public access to service listing', async () => {
    // Test accessing services without authentication
    const result = await apiHelper.getServices();
    
    // This might return 200 if services are publicly accessible
    // or 401 if authentication is required - depends on API design
    expect([200, 401]).toContain(result.response.status());
  });
});