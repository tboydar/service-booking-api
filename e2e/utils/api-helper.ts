import { expect, APIRequestContext } from '@playwright/test';

/**
 * API Test Helper for Service Booking API E2E Tests
 * 
 * This utility class provides helper methods for testing the API endpoints
 * with proper authentication and data validation.
 */

export class ApiTestHelper {
  private request: APIRequestContext;
  private baseURL: string;
  private authToken?: string;

  constructor(request: APIRequestContext, baseURL: string) {
    this.request = request;
    this.baseURL = baseURL;
  }

  /**
   * User Authentication Methods
   */
  async registerUser(userData: {
    email: string;
    password: string;
    name: string;
  }) {
    const response = await this.request.post(`${this.baseURL}/api/auth/register`, {
      data: userData,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return {
      response,
      data: response.ok() ? await response.json() : null,
    };
  }

  async loginUser(credentials: { email: string; password: string }) {
    const response = await this.request.post(`${this.baseURL}/api/auth/login`, {
      data: credentials,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = {
      response,
      data: response.ok() ? await response.json() : null,
    };

    // Store auth token for subsequent requests
    if (result.data?.token) {
      this.authToken = result.data.token;
    }

    return result;
  }

  /**
   * Service Management Methods
   */
  async createService(serviceData: {
    name: string;
    description?: string;
    price: number;
    showTime?: number;
    order?: number;
    isPublic?: boolean;
  }) {
    const response = await this.request.post(`${this.baseURL}/api/services`, {
      data: serviceData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined,
      },
    });

    return {
      response,
      data: response.ok() ? await response.json() : null,
    };
  }

  async getServices() {
    const response = await this.request.get(`${this.baseURL}/api/services`, {
      headers: {
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined,
      },
    });

    return {
      response,
      data: response.ok() ? await response.json() : null,
    };
  }

  async getService(serviceId: string) {
    const response = await this.request.get(`${this.baseURL}/api/services/${serviceId}`, {
      headers: {
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined,
      },
    });

    return {
      response,
      data: response.ok() ? await response.json() : null,
    };
  }

  async updateService(serviceId: string, updateData: {
    name?: string;
    description?: string;
    price?: number;
    showTime?: number;
    order?: number;
    isPublic?: boolean;
  }) {
    const response = await this.request.put(`${this.baseURL}/api/services/${serviceId}`, {
      data: updateData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined,
      },
    });

    return {
      response,
      data: response.ok() ? await response.json() : null,
    };
  }

  async deleteService(serviceId: string) {
    const response = await this.request.delete(`${this.baseURL}/api/services/${serviceId}`, {
      headers: {
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined,
      },
    });

    return {
      response,
      data: response.ok() ? await response.json() : null,
    };
  }

  /**
   * Booking Management Methods (when implemented)
   */
  async createBooking(bookingData: {
    serviceId: string;
    appointmentTime: string;
    notes?: string;
  }) {
    const response = await this.request.post(`${this.baseURL}/api/bookings`, {
      data: bookingData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined,
      },
    });

    return {
      response,
      data: response.ok() ? await response.json() : null,
    };
  }

  async getBookings() {
    const response = await this.request.get(`${this.baseURL}/api/bookings`, {
      headers: {
        'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined,
      },
    });

    return {
      response,
      data: response.ok() ? await response.json() : null,
    };
  }

  /**
   * Health Check and Utility Methods
   */
  async healthCheck() {
    const response = await this.request.get(`${this.baseURL}/health`);
    return {
      response,
      data: response.ok() ? await response.json() : null,
    };
  }

  /**
   * Assertion Helpers
   */
  expectSuccessResponse(response: any, expectedStatus = 200) {
    expect(response.status()).toBe(expectedStatus);
    expect(response.ok()).toBeTruthy();
  }

  expectErrorResponse(response: any, expectedStatus: number) {
    expect(response.status()).toBe(expectedStatus);
    expect(response.ok()).toBeFalsy();
  }

  expectValidationError(data: any) {
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('驗證失敗');
  }

  expectAuthError(data: any) {
    expect(data).toHaveProperty('error');
    expect(['未授權', 'Token 無效', '請先登入'].some(msg => 
      data.error.includes(msg)
    )).toBeTruthy();
  }

  /**
   * Test Data Generators
   */
  generateTestUser(suffix = '') {
    const timestamp = Date.now();
    return {
      email: `test${suffix}_${timestamp}@example.com`,
      password: 'password123',
      name: `Test User ${suffix} ${timestamp}`,
    };
  }

  generateTestService(suffix = '') {
    const timestamp = Date.now();
    return {
      name: `Test Service ${suffix} ${timestamp}`,
      description: `Test service description ${suffix}`,
      price: Math.floor(Math.random() * 1000) + 100,
      showTime: 60,
      order: 1,
      isPublic: true,
    };
  }

  /**
   * Cleanup Methods
   */
  clearAuthToken() {
    this.authToken = undefined;
  }
}

/**
 * Test Data Fixtures
 */
export const TestData = {
  validUser: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  },

  invalidUser: {
    email: 'invalid-email',
    password: '123', // Too short
    name: 'A', // Too short
  },

  validService: {
    name: 'Test Service',
    description: 'A test service',
    price: 100,
    showTime: 60,
    order: 1,
    isPublic: true,
  },

  invalidService: {
    name: '', // Empty name
    price: -100, // Negative price
  },
};