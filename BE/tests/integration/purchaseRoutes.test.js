import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app.js';
import Event from '../../models/Event.js';
import TicketClass from '../../models/TicketClass.js';
import Purchase from '../../models/Purchase.js';
import { connect, closeDatabase, clearDatabase } from '../setup.js';
import { createUser, loginWithUser, defaultLocation } from '../testUtils.js';

describe('Purchase route integration', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  const createEventAndTicketClass = async () => {
    const event = await Event.create({
      title: 'Purchase Test Event',
      genre: 'concert',
      startDateTime: new Date(Date.now() + 1000 * 60 * 60),
      endDateTime: new Date(Date.now() + 1000 * 60 * 60 * 2),
      maxCapacity: 100,
      organizer: new mongoose.Types.ObjectId(),
      location: {
        type: 'Point',
        coordinates: [106.7, 10.8],
        address: 'HCMUT'
      }
    });

    const ticketClass = await TicketClass.create({
      name: 'General Admission',
      price: 100,
      totalQuantity: 10,
      soldQuantity: 0,
      availableFrom: new Date(Date.now() - 1000 * 60 * 60),
      availableUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
      status: 'available',
      seatType: 'general',
      event: event._id
    });

    return { event, ticketClass };
  };

  test('POST /api/purchases creates purchase with pending payment', async () => {
    const { user, password } = await createUser();
    const token = await loginWithUser(user.email, password);
    const { ticketClass } = await createEventAndTicketClass();

    const response = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ticketClassId: ticketClass._id.toString(),
        quantity: 1,
        paymentMethod: 'CreditCard'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('purchaseId');
    expect(response.body.totalAmount).toBe(100);
    expect(response.body.isFree).toBe(false);
  });

  test('GET /api/purchases/my-tickets returns only paid purchases', async () => {
    const { user, password } = await createUser();
    const token = await loginWithUser(user.email, password);
    const { event, ticketClass } = await createEventAndTicketClass();

    await Purchase.create({
      user: user._id,
      event: event._id,
      ticketClass: ticketClass._id,
      quantity: 1,
      totalAmount: 100,
      originalPrice: 100,
      paymentMethod: 'CreditCard',
      paymentStatus: 'paid',
      orderCode: 123456
    });

    const response = await request(app)
      .get('/api/purchases/my-tickets')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0]).toHaveProperty('ticketList');
  });
});