import { createRequire } from 'module';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// 1. Dùng require chuẩn của Node.js để nạp thư viện CommonJS
const require = createRequire(import.meta.url);
const payosModule = require('@payos/node');

// 2. Ép lấy đúng Class PayOS (Hỗ trợ mọi cấu trúc export của thư viện)
const PayOS = payosModule.PayOS || payosModule.default || payosModule;

// 3. Khởi tạo đối tượng
const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

// Tạo URL thanh toán PayOS
export const createPaymentUrl = async (req, res) => {
    try {
        const { purchaseId } = req.body;
        
        const purchase = await Purchase.findById(purchaseId);
        if (!purchase) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }
        
        // Tạo orderCode duy nhất (Kiểu Number, 10 số cuối timestamp)
        const orderCode = Number(String(Date.now()).slice(-10));
        
        purchase.orderCode = orderCode;
        purchase.paymentMethod = 'PayOS'; 
        await purchase.save();

        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

        const orderBody = {
            orderCode: orderCode,
            amount: purchase.totalAmount, 
            description: `Thanh toan ve MyTicket`, 
            cancelUrl: `${FRONTEND_URL}/payment-result?resultCode=cancel&orderId=${purchase._id}`,
            returnUrl: `${FRONTEND_URL}/payment-result?resultCode=0&orderId=${purchase._id}`,
        };

        // Lúc này hàm createPaymentLink CHẮC CHẮN SẼ HOẠT ĐỘNG
        const paymentLinkRes = await payOS.createPaymentLink(orderBody);

        if (paymentLinkRes && paymentLinkRes.checkoutUrl) {
            return res.status(200).json({ payUrl: paymentLinkRes.checkoutUrl });
        } else {
            return res.status(400).json({ message: 'Lỗi tạo giao dịch PayOS' });
        }

    } catch (err) {
        console.error("Lỗi khi tạo payment link:", err);
        res.status(500).json({ error: err.message });
    }
};

// Xử lý Webhook 
export const handlePayOSWebhook = async (req, res) => {
    try {
        const webhookData = req.body;
        console.log("PayOS Webhook Data received:", webhookData);

        if (webhookData.code === "00" && webhookData.data) {
            const { orderCode } = webhookData.data;

            const purchase = await Purchase.findOne({ orderCode: orderCode });

            if (purchase && purchase.paymentStatus === 'pending') {
                purchase.paymentStatus = 'paid';
                purchase.purchaseDate = new Date();
                await purchase.save();

                await User.findByIdAndUpdate(purchase.user, {
                    $inc: { 
                        totalSpent: purchase.totalAmount, 
                        totalTicketsPurchase: purchase.quantity 
                    },
                    $set: { accumulateFlag: true } 
                }, { new: true });
                
                console.log(`[PayOS Webhook] Cập nhật thành công đơn hàng: ${purchase._id}`);
            }
        }

        return res.status(200).json({ message: "Webhook processed successfully" });

    } catch (err) {
        console.error("Lỗi xử lý webhook:", err);
        res.status(500).json({ error: err.message });
    }
};