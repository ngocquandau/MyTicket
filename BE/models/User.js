import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName:    { type: String, required: true },
    lastName:     { type: String, required: true },
    gender:       { type: String, enum: ['male', 'female', 'other'], required: true }, // Bổ sung 'other'
    birthday:     { type: Date },
    email:        { type: String, unique: true, required: true, lowercase: true, trim: true },
    phoneNumber:  { type: String },
    password:     { type: String, required: true, select: false }, // Không trả về password mặc định khi query
    role:         { type: String, enum: ['user', 'organizer', 'admin'], default: 'user' }, // Bổ sung 'organizer' [cite: 163, 207]
    profileImage: { type: String },

    // Bổ sung ngày 01/12/2025 (Dành cho tính năng gợi ý/cá nhân hóa)
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

    isActive:     { type: Boolean, default: true }
}, {
    timestamps: true
});

userSchema.index({ location: '2dsphere' }); // Tạo index để hỗ trợ truy vấn không gian

// Middleware: Trigger khi save (create/save)
userSchema.pre('save', function(next) {
    if (this.totalTicketsPurchase > 0 && this.totalSpent >= 0) {
        this.avgPurchasePrice = this.totalSpent / this.totalTicketsPurchase;
    } else if (this.totalTicketsPurchase <= 0 || this.totalSpent < 0) { // Reset nếu dữ liệu không hợp lệ
        this.totalSpent = 0;
        this.totalTicketsPurchase = 0;
        this.avgPurchasePrice = 0;
    }
    next();
});

// Middleware: Trigger khi update (findOneAndUpdate)
userSchema.pre('findOneAndUpdate', async function(next) {
    let update = this.getUpdate();

    // Không cho phép update trực tiếp avgPurchasePrice
    if (update.avgPurchasePrice !== undefined) {
        delete update.avgPurchasePrice;
    }

    // Lấy document hiện tại để xử lý cộng dồn
    const docToUpdate = await this.model.findOne(this.getQuery());

    // Nếu có cờ accumulateFlag, thực hiện cộng dồn
    if (update.accumulateFlag) {
        // Lấy giá trị hiện tại của totalSpent và totalTicketsPurchase
        const currentTotalSpent = docToUpdate.totalSpent;
        const currentTotalTicketsPurchase = docToUpdate.totalTicketsPurchase;

        // Cộng dồn với giá trị update nếu có
        const newTotalSpent = currentTotalSpent + (update.totalSpent ?? 0);
        const newTotalTicketsPurchase = currentTotalTicketsPurchase + (update.totalTicketsPurchase ?? 0);

        update.totalSpent = newTotalSpent;
        update.totalTicketsPurchase = newTotalTicketsPurchase;

        // Tính trung bình mới
        if (newTotalTicketsPurchase > 0) {
            update.avgPurchasePrice = newTotalSpent / newTotalTicketsPurchase;
        } else {
            update.avgPurchasePrice = 0;
        }

        // Sau khi cộng dồn, xóa cờ accumulateFlag để lần sau không cộng dồn nữa
        delete update.accumulateFlag;

    } else {
        // Xử lý khi update không dùng cờ cộng dồn (update giá trị tuyệt đối)
        let totalSpent = update.totalSpent ?? docToUpdate.totalSpent;
        let totalTicketsPurchase = update.totalTicketsPurchase ?? docToUpdate.totalTicketsPurchase;

        if (totalTicketsPurchase > 0) {
            update.avgPurchasePrice = totalSpent / totalTicketsPurchase;
        } else {
            update.avgPurchasePrice = 0;
        }
    }
    
    // Đảm bảo không có giá trị âm
    if (update.totalTicketsPurchase < 0 || update.totalSpent < 0) {
        update.totalSpent = 0;
        update.totalTicketsPurchase = 0;
        update.avgPurchasePrice = 0;
    }

    this.setUpdate(update);
    next();
});

const User = mongoose.model('User', userSchema, 'users');
export default User;