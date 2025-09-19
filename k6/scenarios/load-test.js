import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  // Setup: Login and get token
  const loginPayload = JSON.stringify({
    email: 'admin@example.com',
    password: 'Admin123!',
  });

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const token = loginRes.status === 200 ? JSON.parse(loginRes.body).data.token : '';
  return { token };
}

export default function (data) {
  group('API Endpoints', () => {
    // Health Check
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
      'health check status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // Get Services (Public)
    const servicesRes = http.get(`${BASE_URL}/services`);
    check(servicesRes, {
      'public services status is 200': (r) => r.status === 200,
    });

    sleep(1);
  });

  group('Authenticated Endpoints', () => {
    // Create Service
    const servicePayload = JSON.stringify({
      name: `Load Test Service ${Date.now()}`,
      description: 'Service created during load testing',
      price: 1000,
      duration: 60,
    });

    const createRes = http.post(`${BASE_URL}/services`, servicePayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`,
      },
    });

    check(createRes, {
      'create service status is 201 or 401': (r) => [201, 401].includes(r.status),
    });

    if (createRes.status === 201) {
      const serviceId = JSON.parse(createRes.body).data.id;

      sleep(1);

      // Update Service
      const updatePayload = JSON.stringify({
        name: `Updated Service ${Date.now()}`,
        price: 2000,
      });

      const updateRes = http.put(`${BASE_URL}/services/${serviceId}`, updatePayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`,
        },
      });

      check(updateRes, {
        'update service status is 200': (r) => r.status === 200,
      });

      sleep(1);

      // Delete Service
      const deleteRes = http.del(`${BASE_URL}/services/${serviceId}`, null, {
        headers: {
          'Authorization': `Bearer ${data.token}`,
        },
      });

      check(deleteRes, {
        'delete service status is 200': (r) => r.status === 200,
      });
    }

    sleep(2);
  });

  group('Admin Panel', () => {
    // Admin Dashboard Stats
    const statsRes = http.get(`${BASE_URL}/admin/api/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${data.token}`,
      },
    });

    check(statsRes, {
      'admin stats status is 200 or 403': (r) => [200, 403].includes(r.status),
    });

    sleep(1);

    // System Info
    const systemRes = http.get(`${BASE_URL}/admin/api/system`, {
      headers: {
        'Authorization': `Bearer ${data.token}`,
      },
    });

    check(systemRes, {
      'system info status is 200 or 403': (r) => [200, 403].includes(r.status),
    });

    sleep(1);
  });
}