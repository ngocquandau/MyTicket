// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  gender:    { type: String, enum: ['male', 'female'], required: true },
  birthday:  { type: Date },
  identifier:{ type: String, unique: true },
  email:     { type: String, unique: true, required: true },
  phoneNumber:{ type: String },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  profileImage: { type: String },

  location: {
    type: mongoose.Schema.Types.Mixed // hoặc bạn có thể định nghĩa rõ hơn nếu biết cấu trúc
  },

  isActive:  { type: Boolean, default: true },
}, {
  timestamps: true // Tự động tạo createdAt và updatedAt
});

const User = mongoose.model('User', userSchema, 'users');
export default User;
