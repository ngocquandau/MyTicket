import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',   // tham chiếu tới bảng users
    required: true
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',  // tham chiếu tới bảng events
    required: true
  },
  click: {
    type: Number,
    default: 0,
    min: [0, 'Click count must be >= 0']
  },
  purchase: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // tự động thêm createdAt, updatedAt
});

const Interaction = mongoose.model('Interaction', interactionSchema, 'interactions');
export default Interaction;
