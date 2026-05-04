import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../app.js';
import User from '../../models/User.js';
import { connect, closeDatabase, clearDatabase } from '../setup.js';

const userData = {
  firstName: 'Test',
  lastName: 'User',
  gender: 'male',
  email: 'test.user@example.com',
  phoneNumber: '0123456789',
  password: 'Password123!',
  role: 'user',
  location: {
    type: 'Point',
    coordinates: [106.7, 10.8]
  }
};

describe('User route integration', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('POST /api/user creates a new user and returns status 201', async () => {
    const response = await request(app)
      .post('/api/user')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.email).toBe(userData.email);
    expect(response.body.role).toBe('user');
    expect(response.body).not.toHaveProperty('password');
  });

  test('POST /api/user/login returns token for valid credentials', async () => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await User.create({ ...userData, password: hashedPassword });

    const response = await request(app)
      .post('/api/user/login')
      .send({ email: userData.email, password: userData.password });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  test('POST /api/user/login returns 401 for invalid password', async () => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await User.create({ ...userData, password: hashedPassword });

    const response = await request(app)
      .post('/api/user/login')
      .send({ email: userData.email, password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/Sai mật khẩu/);
  });

  test('GET /api/user/profile returns profile when token is valid', async () => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await User.create({ ...userData, password: hashedPassword });

    const loginResponse = await request(app)
      .post('/api/user/login')
      .send({ email: userData.email, password: userData.password });

    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.token;

    const profileResponse = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.email).toBe(userData.email);
    expect(profileResponse.body).not.toHaveProperty('password');
  });

  test('GET /api/user with non-admin user returns 403', async () => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await User.create({ ...userData, password: hashedPassword });

    const loginResponse = await request(app)
      .post('/api/user/login')
      .send({ email: userData.email, password: userData.password });

    const token = loginResponse.body.token;
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/Bạn không có quyền truy cập/);
  });

  test('GET /api/user with admin user returns list of users', async () => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await User.create({ ...userData, password: hashedPassword, role: 'admin', email: 'admin@example.com' });

    const loginResponse = await request(app)
      .post('/api/user/login')
      .send({ email: 'admin@example.com', password: userData.password });

    const token = loginResponse.body.token;
    const response = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});