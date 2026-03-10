import express from 'express';
import { createPaymentUrl, handlePayOSWebhook } from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Lấy link thanh toán (yêu cầu người dùng đã đăng nhập)
router.post('/create-url', verifyToken, createPaymentUrl);

// Webhook từ cổng thanh toán PayOS (Public API - Không cần token bảo mật)
// URL đầy đủ sẽ là: https://your-backend-url.onrender.com/api/payment/payos-webhook
router.post('/payos-webhook', handlePayOSWebhook);

export default router;