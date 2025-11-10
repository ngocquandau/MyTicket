import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

import User from '../models/User.js';

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ error: 'Thiếu token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // Truy vấn user từ DB để kiểm tra isActive
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'Tài khoản chưa hoạt động hoặc đã đăng xuất' });
    }
    req.user = decoded;
    next();
  } catch (err) {
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