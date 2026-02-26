import mongoose from 'mongoose';
import QRCode from 'qrcode';
import Purchase from '../models/Purchase.js';
import TicketClass from '../models/TicketClass.js';
import Event from '../models/Event.js';
import Voucher from '../models/Voucher.js';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

const buildGeneralTicketId = () => `GEN-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
const escapeXml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const ensurePurchaseTickets = async (purchaseDoc) => {
    const purchase = purchaseDoc.toObject ? purchaseDoc.toObject() : purchaseDoc;
    const purchaseId = purchase._id;
    const quantity = Number(purchase.quantity || 0);
    const ticketClassId = purchase.ticketClass?._id || purchase.ticketClass;
    const seatType = purchase.ticketClass?.seatType || 'general';

    let linkedTickets = await Ticket.find({ purchase: purchaseId }).select('seat ticketId qrCode isSold');
    if (linkedTickets.length >= quantity || quantity <= 0) {
        return linkedTickets;
    }

    let missing = quantity - linkedTickets.length;

    // Backfill dữ liệu lịch sử: lấy các vé đã bán cùng hạng nhưng chưa gắn purchase
    const legacyTickets = await Ticket.find({
        ticketClass: ticketClassId,
        isSold: true,
        purchase: null
    })
        .sort({ _id: 1 })
        .limit(missing)
        .select('_id');

    if (legacyTickets.length > 0) {
        await Ticket.updateMany(
            { _id: { $in: legacyTickets.map(t => t._id) } },
            { $set: { purchase: purchaseId } }
        );
    }

    linkedTickets = await Ticket.find({ purchase: purchaseId }).select('seat ticketId qrCode isSold');
    missing = quantity - linkedTickets.length;

    // Nếu vẫn thiếu và là vé tự do, tạo bù để người dùng có mã QR dùng ngay
    if (missing > 0 && seatType === 'general') {
        const ticketName = purchase.ticketClass?.name || 'General';
        const createdTickets = Array.from({ length: missing }).map(() => ({
            ticketClass: ticketClassId,
            seat: `${ticketName} - Tự do`,
            isSold: true,
            purchase: purchaseId,
            ticketId: buildGeneralTicketId()
        }));

        await Ticket.insertMany(createdTickets);
        linkedTickets = await Ticket.find({ purchase: purchaseId }).select('seat ticketId qrCode isSold');
    }

    return linkedTickets;
};

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
            const tickets = await ensurePurchaseTickets(purchase);
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

export const downloadTicketQrImage = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const requesterId = req.user?.id;
        const requesterRole = req.user?.role;

        const ticket = await Ticket.findOne({ ticketId })
            .populate('purchase', 'user paymentStatus')
            .lean();

        if (!ticket) {
            return res.status(404).json({ error: 'Không tìm thấy vé' });
        }

        if (!ticket.purchase || ticket.purchase.paymentStatus !== 'paid') {
            return res.status(400).json({ error: 'Vé chưa thanh toán, không thể tạo QR' });
        }

        const ownerId = String(ticket.purchase.user || '');
        if (requesterRole !== 'admin' && ownerId !== requesterId) {
            return res.status(403).json({ error: 'Bạn không có quyền tải QR của vé này' });
        }

        const publicApiBase = process.env.PUBLIC_API_BASE_URL || 'http://localhost:3000';
        const qrValue = `${publicApiBase}/api/purchases/tickets/${encodeURIComponent(ticket.ticketId)}/public-image`;

        const imageBuffer = await QRCode.toBuffer(qrValue, {
            type: 'png',
            width: 640,
            margin: 2
        });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticket.ticketId}.png"`);
        return res.send(imageBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

export const getPaidTicketPublicInfo = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await Ticket.findOne({ ticketId })
            .populate({
                path: 'ticketClass',
                select: 'name price seatType event',
                populate: {
                    path: 'event',
                    select: 'title startDateTime endDateTime location posterURL status'
                }
            })
            .populate({
                path: 'purchase',
                select: 'paymentStatus createdAt purchaseDate quantity totalAmount paymentMethod user',
                populate: {
                    path: 'user',
                    select: 'firstName lastName email phoneNumber'
                }
            })
            .lean();

        if (!ticket) {
            return res.status(404).json({ error: 'Không tìm thấy vé' });
        }

        if (!ticket.purchase || ticket.purchase.paymentStatus !== 'paid') {
            return res.status(403).json({ error: 'Vé chưa thanh toán hoặc không hợp lệ' });
        }

        const buyer = ticket.purchase.user || {};
        const buyerName = [buyer.lastName, buyer.firstName].filter(Boolean).join(' ').trim() || 'Đang cập nhật';

        return res.json({
            ticketId: ticket.ticketId,
            seat: ticket.seat,
            seatType: ticket.ticketClass?.seatType || 'general',
            ticketClass: {
                name: ticket.ticketClass?.name || '',
                price: ticket.ticketClass?.price || 0
            },
            event: ticket.ticketClass?.event || null,
            payment: {
                status: ticket.purchase.paymentStatus,
                method: ticket.purchase.paymentMethod,
                quantity: ticket.purchase.quantity,
                totalAmount: ticket.purchase.totalAmount,
                purchasedAt: ticket.purchase.purchaseDate || ticket.purchase.createdAt
            },
            buyer: {
                name: buyerName,
                email: buyer.email || '',
                phoneNumber: buyer.phoneNumber || ''
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

export const getPaidTicketPublicImage = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await Ticket.findOne({ ticketId })
            .populate({
                path: 'ticketClass',
                select: 'name seatType event',
                populate: {
                    path: 'event',
                    select: 'title startDateTime location'
                }
            })
            .populate({
                path: 'purchase',
                select: 'paymentStatus totalAmount purchaseDate createdAt user',
                populate: {
                    path: 'user',
                    select: 'firstName lastName email phoneNumber'
                }
            })
            .lean();

        if (!ticket || !ticket.purchase || ticket.purchase.paymentStatus !== 'paid') {
            return res.status(404).send('Ticket not found or not paid');
        }

        const event = ticket.ticketClass?.event || {};
        const seatLabel = ticket.ticketClass?.seatType === 'reserved' ? (ticket.seat || '—') : 'Vé tự do';
        const location = event.location?.address || 'Đang cập nhật địa điểm';
        const startAt = event.startDateTime
            ? new Date(event.startDateTime).toLocaleString('vi-VN')
            : 'Đang cập nhật';
        const amount = Number(ticket.purchase.totalAmount || 0).toLocaleString('vi-VN');
        const purchasedAt = ticket.purchase.purchaseDate || ticket.purchase.createdAt;
        const purchasedAtText = purchasedAt ? new Date(purchasedAt).toLocaleString('vi-VN') : 'Đang cập nhật';
        const buyer = ticket.purchase.user || {};
        const buyerName = [buyer.lastName, buyer.firstName].filter(Boolean).join(' ').trim() || 'Đang cập nhật';
        const buyerContact = [buyer.email, buyer.phoneNumber].filter(Boolean).join(' | ') || 'Đang cập nhật';

        const compact = (value = '', maxChars = 72) => {
            const normalized = String(value || '').replace(/\s+/g, ' ').trim();
            if (!normalized) return '—';
            return normalized.length > maxChars ? `${normalized.slice(0, maxChars - 1)}…` : normalized;
        };

        const rows = [
            { label: 'Mã vé', value: compact(ticket.ticketId || '', 36), mono: true },
            { label: 'Sự kiện', value: compact(event.title || 'Sự kiện không xác định', 80) },
            { label: 'Người mua', value: compact(buyerName, 70) },
            { label: 'Liên hệ', value: compact(buyerContact, 90) },
            { label: 'Thời gian', value: compact(startAt, 60) },
            { label: 'Địa điểm', value: compact(location, 95) },
            { label: 'Chỗ ngồi', value: compact(seatLabel, 60) },
            { label: 'Tổng tiền', value: `${amount} VND`, danger: true },
            { label: 'Ngày mua', value: compact(purchasedAtText, 60) }
        ];

        const rowsHtml = rows
            .map((row) => `
                <div class="row">
                    <div class="label">${escapeXml(row.label)}</div>
                    <div class="value${row.mono ? ' mono' : ''}${row.danger ? ' danger' : ''}">${escapeXml(row.value)}</div>
                </div>
            `)
            .join('');

        const html = `
<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Thông tin vé điện tử</title>
    <style>
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; font-family: Arial, sans-serif; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #eef3f9;
            padding: 10px;
            color: #0f172a;
        }
        .card {
            width: min(96vw, 760px);
            max-height: calc(100vh - 20px);
            border: 1px solid #d6e1ee;
            border-radius: 18px;
            background: #ffffff;
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
            padding: 14px;
            overflow: hidden;
        }
        .head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 8px;
        }
        .title {
            margin: 0;
            font-size: clamp(20px, 3vw, 30px);
            line-height: 1.2;
            color: #1d6fe8;
            font-weight: 700;
        }
        .sub {
            margin: 0 0 10px;
            color: #2b3a55;
            font-size: 16px;
        }
        .paid {
            background: #e8f7ee;
            color: #1f9d55;
            padding: 8px 14px;
            border-radius: 999px;
            font-size: 16px;
            font-weight: 700;
            white-space: nowrap;
        }
        .table {
            display: grid;
            gap: 8px;
        }
        .row {
            display: grid;
            grid-template-columns: 140px 1fr;
            gap: 10px;
            align-items: center;
            background: #f8fbff;
            border: 1px solid #e3ebf5;
            border-radius: 10px;
            padding: 8px 10px;
            min-height: 42px;
        }
        .label {
            color: #334155;
            font-weight: 700;
            font-size: 15px;
        }
        .value {
            font-size: 16px;
            font-weight: 500;
            line-height: 1.3;
            overflow-wrap: anywhere;
            word-break: break-word;
        }
        .value.mono {
            font-family: "Courier New", monospace;
            font-size: 15px;
        }
        .value.danger {
            color: #b91c1c;
            font-weight: 700;
        }
        @media (max-width: 560px) {
            .card { padding: 12px; }
            .sub { font-size: 14px; }
            .paid { font-size: 14px; padding: 6px 12px; }
            .row {
                grid-template-columns: 1fr;
                gap: 4px;
                padding: 8px;
            }
            .label { font-size: 14px; }
            .value { font-size: 15px; }
        }
    </style>
</head>
<body>
    <section class="card" aria-label="Thông tin vé điện tử">
        <div class="head">
            <h1 class="title">THÔNG TIN VÉ ĐIỆN TỬ</h1>
            <span class="paid">ĐÃ THANH TOÁN</span>
        </div>
        <p class="sub">MyTicket - Vé hợp lệ đã thanh toán</p>

        <div class="table">
            ${rowsHtml}
        </div>
    </section>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};