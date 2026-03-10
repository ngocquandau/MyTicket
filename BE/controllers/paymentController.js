import PayOS from '@payos/node';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo đối tượng PayOS với cấu hình từ file .env
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
        purchase.paymentMethod = 'PayOS'; // Đánh dấu đây là giao dịch PayOS
        await purchase.save();

        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

        // Tạo cấu hình body để gửi lên PayOS
        const orderBody = {
            orderCode: orderCode,
            amount: purchase.totalAmount, // Số tiền
            description: `Thanh toan ve MyTicket`, // Mô tả ngắn gọn (Không có dấu)
            cancelUrl: `${FRONTEND_URL}/payment-result?resultCode=cancel&orderId=${purchase._id}`,
            returnUrl: `${FRONTEND_URL}/payment-result?resultCode=0&orderId=${purchase._id}`,
        };

        // Gọi API tạo link thanh toán
        const paymentLinkRes = await payOS.createPaymentLink(orderBody);

        // Trả về checkoutUrl cho trình duyệt tự chuyển hướng
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

// Xử lý Webhook (PayOS tự động gọi vào đây khi khách thanh toán thành công)
export const handlePayOSWebhook = async (req, res) => {
    try {
        const webhookData = req.body;
        console.log("PayOS Webhook Data received:", webhookData);

        // Code '00' nghĩa là giao dịch chuyển khoản thành công
        if (webhookData.code === "00" && webhookData.data) {
            const { orderCode } = webhookData.data;

            // Tìm đơn hàng tương ứng bằng orderCode
            const purchase = await Purchase.findOne({ orderCode: orderCode });

            if (purchase && purchase.paymentStatus === 'pending') {
                // Đổi trạng thái thành paid
                purchase.paymentStatus = 'paid';
                purchase.purchaseDate = new Date();
                await purchase.save();

                // Cập nhật thống kê chi tiêu của User
                await User.findByIdAndUpdate(purchase.user, {
                    $inc: { 
                        totalSpent: purchase.totalAmount, 
                        totalTicketsPurchase: purchase.quantity 
                    },
                    $set: { accumulateFlag: true } 
                }, { new: true });
                
                console.log(`[PayOS Webhook] Cập nhật thành công đơn hàng: ${purchase._id}`);
            } else {
                console.log(`[PayOS Webhook] Không tìm thấy đơn hàng pending cho orderCode: ${orderCode}`);
            }
        }

        // Luôn phải trả về status 200 để báo cho PayOS biết hệ thống đã nhận được dữ liệu
        return res.status(200).json({ message: "Webhook processed successfully" });

    } catch (err) {
        console.error("Lỗi xử lý webhook:", err);
        res.status(500).json({ error: err.message });
    }
};
