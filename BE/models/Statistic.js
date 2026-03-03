import mongoose from 'mongoose';

const statisticSchema = new mongoose.Schema(
{
    totalEvents: { 
        type: Number, 
        required: true 
    },
    totalUsers: { 
        type: Number, 
        required: true 
    },
    totalOrganizers: { 
        type: Number, 
        required: true 
    },
    newEventsthisMonth: { 
        type: Number, 
        required: true 
    },
    newUsersThisMonth: { 
        type: Number, 
        required: true 
    },
    activeOrganizersThisMonth: { 
        type: Number, 
        required: true 
    },
},
{
    timestamps: true
});

// Index đúng
statisticSchema.index({ createdAt: -1 });

const Statistic = mongoose.model('Statistic', statisticSchema, 'statistics');
export default Statistic;