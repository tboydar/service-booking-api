import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.2'],     // Error rate must be below 20%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  group('High Volume Tests', () => {
    // Rapid Health Checks
    for (let i = 0; i < 5; i++) {
      const healthRes = http.get(`${BASE_URL}/health`);
      check(healthRes, {
        'health check succeeds': (r) => r.status === 200,
      });
      sleep(0.1);
    }

    // Multiple Registration Attempts
    const timestamp = Date.now();
    const emails = [];

    for (let i = 0; i < 3; i++) {
      const email = `stress${timestamp}_${i}@example.com`;
      emails.push(email);

      const registerPayload = JSON.stringify({
        email: email,
        password: 'Stress123!',
        name: `Stress User ${i}`,
      });

      const registerRes = http.post(`${BASE_URL}/auth/register`, registerPayload, {
        headers: { 'Content-Type': 'application/json' },
      });

      check(registerRes, {
        'registration handles load': (r) => [201, 400, 409].includes(r.status),
      });

      sleep(0.2);
    }

    // Concurrent Login Attempts
    emails.forEach((email) => {
      const loginPayload = JSON.stringify({
        email: email,
        password: 'Stress123!',
      });

      const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
        headers: { 'Content-Type': 'application/json' },
      });

      check(loginRes, {
        'login handles concurrent requests': (r) => [200, 401].includes(r.status),
      });
    });

    sleep(1);

    // Rapid Service Queries
    for (let i = 0; i < 10; i++) {
      const servicesRes = http.get(`${BASE_URL}/services`);
      check(servicesRes, {
        'services endpoint handles load': (r) => r.status === 200,
      });
      sleep(0.05);
    }
  });

  sleep(Math.random() * 2); // Random sleep to simulate realistic user behavior
}