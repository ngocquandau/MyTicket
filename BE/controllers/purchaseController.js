import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import TicketClass from '../models/TicketClass.js';
import Event from '../models/Event.js';
import Voucher from '../models/Voucher.js';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

// Hàm tạo vé (Helper)
const createTicketsPlaceholder = async (ticketClass, quantity, purchaseId, session) => {
    const ticketsData = Array.from({ length: quantity }).map((_, index) => {
        let seatName;
        
        if (ticketClass.seatType === 'reserved') {
            // Nếu vé có ghế (đã chọn từ trước), ta không tạo vé mới mà chỉ update vé cũ.
            // Hàm này chủ yếu dùng cho vé General.
            seatName = `RSV-${Date.now()}-${index}`; 
        } else {
            // Vé tự do -> Tạo tên theo Hạng vé
            seatName = `${ticketClass.name} - #${Math.floor(1000 + Math.random() * 9000)}`;
        }

        return {
            ticketClass: ticketClass._id,
            seat: seatName, 
            isSold: true, 
            ticketId: `GEN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            purchase: purchaseId
        };
    });
    
    return await Ticket.insertMany(ticketsData, { session });
};

export const createPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { ticketClassId, quantity, voucherCode, paymentMethod, selectedTicketIds } = req.body;
        const userId = req.user.id;

        // 1. Kiểm tra Ticket Class
        const tc = await TicketClass.findById(ticketClassId).session(session);
        if (!tc) throw new Error('Hạng vé không tồn tại');
        if (tc.status !== 'available') throw new Error('Hạng vé này hiện không khả dụng');

        // 2. Logic Xử lý Vé
        let ticketRecords = [];

        if (tc.seatType === 'reserved') {
            // --- TRƯỜNG HỢP VÉ CÓ GHẾ (RESERVED) ---
            if (!selectedTicketIds || selectedTicketIds.length !== quantity) {
                throw new Error(`Vui lòng chọn đủ ${quantity} ghế.`);
            }

            // Kiểm tra ghế còn trống không (tránh race condition)
            const ticketsToCheck = await Ticket.find({
                _id: { $in: selectedTicketIds },
                ticketClass: ticketClassId,
                isSold: false
            }).session(session);

            if (ticketsToCheck.length !== quantity) {
                throw new Error('Một số ghế bạn chọn đã bị mua bởi người khác. Vui lòng chọn lại.');
            }
            
            ticketRecords = ticketsToCheck;

        } else {
            // --- TRƯỜNG HỢP VÉ TỰ DO (GENERAL) ---
            const remaining = tc.totalQuantity - (tc.soldQuantity || 0);
            if (quantity > remaining) {
                throw new Error(`Chỉ còn lại ${remaining} vé.`);
            }

            // Tạo vé mới cho loại General
            const ticketsData = Array.from({ length: quantity }).map((_, index) => ({
                ticketClass: tc._id,
                seat: `${tc.name} - Tự do`,
                isSold: true,
                ticketId: `GEN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                // Purchase ID update sau
            }));
            
            ticketRecords = await Ticket.insertMany(ticketsData, { session });
        }

        // 3. Kiểm tra Event & User
        const event = await Event.findById(tc.event).session(session);
        if (!event) throw new Error('Sự kiện không tồn tại');
        
        const user = await User.findById(userId).session(session);
        if (event.ageLimit > 0 && user.birthday) {
            const age = new Date().getFullYear() - new Date(user.birthday).getFullYear();
            if (age < event.ageLimit) throw new Error(`Yêu cầu độ tuổi tối thiểu: ${event.ageLimit}`);
        }

        // 4. Tính tiền & Voucher
        let originalPrice = tc.price * quantity;
        let finalAmount = originalPrice;
        let voucherUsed = null;

        if (voucherCode) {
            voucherUsed = await Voucher.findOne({ code: voucherCode, validUntil: { $gt: new Date() } }).session(session);
            if (!voucherUsed) throw new Error('Mã giảm giá không hợp lệ');
            if (voucherUsed.usageLimit > 0 && voucherUsed.usedCount >= voucherUsed.usageLimit) throw new Error('Mã giảm giá hết lượt');
            if (originalPrice < voucherUsed.minSpend) throw new Error(`Chưa đạt giá trị tối thiểu ${voucherUsed.minSpend}`);

            let discount = voucherUsed.discountAmount;
            if (voucherUsed.maxAmount && discount > voucherUsed.maxAmount) {
                discount = voucherUsed.maxAmount;
            }
            finalAmount = Math.max(0, originalPrice - discount);
        }

        // 5. Tạo Purchase Record
        const newPurchase = new Purchase({
            user: userId,
            event: tc.event,
            ticketClass: ticketClassId,
            quantity,
            totalAmount: finalAmount,
            originalPrice: originalPrice,
            voucher: voucherUsed ? voucherUsed._id : null,
            paymentMethod,
            paymentStatus: 'pending'
        });
        await newPurchase.save({ session });

        // 6. Cập nhật Vé (Ticket) -> Link với Purchase & Đánh dấu đã bán
        const ticketIdsToUpdate = ticketRecords.map(t => t._id);
        
        await Ticket.updateMany(
            { _id: { $in: ticketIdsToUpdate } },
            { $set: { isSold: true, purchase: newPurchase._id } },
            { session }
        );

        // 7. Cập nhật số lượng đã bán của TicketClass
        tc.soldQuantity += quantity;
        if (tc.soldQuantity >= tc.totalQuantity) tc.status = 'sold_out';
        await tc.save({ session });

        // 8. Cập nhật Voucher
        if (voucherUsed) {
            voucherUsed.usedCount += 1;
            await voucherUsed.save({ session });
        }

        await session.commitTransaction();

        res.status(201).json({
            message: 'Tạo đơn hàng thành công',
            purchaseId: newPurchase._id,
            totalAmount: finalAmount
        });

    } catch (err) {
        await session.abortTransaction();
        console.error(err);
        res.status(400).json({ error: err.message });
    } finally {
        session.endSession();
    }
};

export const getMyPurchases = async (req, res) => {
    try {
        const userId = req.user.id;
        const purchases = await Purchase.find({ user: userId, paymentStatus: 'paid' })
            .populate('event', 'title startDateTime location posterURL seatImgUrl')
            .populate('ticketClass', 'name price seatType')
            .sort({ createdAt: -1 });

        const result = await Promise.all(purchases.map(async (purchase) => {
            const tickets = await Ticket.find({ purchase: purchase._id }).select('seat ticketId qrCode isSold');
            return {
                ...purchase.toObject(),
                ticketList: tickets
            };
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};