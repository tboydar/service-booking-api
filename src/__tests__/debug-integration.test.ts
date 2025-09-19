import request from 'supertest';
import { createApp } from '../index';
import { initializeDatabase } from '../database/init';
import { sequelize } from '../config/database';

describe('Debug Integration Test', () => {
  let app: any;

  beforeAll(async () => {
    await initializeDatabase();
    app = createApp().callback();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    await initializeDatabase();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should debug duplicate email registration', async () => {
    const userData = {
      email: 'duplicate@example.com',
      password: 'password123',
      name: 'First User',
    };

    // First registration should succeed
    const firstResponse = await request(app)
      .post('/auth/register')
      .send(userData);

    console.log('First registration response:', {
      status: firstResponse.status,
      body: firstResponse.body,
    });

    // Second registration should fail
    const secondResponse = await request(app)
      .post('/auth/register')
      .send({
        ...userData,
        name: 'Second User',
      });

    console.log('Second registration response:', {
      status: secondResponse.status,
      body: secondResponse.body,
    });
  });

  it('should debug login with wrong password', async () => {
    // First register a user
    await request(app).post('/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    // Try to login with wrong password
    const response = await request(app).post('/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    console.log('Login with wrong password response:', {
      status: response.status,
      body: response.body,
    });
  });

  it('should debug non-existent service', async () => {
    const fakeId = '123e4567-e89b-12d3-a456-426614174000';
    const response = await request(app).get(`/services/${fakeId}`);

    console.log('Non-existent service response:', {
      status: response.status,
      body: response.body,
    });
  });
});
