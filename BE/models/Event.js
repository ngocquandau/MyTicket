import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    genre: {
        type: String,
        required: true
    },
    description: {
        type: String,
        maxlength: 2000
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
        required: true
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
        address: {
            type: String
        }
    }
}, {
  timestamps: true
});

eventSchema.index({ location: '2dsphere' }); // hỗ trợ tìm kiếm sự kiện gần vị trí

const Event = mongoose.model('Event', eventSchema, 'events');
export default Event;
