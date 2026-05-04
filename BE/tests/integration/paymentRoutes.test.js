import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import Purchase from '../../models/Purchase.js';
import User from '../../models/User.js';
import { connect, closeDatabase, clearDatabase } from '../setup.js';
import { createUser, loginWithUser } from '../testUtils.js';

describe('Payment route integration', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('POST /api/payment/create-url without token returns 403', async () => {
    const response = await request(app)
      .post('/api/payment/create-url')
      .send({ purchaseId: new mongoose.Types.ObjectId().toString() });

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/Thiếu token/);
  });

  test('POST /api/payment/create-url with invalid purchase returns 404', async () => {
    const { user, password } = await createUser();
    const token = await loginWithUser(user.email, password);

    const response = await request(app)
      .post('/api/payment/create-url')
      .set('Authorization', `Bearer ${token}`)
      .send({ purchaseId: new mongoose.Types.ObjectId().toString() });

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/Đơn hàng không tồn tại/);
  });

  test('POST /api/payment/payos-webhook updates pending purchase to paid', async () => {
    const { user } = await createUser({ email: 'payment-user@example.com' });
    const purchase = await Purchase.create({
      user: user._id,
      event: new mongoose.Types.ObjectId(),
      ticketClass: new mongoose.Types.ObjectId(),
      quantity: 1,
      totalAmount: 100,
      originalPrice: 100,
      paymentMethod: 'PayOS',
      paymentStatus: 'pending',
      orderCode: 987654
    });

    const response = await request(app)
      .post('/api/payment/payos-webhook')
      .send({ code: '00', data: { orderCode: 987654 } });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/Webhook processed successfully/);

    const updatedPurchase = await Purchase.findById(purchase._id);
    expect(updatedPurchase.paymentStatus).toBe('paid');
  });
});