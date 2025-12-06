//File này kết nối với MoMo.
import axios from 'axios';
import crypto from 'crypto';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js'; // Import User để cập nhật totalSpent
import dotenv from 'dotenv';

dotenv.config();

const config = {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    endpoint: process.env.MOMO_ENDPOINT,
    redirectUrl: process.env.MOMO_REDIRECT_URL,
    ipnUrl: process.env.MOMO_IPN_URL
};

// Tạo URL thanh toán
// API: Tạo giao dịch thanh toán MoMo
export const createPaymentUrl = async (req, res) => {
    try {
        const { purchaseId, paymentMethodType = 'Napas' } = req.body; // Bổ sung paymentMethodType
        
        const purchase = await Purchase.findById(purchaseId);
        if (!purchase) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }
        
        // --- Cập nhật Request Type ---
        // Sử dụng 'payWithMethod' cho thanh toán ATM/Credit Card
        const requestType = "payWithMethod"; 
        // ------------------------------

        const orderInfo = `Thanh toan don hang ${purchase._id}`;
        const amount = purchase.totalAmount.toString();
        const orderId = purchase._id.toString() + "_" + new Date().getTime(); 
        const requestId = orderId;
        const extraData = "";
        
        // Tạo Raw Signature (Format này không thay đổi cho 'payWithMethod')
        // accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
        const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${config.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${config.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        // Ký tên (HMAC SHA256)
        const signature = crypto.createHmac('sha256', config.secretKey)
            .update(rawSignature)
            .digest('hex');

        // Tạo Request Body
        const requestBody = {
            partnerCode: config.partnerCode,
            accessKey: config.accessKey, // Cần accessKey cho requestType này
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: config.redirectUrl,
            ipnUrl: config.ipnUrl,
            extraData: extraData,
            requestType: requestType,
            signature: signature,
            lang: 'vi',
            // --- THAM SỐ BỔ SUNG CHO PAYWITHMETHOD ---
            payMethod: paymentMethodType, // Ví dụ: 'Napas' hoặc 'CreditCard'
            // ------------------------------------------
        };

        // Gửi request sang MoMo
        const response = await axios.post(config.endpoint, requestBody, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("MoMo Response:", response.data);

        if (response.data.resultCode === 0) {
            // Trả về payUrl để frontend/user redirect
            return res.status(200).json({ payUrl: response.data.payUrl });
        } else {
            return res.status(400).json({ message: 'Lỗi tạo giao dịch MoMo', details: response.data });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Xử lý IPN (MoMo gọi vào đây khi thanh toán xong)
export const handleMomoIPN = async (req, res) => {
    try {
        const { orderId, resultCode, signature, amount, extraData, message, orderInfo, orderType, partnerCode, payType, requestId, responseTime, transId } = req.body;

        // Verify Signature
        const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
        
        const generatedSignature = crypto.createHmac('sha256', config.secretKey)
            .update(rawSignature)
            .digest('hex');

        if (signature !== generatedSignature) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        // Nếu thanh toán thành công (resultCode = 0)
        if (resultCode == 0) {
            const realPurchaseId = orderId.split('_')[0]; // Lấy lại ID gốc
            const purchase = await Purchase.findById(realPurchaseId);

            if (purchase && purchase.paymentStatus === 'pending') {
                purchase.paymentStatus = 'paid';
                await purchase.save();

                // Cập nhật thống kê chi tiêu User
                await User.findByIdAndUpdate(purchase.user, {
                    $inc: { totalSpent: purchase.totalAmount, totalTicketsPurchase: purchase.quantity },
                    accumulateFlag: true // Trigger middleware tính avg
                });
                
                console.log(`[IPN] Đơn hàng ${realPurchaseId} thanh toán thành công.`);
            }
        }

        return res.status(204).send(); // MoMo yêu cầu response 204

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Xử lý Return URL (Người dùng quay lại từ MoMo)
export const handleReturn = (req, res) => {
    const { resultCode, orderId } = req.query;
    
    // URL Frontend (giả sử chạy port  3000
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

    // Chuyển hướng về trang kết quả của Frontend kèm tham số
    res.redirect(`${FRONTEND_URL}/payment-result?resultCode=${resultCode}&orderId=${orderId}`);
};