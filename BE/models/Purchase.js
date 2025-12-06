import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: { // Lưu event để dễ truy vấn
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    ticketClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TicketClass',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    totalAmount: { // Số tiền thực tế phải trả
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: { // Giá gốc
        type: Number,
        required: true,
        min: 0
    },
    voucher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voucher',
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ['Momo', 'BankTransfer', 'CreditCard'], // Hiện tại ta dùng 'Momo'
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Purchase = mongoose.model('Purchase', purchaseSchema, 'purchases');
export default Purchase;