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

  // Bổ sung ngày 01/12/2025
  avgPurchasePrice: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  totalSpent: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  totalTicketsPurchase: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  accumulateFlag: { // update cộng dồn nếu true, nếu false thì update bình thường
    type: Boolean, 
    default: false 
  },
  //

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

// Trigger khi save
userSchema.pre('save', function(next) {
  if (this.totalTicketsPurchase > 0 && this.totalSpent >= 0) {
    this.avgPurchasePrice = this.totalSpent / this.totalTicketsPurchase;
  } else if (this.totalTicketsPurchase < 0 && this.totalSpent < 0) {
    this.totalSpent = 0;
    this.totalTicketsPurchase = 0;
    this.avgPurchasePrice = 0;
  }
  next();
});

// Trigger khi update
userSchema.pre('findOneAndUpdate', async function(next) {
  let update = this.getUpdate();

  // Không cho phép update trực tiếp avgPurchasePrice
  if (update.avgPurchasePrice !== undefined) {
    delete update.avgPurchasePrice;
  }

  // Lấy document hiện tại để cộng dồn
  const docToUpdate = await this.model.findOne(this.getQuery());

  let totalSpent = update.totalSpent ?? docToUpdate.totalSpent;
  let totalTicketsPurchase = update.totalTicketsPurchase ?? docToUpdate.totalTicketsPurchase;
  const accumulateFlag = update.accumulateFlag ?? false;

  if (totalTicketsPurchase < 0 && totalSpent < 0) {
    // reset về 0
    update.totalSpent = 0;
    update.totalTicketsPurchase = 0;
    update.avgPurchasePrice = 0;
  } else {
    if (accumulateFlag) {
      // cộng dồn
      update.totalSpent = docToUpdate.totalSpent + (update.totalSpent ?? 0);
      update.totalTicketsPurchase = docToUpdate.totalTicketsPurchase + (update.totalTicketsPurchase ?? 0);
    }
    // tính trung bình
    if (update.totalTicketsPurchase > 0) {
      update.avgPurchasePrice = update.totalSpent / update.totalTicketsPurchase;
    } else {
      update.avgPurchasePrice = 0;
    }
  }

  this.setUpdate(update);
  next();
});

const User = mongoose.model('User', userSchema, 'users');
export default User;