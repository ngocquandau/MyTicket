import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendNewPassword } from '../services/emailService.js';

const getSecretKey = () => {
  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    throw new Error('SECRET_KEY is missing in environment variables');
  }
  return secretKey;
};

// Lấy tất cả user
export const getAllUsers = async (req, res) => {
  try {
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
      password: hashedPassword,
      role: 'user', // luôn là 'user' mặc định
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

    // QUAN TRỌNG: Nếu cập nhật password, cần phải hash lại
    if (req.body.password) {
      const saltRounds = 10;
      req.body.password = await bcrypt.hash(req.body.password, saltRounds);
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

// Đăng nhập user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ SỬA LỖI: Thêm .select('+password') để lấy trường password ẩn
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ error: 'Email không tồn tại' });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Sai mật khẩu' });
    }

    // Cập nhật isActive thành true
    user.isActive = true;
    await user.save();

    // Tạo JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      getSecretKey(),
      { expiresIn: '1h' }
    );

    // Trả về token
    res.json({ token });
  } catch (err) {
    console.error(err);
    if (err.message?.includes('SECRET_KEY is missing')) {
      return res.status(500).json({ error: 'Thiếu cấu hình SECRET_KEY trên server' });
    }
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Đăng xuất user
export const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(403).json({ error: 'Thiếu token' });

    const decoded = jwt.verify(token, getSecretKey());
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    user.isActive = false;
    await user.save();

    res.json({ message: 'Đã đăng xuất thành công' });
  } catch (err) {
    console.error(err);
    if (err.message?.includes('SECRET_KEY is missing')) {
      return res.status(500).json({ error: 'Thiếu cấu hình SECRET_KEY trên server' });
    }
    res.status(500).json({ error: 'Lỗi server khi đăng xuất' });
  }
};


export const getMyOrganizations = async (req, res) => {
  try {
    const userId = req.user.id;

    const organizations = await Organizer.find({ user: userId })
      // .populate('user', 'email role'); // optional

    res.status(200).json(organizations);

  } catch (err) {
    console.error('Error in getMyOrganizations:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getNewPassword = async (req, res) => {
  try {
    const { email } = req.body; 
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }
    // Tạo mật khẩu mới ngẫu nhiên
    const newPassword = Math.random().toString(36).slice(-8); // 8 ký tự ngẫu nhiên

    // Hash mật khẩu mới trước khi lưu
    const saltRounds = 10;
    user.password = await bcrypt.hash(newPassword, saltRounds);
    await user.save();
    
    // Gửi email mật khẩu mới
    const { success } = await sendNewPassword({ 
      cusEmail: user.email, 
      cusName: user.name, 
      password: newPassword 
    });

    if (!success) {
      return res.status(500).json({ message: 'Lỗi khi gửi email mật khẩu mới' });
    }

    res.status(200).json({ message: 'Mật khẩu mới đã được gửi đến email của bạn' });
  } catch (err) {
    console.error('Error in getNewPassword:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};