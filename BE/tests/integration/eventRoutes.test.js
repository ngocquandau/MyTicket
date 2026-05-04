import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { connect, closeDatabase, clearDatabase } from '../setup.js';
import { createAdminUser, createUser, loginWithUser, defaultLocation } from '../testUtils.js';

describe('Event route integration', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  const eventPayload = {
    title: 'Integration Test Event',
    genre: 'concert',
    startDateTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    endDateTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    maxCapacity: 100,
    organizer: new mongoose.Types.ObjectId().toString(),
    location: {
      type: 'Point',
      coordinates: [106.7, 10.8],
      address: 'HCMUT Campus'
    }
  };

  test('POST /api/event without token returns 403', async () => {
    const response = await request(app)
      .post('/api/event')
      .send(eventPayload);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/Thiếu token/);
  });

  test('POST /api/event with non-admin user returns 403', async () => {
    const { user, password } = await createUser();
    const token = await loginWithUser(user.email, password);

    const response = await request(app)
      .post('/api/event')
      .set('Authorization', `Bearer ${token}`)
      .send(eventPayload);

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/Bạn không có quyền truy cập/);
  });

  test('POST /api/event with admin user creates an event', async () => {
    const { user, password } = await createAdminUser({ email: 'admin-event@example.com' });
    const token = await loginWithUser(user.email, password);

    const response = await request(app)
      .post('/api/event')
      .set('Authorization', `Bearer ${token}`)
      .send(eventPayload);

    expect(response.status).toBe(201);
    expect(response.body.title).toBe(eventPayload.title);
    expect(response.body.genre).toBe(eventPayload.genre);
    expect(response.body.organizer).toBe(eventPayload.organizer);
  });

  test('GET /api/event returns created events', async () => {
    const { user, password } = await createAdminUser({ email: 'admin-event2@example.com' });
    const token = await loginWithUser(user.email, password);

    await request(app)
      .post('/api/event')
      .set('Authorization', `Bearer ${token}`)
      .send(eventPayload)
      .expect(201);

    const listResponse = await request(app)
      .get('/api/event')
      .send();

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.events)).toBe(true);
    expect(listResponse.body.events.length).toBeGreaterThanOrEqual(1);
    expect(listResponse.body.events[0]).toHaveProperty('title', eventPayload.title);
  });
});