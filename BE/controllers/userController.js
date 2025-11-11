import User from '../models/User.js';
// import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import dotenv from 'dotenv';
dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

// Lấy tất cả user
export const getAllUsers = async (req, res) => {
  try {
    // console.log(req.user.id);
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo user mới
export const createUser = async (req, res) => {
  try {
    // Hash password trước khi lưu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    // Tạo user mới với password đã mã hóa
    const newUser = new User({
      ...req.body,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật user
export const updateUser = async (req, res) => {
  try {
    let userId = req.params.id;

    // Nếu là route /profile thì dùng id của user trong token
    if (!userId || req.path === '/profile') {
      userId = req.user.id;
    }

    // Nếu không phải admin thì không cho chỉnh role
    if (req.user.role !== 'admin' && 'role' in req.body) {
      delete req.body.role;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa user
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Lấy user theo ID
export const getUser = async (req, res) => {
  try {
    // Nếu route là /profile thì không có req.params.id → dùng id trong token
    const userId = req.params.id || req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email không tồn tại' });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Sai mật khẩu' });
    }

    // ✅ Cập nhật isActive thành true
    user.isActive = true;
    await user.save();

    // Tạo JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Trả về token
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(403).json({ error: 'Thiếu token' });

    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    user.isActive = false;
    await user.save();

    res.json({ message: 'Đã đăng xuất thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi đăng xuất' });
  }
};
