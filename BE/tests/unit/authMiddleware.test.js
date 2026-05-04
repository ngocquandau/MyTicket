import { jest } from '@jest/globals';

process.env.SECRET_KEY = process.env.SECRET_KEY || 'test_secret_key';

const mockFindById = jest.fn();
const mockVerify = jest.fn();

jest.unstable_mockModule('../../models/User.js', () => ({
  default: {
    findById: mockFindById
  }
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockVerify
  }
}));

const { verifyToken, verifyAdmin } = await import('../../middleware/auth.js');

describe('Auth middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    mockFindById.mockReset();
    mockVerify.mockReset();
  });

  test('verifyToken returns 403 if authorization header is missing', async () => {
    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Thiếu token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('verifyToken returns 401 if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalidtoken';
    mockVerify.mockImplementation(() => { throw new Error('invalid token'); });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    expect(next).not.toHaveBeenCalled();
  });

  test('verifyToken returns 403 for inactive user', async () => {
    req.headers.authorization = 'Bearer validtoken';
    mockVerify.mockReturnValue({ id: 'user-id' });
    mockFindById.mockResolvedValue({ isActive: false });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Tài khoản chưa hoạt động hoặc đã đăng xuất' });
    expect(next).not.toHaveBeenCalled();
  });

  test('verifyToken calls next when token and user are valid', async () => {
    req.headers.authorization = 'Bearer validtoken';
    mockVerify.mockReturnValue({ id: 'user-id', email: 'test@example.com', role: 'user' });
    mockFindById.mockResolvedValue({ isActive: true });

    await verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'user-id', email: 'test@example.com', role: 'user' });
  });

  test('verifyAdmin returns 401 if req.user is missing', () => {
    verifyAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Chưa xác thực người dùng' });
    expect(next).not.toHaveBeenCalled();
  });

  test('verifyAdmin returns 403 if user is not admin', () => {
    req.user = { role: 'user' };
    verifyAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bạn không có quyền truy cập (chỉ admin mới được phép)' });
    expect(next).not.toHaveBeenCalled();
  });

  test('verifyAdmin calls next for admin user', () => {
    req.user = { role: 'admin' };
    verifyAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});