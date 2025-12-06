import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    genre: {
        type: String,
        required: true,
        enum: [
            'conference',   // hội nghị
            'seminar',      // hội thảo
            'concert',      // buổi hòa nhạc
            'festival',     // lễ hội
            'sports',       // thể thao
            'fundraising',  // gây quỹ
            'exhibition',   // triển lãm
            'webinar',      // hội thảo trực tuyến
            'productlaunch',// ra mắt sản phẩm
            'theater',      // nhà hát
            'other'         // khác
        ],
        set: v => v.toLowerCase() // Chuẩn hóa genre về chữ thường
    },
    description: {
        type: String
    },
    posterURL: {
        type: String
    },
    startDateTime: {
        type: Date,
        required: true
    },
    endDateTime: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                return value >= this.startDateTime;
            },
            message: 'End date must be greater than or equal to start date.'
        }
    },
    maxCapacity: {
        type: Number,
        required: true,
        min: 1
    },
    platformCommission: {
        type: Number,
        default: 0, // phần trăm hoặc số tiền
        min: 0
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'completed'],
        default: 'draft'
    },
    // Bổ sung ngày 01/12/2025
    clickCount: { // Số lượt xem cho tính năng "Phổ biến" [cite: 297]
        type: Number,
        default: 0,
        min: 0
    },
    ageLimit: { // Giới hạn độ tuổi [cite: 378]
        type: Number,
        default: 0, // không giới hạn
        min: 0
    },
    seatImgUrl: { // Sơ đồ ghế (interactive) [cite: 307]
        type: String
    },
    totalTickets:{ // Tổng số vé đã bán/có thể bán
        type: Number,
        min: 1
    },
    // Quan hệ với Organizer (tham chiếu ID)
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        required: true
    },
    // Tọa độ hoặc vị trí tổ chức (nếu có event offline)
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        },
        address: { // Địa điểm [cite: 298]
            type: String
        }
    }
}, {
    timestamps: true
});

eventSchema.index({ location: '2dsphere' }); // hỗ trợ tìm kiếm sự kiện gần vị trí

const Event = mongoose.model('Event', eventSchema, 'events');
export default Event;