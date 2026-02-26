import express from 'express';
import {
	createPurchase,
	getMyPurchases,
	downloadTicketQrImage,
	getPaidTicketPublicInfo,
	getPaidTicketPublicImage
} from '../controllers/purchaseController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Tạo đơn hàng (yêu cầu đăng nhập)
router.post('/', verifyToken, createPurchase);

//  Route Lấy vé của tôi
router.get('/my-tickets', verifyToken, getMyPurchases);

// Tải ảnh QR của vé (chủ vé/admin)
router.get('/tickets/:ticketId/qr-image', verifyToken, downloadTicketQrImage);

// Public API cho trang quét QR tra cứu thông tin vé đã thanh toán
router.get('/tickets/:ticketId/public', getPaidTicketPublicInfo);
router.get('/tickets/:ticketId/public-image', getPaidTicketPublicImage);

export default router;