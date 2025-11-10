import mongoose from 'mongoose';
import Event from './Event.js';

const ticketClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  totalQuantity: { type: Number, required: true, min: 0 },
  soldQuantity: { type: Number, default: 0 },
  availableFrom: { type: Date, required: true },
  availableUntil: { type: Date, required: true },
  status: {
    type: String,
    enum: ['available', 'sold_out', 'unavailable'],
    default: 'available'
  },
  seatType: { 
    type: String,
    enum: ['general', 'reserved'], // 'general' = không chỗ ngồi, 'reserved' = có ghế
    default: 'general'
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  }
});

const TicketClass = mongoose.model('TicketClass', ticketClassSchema, 'ticketClasses');
export default TicketClass;