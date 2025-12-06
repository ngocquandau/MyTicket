import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  discountAmount: {
    type: Number,
    required: true,
    min: [1, 'Discount amount must be greater than 0']
  },
  maxAmount: {
    type: Number
  },
  minSpend: {
    type: Number,
    default: 0,
    min: [0, 'minSpend must be >= 0']
  },
  validUntil: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Voucher validUntil must be a future date'
    }
  }, 
  
  /*
  // Nếu có mối quan hệ 1:N với một entity khác (ví dụ: User hoặc Order)
  relatedEntity: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  }]*/
});

// Trigger check logic trước khi save
voucherSchema.pre('save', function(next) {
  // Nếu có maxAmount thì discountAmount <= maxAmount
  if (this.maxAmount !== undefined && this.discountAmount > this.maxAmount) {
    return next(new Error('Discount amount cannot exceed maxAmount'));
  }
  next();
});

// Trigger check logic trước khi update
voucherSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();

  // Ép kiểu validUntil về Date để so sánh chính xác
  if (update.validUntil !== undefined) {
    const validDate = new Date(update.validUntil);
    if (validDate <= new Date()) {
      return next(new Error('Voucher validUntil must be a future date'));
    }
  }

  if (update.discountAmount !== undefined && update.maxAmount !== undefined && update.discountAmount > update.maxAmount) {
    return next(new Error('Discount amount cannot exceed maxAmount'));
  }

  next();
});

const Voucher = mongoose.model('Voucher', voucherSchema, 'vouchers');
export default Voucher;
