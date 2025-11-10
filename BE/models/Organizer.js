import mongoose from 'mongoose';

const organizerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^[0-9]{9,15}$/  // chỉ cho phép số từ 9–15 chữ số
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/  // validate email cơ bản
  },
  taxCode: {
    type: String,
    unique: true,
    sparse: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  // Liên kết với User đại diện
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Organizer = mongoose.model('Organizer', organizerSchema, 'organizers');
export default Organizer;
