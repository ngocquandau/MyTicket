import { PayOS } from '@payos/node'; // Cú pháp import CỰC KỲ QUAN TRỌNG cho bản mới
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo đối tượng PayOS (Bắt buộc dùng destructuring import như trên)
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
        
        // Tạo orderCode duy nhất (Kiểu Number, PayOS yêu cầu tối đa 50 ký tự, nhưng khuyến cáo dùng số)
        const orderCode = Number(String(Date.now()).slice(-9)); // Lấy 9 số cuối cho an toàn
        
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

        console.log("==> Dữ liệu gửi lên PayOS:", orderBody); // LOG 1: Xem body có đúng không

        // Lúc này hàm createPaymentLink CHẮC CHẮN SẼ HOẠT ĐỘNG
        const paymentLinkRes = await payOS.createPaymentLink(orderBody);

        console.log("==> PayOS trả về:", paymentLinkRes); // LOG 2: Xem PayOS trả về gì

        if (paymentLinkRes && paymentLinkRes.checkoutUrl) {
            return res.status(200).json({ payUrl: paymentLinkRes.checkoutUrl });
        } else {
            return res.status(400).json({ message: 'Lỗi tạo giao dịch PayOS (Không có checkoutUrl)' });
        }

    } catch (err) {
        console.error("==> LỖI CỤ THỂ KHI GỌI PAYOS:", err);
        // Trả về lỗi chi tiết để FE hiển thị, thay vì chỉ báo 500 chung chung
        res.status(500).json({ error: err.message, stack: err.stack });
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