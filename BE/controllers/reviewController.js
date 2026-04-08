import Review from '../models/Review.js';
import Event from '../models/Event.js';
import Purchase from '../models/Purchase.js';
import Organizer from '../models/Organizer.js';

export const createReview = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id; // Lấy từ middleware verifyToken

        // 1. Kiểm tra sự kiện có tồn tại không
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Không tìm thấy sự kiện.' });
        }

        // 2. Kiểm tra sự kiện đã kết thúc chưa
        const currentDate = new Date();
        if (currentDate <= event.endDateTime) {
            return res.status(400).json({ message: 'Chỉ có thể đánh giá sau khi sự kiện đã kết thúc.' });
        }

        // 3. Kiểm tra người dùng đã mua vé sự kiện này chưa (Dựa vào model Purchase của bạn)
        const hasPurchased = await Purchase.findOne({
            user: userId,
            event: eventId,
            paymentStatus: 'paid' // Đồng bộ với enum ['pending', 'paid', 'failed', 'refunded']
        });

        if (!hasPurchased) {
            return res.status(403).json({ message: 'Bạn phải mua vé và thanh toán thành công mới có quyền đánh giá.' });
        }

        // 4. Kiểm tra người dùng đã đánh giá sự kiện này chưa
        const existingReview = await Review.findOne({ user: userId, event: eventId });
        if (existingReview) {
            return res.status(400).json({ message: 'Bạn đã đánh giá sự kiện này rồi.' });
        }

        // 5. Tạo đánh giá mới
        const newReview = new Review({
            user: userId,
            event: eventId,
            organizer: event.organizer,
            rating,
            comment
        });

        await newReview.save();

        // 6. Cập nhật rating trung bình cho Organizer
        await updateOrganizerAverageRating(event.organizer);

        res.status(201).json({ message: 'Đánh giá thành công!', review: newReview });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Hàm hỗ trợ tính toán lại rating trung bình cho Organizer
const updateOrganizerAverageRating = async (organizerId) => {
    const stats = await Review.aggregate([
        { $match: { organizer: organizerId } },
        { 
            $group: { 
                _id: '$organizer', 
                avgRating: { $avg: '$rating' } 
            } 
        }
    ]);

    if (stats.length > 0) {
        await Organizer.findByIdAndUpdate(organizerId, { 
            rating: Math.round(stats[0].avgRating * 10) / 10 
        });
    }
};

// Lấy danh sách đánh giá của 1 sự kiện
export const getEventReviews = async (req, res) => {
    try {
        const { eventId } = req.params;
        const reviews = await Review.find({ event: eventId })
            .populate('user', 'name avatar') // Có thể tuỳ chỉnh theo model User của bạn
            .sort({ createdAt: -1 });

        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

export const getMyReviewForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;
        
        // Tìm xem người dùng này đã đánh giá sự kiện này chưa
        const review = await Review.findOne({ user: userId, event: eventId });
        
        res.status(200).json(review); // Nếu chưa có sẽ trả về null
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};