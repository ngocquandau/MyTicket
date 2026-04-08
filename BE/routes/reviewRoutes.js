import express from 'express';
import { createReview, getEventReviews, getMyReviewForEvent } from '../controllers/reviewController.js';import { verifyToken } from '../middleware/auth.js'; 

const router = express.Router();

// Tạo đánh giá cho sự kiện (POST /api/review/:eventId)
router.post('/:eventId', verifyToken, createReview);

// Lấy danh sách đánh giá của sự kiện (GET /api/review/:eventId)
router.get('/:eventId', getEventReviews);

// LẤY ĐÁNH GIÁ CỦA CÁ NHÂN:
router.get('/:eventId/me', verifyToken, getMyReviewForEvent);

export default router;