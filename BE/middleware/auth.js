import jwt from 'jsonwebtoken';

import User from '../models/User.js';

const getSecretKey = () => {
  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    throw new Error('SECRET_KEY is missing in environment variables');
  }
  return secretKey;
};

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ error: 'Thiếu token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getSecretKey());

    // Truy vấn user từ DB để kiểm tra isActive
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'Tài khoản chưa hoạt động hoặc đã đăng xuất' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    if (err.message?.includes('SECRET_KEY is missing')) {
      return res.status(500).json({ error: 'Thiếu cấu hình SECRET_KEY trên server' });
    }
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

export const verifyAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Chưa xác thực người dùng' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập (chỉ admin mới được phép)' });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xác thực quyền admin' });
  }
};

// Middleware cho phép pass qua 
// nếu token hợp lệ thì add vào interaction, 
// nếu không có token hoặc token không hợp lệ thì vẫn pass qua nhưng không add interaction (user ẩn danh)
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getSecretKey());

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      req.user = null;
    } else {
      req.user = decoded;
    }
  } catch (err) {
    req.user = null;
  }

  next();
};