import express from 'express';
import { createPaymentUrl, handleMomoIPN, handleReturn } from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Lấy link thanh toán (yêu cầu đăng nhập)
router.post('/create-url', verifyToken, createPaymentUrl);

// Webhook IPN (Public - MoMo gọi vào)
router.post('/ipn', handleMomoIPN);

// Return URL (Trình duyệt gọi vào)
router.get('/return', handleReturn);

export default router;