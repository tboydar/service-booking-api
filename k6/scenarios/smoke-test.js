import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 3, // 3 virtual users
  duration: '1m', // Duration of 1 minute
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Health Check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check has success flag': (r) => JSON.parse(r.body).success === true,
  });

  sleep(1);

  // Test 2: User Registration
  const registerPayload = JSON.stringify({
    email: `test${Date.now()}@example.com`,
    password: 'Test123!',
    name: `Test User ${Date.now()}`,
  });

  const registerRes = http.post(`${BASE_URL}/auth/register`, registerPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(registerRes, {
    'registration status is 201': (r) => r.status === 201,
    'registration returns token': (r) => JSON.parse(r.body).data?.token !== undefined,
  });

  sleep(1);

  // Test 3: User Login
  const loginPayload = JSON.stringify({
    email: 'admin@example.com',
    password: 'Admin123!',
  });

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => JSON.parse(r.body).data?.token !== undefined,
  });

  const token = loginRes.status === 200 ? JSON.parse(loginRes.body).data.token : '';

  sleep(1);

  // Test 4: Get Services
  const servicesRes = http.get(`${BASE_URL}/services`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  check(servicesRes, {
    'get services status is 200': (r) => r.status === 200,
    'get services returns array': (r) => Array.isArray(JSON.parse(r.body).data),
  });

  sleep(2);
}