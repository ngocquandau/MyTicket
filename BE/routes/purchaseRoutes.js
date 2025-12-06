import express from 'express';
import { createPurchase, getMyPurchases } from '../controllers/purchaseController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Tạo đơn hàng (yêu cầu đăng nhập)
router.post('/', verifyToken, createPurchase);

//  Route Lấy vé của tôi
router.get('/my-tickets', verifyToken, getMyPurchases);

export default router;