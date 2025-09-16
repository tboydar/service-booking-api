// Test setup configuration

// Set test environment
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_STORAGE'] = ':memory:';
process.env['JWT_SECRET'] = 'test-jwt-secret';

// Global test timeout
jest.setTimeout(30000);
