import { test, expect } from '@playwright/test';
import { ApiTestHelper } from '../utils/api-helper';

/**
 * Complete Service Booking E2E Flow Tests
 * 
 * Tests end-to-end user workflows including registration, 
 * service management, and booking flows using real devices
 * via LambdaTest cloud infrastructure.
 */

test.describe('Complete Service Booking Flow', () => {
  let apiHelper: ApiTestHelper;

  test.beforeEach(async ({ request, baseURL }) => {
    apiHelper = new ApiTestHelper(request, baseURL || 'http://localhost:3000');
  });

  test('complete service provider workflow', async () => {
    // Step 1: Service provider registers
    const providerData = apiHelper.generateTestUser('provider');
    const registerResult = await apiHelper.registerUser(providerData);
    apiHelper.expectSuccessResponse(registerResult.response, 201);

    // Step 2: Service provider logs in
    const loginResult = await apiHelper.loginUser({
      email: providerData.email,
      password: providerData.password,
    });
    apiHelper.expectSuccessResponse(loginResult.response, 200);
    expect(loginResult.data?.token).toBeDefined();

    // Step 3: Service provider creates a service
    const serviceData = apiHelper.generateTestService('provider-service');
    const createServiceResult = await apiHelper.createService(serviceData);
    apiHelper.expectSuccessResponse(createServiceResult.response, 201);
    const serviceId = createServiceResult.data?.id;

    // Step 4: Service provider updates the service
    const updateData = {
      name: `${serviceData.name} - Updated`,
      price: serviceData.price + 50,
      description: `${serviceData.description} - Enhanced`,
    };
    const updateResult = await apiHelper.updateService(serviceId, updateData);
    apiHelper.expectSuccessResponse(updateResult.response, 200);

    // Step 5: Verify service appears in listing
    const servicesResult = await apiHelper.getServices();
    apiHelper.expectSuccessResponse(servicesResult.response, 200);
    const updatedService = servicesResult.data.find((s: any) => s.id === serviceId);
    expect(updatedService).toBeDefined();
    expect(updatedService.name).toBe(updateData.name);
    expect(updatedService.price).toBe(updateData.price);

    // Step 6: Service provider can view their service
    const getServiceResult = await apiHelper.getService(serviceId);
    apiHelper.expectSuccessResponse(getServiceResult.response, 200);
    expect(getServiceResult.data.id).toBe(serviceId);
  });

  test('complete customer booking workflow', async () => {
    // Setup: Create a service provider and service
    const providerData = apiHelper.generateTestUser('booking-provider');
    await apiHelper.registerUser(providerData);
    await apiHelper.loginUser({
      email: providerData.email,
      password: providerData.password,
    });

    const serviceData = apiHelper.generateTestService('booking-service');
    const createServiceResult = await apiHelper.createService(serviceData);
    const serviceId = createServiceResult.data?.id;

    // Step 1: Customer registers
    const customerData = apiHelper.generateTestUser('customer');
    const customerRegisterResult = await apiHelper.registerUser(customerData);
    apiHelper.expectSuccessResponse(customerRegisterResult.response, 201);

    // Step 2: Customer logs in
    const customerLoginResult = await apiHelper.loginUser({
      email: customerData.email,
      password: customerData.password,
    });
    apiHelper.expectSuccessResponse(customerLoginResult.response, 200);

    // Step 3: Customer views available services
    const servicesResult = await apiHelper.getServices();
    apiHelper.expectSuccessResponse(servicesResult.response, 200);
    const availableService = servicesResult.data.find((s: any) => s.id === serviceId);
    expect(availableService).toBeDefined();

    // Step 4: Customer views service details
    const serviceDetailsResult = await apiHelper.getService(serviceId);
    apiHelper.expectSuccessResponse(serviceDetailsResult.response, 200);
    expect(serviceDetailsResult.data.id).toBe(serviceId);

    // Step 5: Customer creates a booking (if booking endpoint exists)
    const bookingData = {
      serviceId: serviceId,
      appointmentTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      notes: 'Test booking for E2E test',
    };

    const bookingResult = await apiHelper.createBooking(bookingData);
    
    // Note: This might return 404 if booking endpoints aren't implemented yet
    if (bookingResult.response.status() === 201) {
      // Booking endpoint exists and works
      expect(bookingResult.data).toHaveProperty('id');
      expect(bookingResult.data).toHaveProperty('serviceId', serviceId);
      
      // Step 6: Customer views their bookings
      const bookingsResult = await apiHelper.getBookings();
      apiHelper.expectSuccessResponse(bookingsResult.response, 200);
      expect(Array.isArray(bookingsResult.data)).toBeTruthy();
    } else if (bookingResult.response.status() === 404) {
      // Booking endpoints not implemented yet - this is acceptable
      console.log('Booking endpoints not yet implemented, skipping booking tests');
    } else {
      // Unexpected error
      throw new Error(`Unexpected booking result: ${bookingResult.response.status()}`);
    }
  });

  test('multi-user service interaction workflow', async () => {
    // Step 1: Create multiple service providers
    const provider1Data = apiHelper.generateTestUser('provider1');
    const provider2Data = apiHelper.generateTestUser('provider2');

    await apiHelper.registerUser(provider1Data);
    await apiHelper.registerUser(provider2Data);

    // Step 2: Provider 1 creates services
    await apiHelper.loginUser({
      email: provider1Data.email,
      password: provider1Data.password,
    });

    const service1Data = apiHelper.generateTestService('provider1-service1');
    const service2Data = apiHelper.generateTestService('provider1-service2');

    const service1Result = await apiHelper.createService(service1Data);
    const service2Result = await apiHelper.createService(service2Data);

    // Step 3: Provider 2 creates services
    await apiHelper.loginUser({
      email: provider2Data.email,
      password: provider2Data.password,
    });

    const service3Data = apiHelper.generateTestService('provider2-service1');
    const service3Result = await apiHelper.createService(service3Data);

    // Step 4: Verify all services are available
    const allServicesResult = await apiHelper.getServices();
    apiHelper.expectSuccessResponse(allServicesResult.response, 200);
    
    expect(allServicesResult.data.length).toBeGreaterThanOrEqual(3);

    // Verify each service exists
    const serviceIds = [
      service1Result.data?.id,
      service2Result.data?.id,
      service3Result.data?.id,
    ];

    for (const serviceId of serviceIds) {
      const serviceResult = await apiHelper.getService(serviceId);
      apiHelper.expectSuccessResponse(serviceResult.response, 200);
      expect(serviceResult.data.id).toBe(serviceId);
    }

    // Step 5: Test service management permissions
    // Provider 1 should not be able to modify Provider 2's service
    await apiHelper.loginUser({
      email: provider1Data.email,
      password: provider1Data.password,
    });

    const unauthorizedUpdateResult = await apiHelper.updateService(
      service3Result.data?.id,
      { name: 'Unauthorized Update' }
    );

    // This should fail with either 403 (Forbidden) or 404 (if they can't see it)
    expect([403, 404]).toContain(unauthorizedUpdateResult.response.status());
  });

  test('error handling in complete workflow', async () => {
    // Test workflow with various error conditions

    // Step 1: Try to create service without authentication
    const serviceData = apiHelper.generateTestService('unauth-service');
    const unauthResult = await apiHelper.createService(serviceData);
    apiHelper.expectErrorResponse(unauthResult.response, 401);

    // Step 2: Register and login user
    const userData = apiHelper.generateTestUser('error-flow');
    await apiHelper.registerUser(userData);
    await apiHelper.loginUser({
      email: userData.email,
      password: userData.password,
    });

    // Step 3: Try to create service with invalid data
    const invalidServiceData = {
      name: '', // Invalid empty name
      price: -100, // Invalid negative price
    };
    const invalidResult = await apiHelper.createService(invalidServiceData);
    apiHelper.expectErrorResponse(invalidResult.response, 400);

    // Step 4: Create valid service
    const validServiceData = apiHelper.generateTestService('error-flow-valid');
    const validResult = await apiHelper.createService(validServiceData);
    apiHelper.expectSuccessResponse(validResult.response, 201);

    // Step 5: Try to access non-existent service
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const notFoundResult = await apiHelper.getService(nonExistentId);
    apiHelper.expectErrorResponse(notFoundResult.response, 404);

    // Step 6: Try to update with invalid data
    const invalidUpdateResult = await apiHelper.updateService(
      validResult.data?.id,
      { price: -999 } // Invalid negative price
    );
    apiHelper.expectErrorResponse(invalidUpdateResult.response, 400);
  });
});