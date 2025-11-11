import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName:   { type: String, required: true },
  lastName:    { type: String, required: true },
  gender:      { type: String, enum: ['male', 'female'], required: true },
  birthday:    { type: Date },
  email:       { type: String, unique: true, required: true },
  phoneNumber: { type: String },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['user', 'admin'], default: 'user' },
  profileImage:{ type: String },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },

  isActive:    { type: Boolean, default: true }
}, {
  timestamps: true
});

userSchema.index({ location: '2dsphere' }); // Tạo index để hỗ trợ truy vấn không gian

const User = mongoose.model('User', userSchema, 'users');
export default User;