import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';

export const defaultLocation = {
  type: 'Point',
  coordinates: [106.7, 10.8]
};

export const createUser = async (override = {}) => {
  const password = override.password || 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName: override.firstName || 'Test',
    lastName: override.lastName || 'User',
    gender: override.gender || 'male',
    email: override.email || `user-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`,
    phoneNumber: override.phoneNumber || '0123456789',
    password: hashedPassword,
    role: override.role || 'user',
    location: override.location || defaultLocation,
    ...override
  });

  return { user, password };
};

export const loginWithUser = async (email, password) => {
  const response = await request(app)
    .post('/api/user/login')
    .send({ email, password });

  return response.body.token;
};

export const createAdminUser = async (override = {}) => createUser({ role: 'admin', ...override });

export const createTokenForUser = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.SECRET_KEY,
    { expiresIn: '1h' }
  );
};