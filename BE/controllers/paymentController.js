import PayOSModule from '@payos/node';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Tự động dò tìm constructor chuẩn của PayOS để chống crash trên Node 22
let PayOS;
if (typeof PayOSModule === 'function') {
    PayOS = PayOSModule;
} else if (PayOSModule && typeof PayOSModule.default === 'function') {
    PayOS = PayOSModule.default;
} else if (PayOSModule && typeof PayOSModule.PayOS === 'function') {
    PayOS = PayOSModule.PayOS;
} else {
    // Đề phòng trường hợp thư viện lỗi hoặc chưa cài đặt đúng
    console.error("PayOS Module exported as:", PayOSModule);
    throw new Error("Không thể tìm thấy class PayOS. Hãy chạy lệnh: npm install @payos/node");
}

// Khởi tạo đối tượng PayOS an toàn
const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

// Tạo URL thanh toán PayOS
export const createPaymentUrl = async (req, res) => {
    try {
        const { purchaseId } = req.body;
        
        // Tìm đơn hàng trong DB
        const purchase = await Purchase.findById(purchaseId);
        if (!purchase) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }
        
        // Tạo orderCode duy nhất (Kiểu Number, lấy 10 số cuối của timestamp)
        const orderCode = Number(String(Date.now()).slice(-10));
        
        // Cập nhật thông tin vào Purchase record trước khi tạo link
        purchase.orderCode = orderCode;
        purchase.paymentMethod = 'PayOS'; 
        await purchase.save();

        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

        // Tạo cấu hình body để gửi lên PayOS
        const orderBody = {
            orderCode: orderCode,
            amount: purchase.totalAmount,
            description: `Thanh toan ve MyTicket`, 
            cancelUrl: `${FRONTEND_URL}/payment-result?resultCode=cancel&orderId=${purchase._id}`,
            returnUrl: `${FRONTEND_URL}/payment-result?resultCode=0&orderId=${purchase._id}`,
        };

        // Gọi API tạo link thanh toán
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