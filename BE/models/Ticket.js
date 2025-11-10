import mongoose from 'mongoose';
import TicketClass from './TicketClass.js';

const ticketSchema = new mongoose.Schema({
    ticketClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TicketClass',
        required: true
    },
    seat: { 
        type: String, 
        required: true }, // VD: A12
    isSold: { 
        type: Boolean, 
        default: false },
    qrCode: { type: String },
    ticketId: { 
        type: String, 
        required: true } // Mã vé do ban tổ chức cấp
});

const Ticket = mongoose.model('Ticket', ticketSchema, 'tickets');
export default Ticket;