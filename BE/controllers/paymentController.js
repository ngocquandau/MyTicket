import payosPkg from '@payos/node';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Biến lưu trữ đối tượng PayOS sau khi khởi tạo
let payOSInstance = null;

// Hàm khởi tạo PayOS an toàn (Chỉ chạy khi có người click Thanh toán)
const getPayOS = () => {
    if (payOSInstance) return payOSInstance; // Nếu có rồi thì dùng lại

    // Tự động dò tìm Class khởi tạo
    let PayOSClass = payosPkg;
    if (typeof payosPkg !== 'function') {
        PayOSClass = payosPkg.default || payosPkg.PayOS;
    }

    // Nếu vẫn không tìm thấy class hợp lệ, ném lỗi ra API thay vì làm sập server
    if (typeof PayOSClass !== 'function') {
        console.error("=== GỠ LỖI THƯ VIỆN PAYOS ===", payosPkg);
        throw new Error("Thư viện @payos/node bị lỗi cấu trúc. Hãy chạy lệnh: npm uninstall @payos/node && npm install @payos/node");
    }

    // Khởi tạo và lưu lại
    payOSInstance = new PayOSClass(
        process.env.PAYOS_CLIENT_ID,
        process.env.PAYOS_API_KEY,
        process.env.PAYOS_CHECKSUM_KEY
    );
    
    return payOSInstance;
};

// Tạo URL thanh toán PayOS
export const createPaymentUrl = async (req, res) => {
    try {
        // Gọi hàm khởi tạo ở đây -> An toàn tuyệt đối cho Server
        const payOS = getPayOS();
        
        const { purchaseId } = req.body;
        
        const purchase = await Purchase.findById(purchaseId);
        if (!purchase) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }
        
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