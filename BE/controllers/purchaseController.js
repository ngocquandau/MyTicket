import mongoose from 'mongoose';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Purchase from '../models/Purchase.js';
import TicketClass from '../models/TicketClass.js';
import Event from '../models/Event.js';
import Voucher from '../models/Voucher.js';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

// Import service gửi email
import { sendBookingConfirmation } from '../services/emailService.js';

import { scheduleEventReminderEmails } from './emailController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildGeneralTicketId = () => `GEN-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
const escapeXml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

let watermarkLogoDataUri = '';
const getWatermarkLogoDataUri = () => {
    if (watermarkLogoDataUri) return watermarkLogoDataUri;

    try {
        const logoPath = path.resolve(__dirname, '../../FE/src/assets/myticket_logo.png');
        if (!fs.existsSync(logoPath)) return '';
        const logoBuffer = fs.readFileSync(logoPath);
        watermarkLogoDataUri = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        return watermarkLogoDataUri;
    } catch (error) {
        console.warn('Không thể tải logo watermark:', error?.message || error);
        return '';
    }
};

const DEFAULT_FRONTEND_URL = 'https://mticket.vercel.app';
const getFrontendBaseUrl = () => (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(/\/$/, '');
const sanitizeTicketToken = (value = '') => {
    const normalized = String(value || '')
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return normalized || 'ticket';
};

const buildTicketPublicToken = (ticketId, ticketRef) => String(ticketRef || ticketId || '').trim();

const buildTicketInfoUrl = (ticketId, ticketRef) => (
    `${getFrontendBaseUrl()}/ticket-info/${encodeURIComponent(buildTicketPublicToken(ticketId, ticketRef))}`
);

const buildTicketQrAttachment = async ({ ticketId, ticketRef }) => {
    const safeToken = sanitizeTicketToken(ticketRef || ticketId);

    return {
    cid: `ticket-qr-${safeToken}@myticket`,
    filename: `ticket-${safeToken}.png`,
    content: await QRCode.toBuffer(buildTicketInfoUrl(ticketId, ticketRef), {
        type: 'png',
        width: 280,
        margin: 1,
    }),
    };
};

const resolveTicketCandidates = async ({ ticketToken, ticketRef, populate = [] }) => {
    const findTickets = (query) => Ticket.find(query).populate(populate).lean();

    if (ticketRef && mongoose.Types.ObjectId.isValid(ticketRef)) {
        const ticketsByRef = await findTickets({ _id: ticketRef });
        if (ticketsByRef.length) {
            return ticketsByRef;
        }
    }

    if (ticketToken && mongoose.Types.ObjectId.isValid(ticketToken)) {
        const ticketsById = await findTickets({ _id: ticketToken });
        if (ticketsById.length) {
            return ticketsById;
        }
    }

    if (!ticketToken) {
        return [];
    }

    return findTickets({ ticketId: ticketToken });
};

const pickPaidTicket = (tickets = []) => (
    tickets.find((ticket) => ticket?.purchase?.paymentStatus === 'paid') || tickets[0] || null
);

// ==========================================
// HÀM HELPER TỰ ĐỘNG GỬI EMAIL XÁC NHẬN VÉ
// ==========================================
export const triggerTicketEmail = async (purchaseId) => {
    try {
        const purchase = await Purchase.findById(purchaseId)
            .populate('user')
            .populate({
                path: 'ticketClass',
                populate: { path: 'event' }
            });

        if (!purchase || !purchase.user || !purchase.ticketClass || !purchase.ticketClass.event) {
            return;
        }

        const user = purchase.user;
        const event = purchase.ticketClass.event;

        const linkedTickets = await ensurePurchaseTickets(purchase);
        const ticketEntries = await Promise.all(
            linkedTickets
                .filter((ticket) => ticket?.ticketId)
                .map(async (ticket) => {
                    const qrAttachment = await buildTicketQrAttachment({
                        ticketId: ticket.ticketId,
                        ticketRef: ticket._id,
                    });

                    return {
                        ticketId: ticket.ticketId,
                        seat: ticket.seat || 'Vé tự do',
                        link: buildTicketInfoUrl(ticket.ticketId, ticket._id),
                        qrCid: qrAttachment.cid,
                        qrFilename: qrAttachment.filename,
                        qrContent: qrAttachment.content,
                    };
                })
        );

        const primaryTicket = ticketEntries[0];

        await sendBookingConfirmation({
            cusEmail: user.email,
            cusName: `${user.lastName || ''} ${user.firstName || ''}`.trim(),
            eventName: event.title,
            eventDate: new Date(event.startDateTime).toLocaleDateString('vi-VN'),
            venue: event.location?.address || 'Xem chi tiết trên ứng dụng',
            link: primaryTicket?.link || `${getFrontendBaseUrl()}/my-tickets`,
            qrCid: primaryTicket?.qrCid || '',
            qrFilename: primaryTicket?.qrFilename || '',
            qrContent: primaryTicket?.qrContent || null,
            ticketEntries,
        });
        
        await scheduleEventReminderEmails({
            cusEmail: user.email,
            cusName: `${user.lastName || ''} ${user.firstName || ''}`.trim(),
            eventName: event.title,
            eventDate: event.startDateTime,
            venue: event.location?.address || 'Xem chi tiết trên ứng dụng'
        });        

        console.log(`[Email] Đã gửi email xác nhận vé cho đơn hàng ${purchaseId}`);
    } catch (error) {
        console.error("[Email Error] Lỗi khi gửi email vé tự động:", error);
    }
};
// ==========================================

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

const createTicketsPlaceholder = async (ticketClass, quantity, purchaseId, session) => {
    const ticketsData = Array.from({ length: quantity }).map((_, index) => {
        let seatName;
        
        if (ticketClass.seatType === 'reserved') {
            seatName = `RSV-${Date.now()}-${index}`; 
        } else {
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

        const tc = await TicketClass.findById(ticketClassId).session(session);
        if (!tc) throw new Error('Hạng vé không tồn tại');
        if (tc.status !== 'available') throw new Error('Hạng vé này hiện không khả dụng');

        // KIỂM TRA ĐIỀU KIỆN VÉ MIỄN PHÍ: Chỉ cho phép mua 1 vé
        if (tc.price === 0 && quantity > 1) {
            throw new Error('Đối với vé miễn phí, mỗi lần chỉ được nhận tối đa 1 vé.');
        }

        let ticketRecords = [];

        if (tc.seatType === 'reserved') {
            if (!selectedTicketIds || selectedTicketIds.length !== quantity) {
                throw new Error(`Vui lòng chọn đủ ${quantity} ghế.`);
            }

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
            const remaining = tc.totalQuantity - (tc.soldQuantity || 0);
            if (quantity > remaining) {
                throw new Error(`Chỉ còn lại ${remaining} vé.`);
            }

            const ticketsData = Array.from({ length: quantity }).map((_, index) => ({
                ticketClass: tc._id,
                seat: `${tc.name} - Tự do`,
                isSold: true,
                ticketId: `GEN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            }));
            
            ticketRecords = await Ticket.insertMany(ticketsData, { session });
        }

        const event = await Event.findById(tc.event).session(session);
        if (!event) throw new Error('Sự kiện không tồn tại');
        
        const user = await User.findById(userId).session(session);
        if (event.ageLimit > 0 && user.birthday) {
            const age = new Date().getFullYear() - new Date(user.birthday).getFullYear();
            if (age < event.ageLimit) throw new Error(`Yêu cầu độ tuổi tối thiểu: ${event.ageLimit}`);
        }

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

        // BIẾN XÁC ĐỊNH LÀ ĐƠN HÀNG MIỄN PHÍ HOẶC GIẢM VỀ 0Đ
        const isFree = finalAmount === 0;

        const newPurchase = new Purchase({
            user: userId,
            event: tc.event,
            ticketClass: ticketClassId,
            quantity,
            totalAmount: finalAmount,
            originalPrice: originalPrice,
            voucher: voucherUsed ? voucherUsed._id : null,
            paymentMethod: paymentMethod,
            paymentStatus: isFree ? 'paid' : 'pending',
            purchaseDate: isFree ? new Date() : undefined 
        });
        await newPurchase.save({ session });

        const ticketIdsToUpdate = ticketRecords.map(t => t._id);
        
        await Ticket.updateMany(
            { _id: { $in: ticketIdsToUpdate } },
            { $set: { isSold: true, purchase: newPurchase._id } },
            { session }
        );

        tc.soldQuantity += quantity;
        if (tc.soldQuantity >= tc.totalQuantity) tc.status = 'sold_out';
        await tc.save({ session });

        if (voucherUsed) {
            voucherUsed.usedCount += 1;
            await voucherUsed.save({ session });
        }

        // NẾU LÀ VÉ FREE, CẬP NHẬT LUÔN THỐNG KÊ CHO NGƯỜI DÙNG
        if (isFree) {
            await User.findByIdAndUpdate(userId, {
                $inc: { 
                    totalSpent: finalAmount, 
                    totalTicketsPurchase: quantity 
                },
                $set: { accumulateFlag: true } 
            }, { session });
        }

        await session.commitTransaction();

        // NẾU LÀ VÉ FREE THÌ GỬI MAIL LUÔN (Chạy nền)
        if (isFree) {
            setTimeout(() => {
                triggerTicketEmail(newPurchase._id);
            }, 500);
        }

        res.status(201).json({
            message: isFree ? 'Nhận vé thành công' : 'Tạo đơn hàng thành công',
            purchaseId: newPurchase._id,
            totalAmount: finalAmount,
            isFree: isFree 
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
            .populate('event', 'title startDateTime endDateTime location posterURL seatImgUrl')
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
        const { ticketId: ticketToken } = req.params;
        const { ref: ticketRef } = req.query;
        const requesterId = req.user?.id;
        const requesterRole = req.user?.role;

        const tickets = await resolveTicketCandidates({
            ticketToken,
            ticketRef,
            populate: {
                path: 'purchase',
                select: 'user paymentStatus'
            }
        });

        const ticket = requesterRole === 'admin'
            ? pickPaidTicket(tickets)
            : tickets.find((item) => item?.purchase?.paymentStatus === 'paid' && String(item?.purchase?.user || '') === requesterId) || pickPaidTicket(tickets);

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

        const qrValue = buildTicketInfoUrl(ticket.ticketId, ticket._id);

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
        const { ticketId: ticketToken } = req.params;
        const { ref: ticketRef } = req.query;

        const tickets = await resolveTicketCandidates({
            ticketToken,
            ticketRef,
            populate: [
                {
                    path: 'ticketClass',
                    select: 'name price seatType event',
                    populate: {
                        path: 'event',
                        select: 'title startDateTime endDateTime location posterURL status'
                    }
                },
                {
                    path: 'purchase',
                    select: 'paymentStatus createdAt purchaseDate quantity totalAmount paymentMethod user',
                    populate: {
                        path: 'user',
                        select: 'firstName lastName email phoneNumber'
                    }
                }
            ]
        });

        const ticket = pickPaidTicket(tickets);

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
        const { ticketId: ticketToken } = req.params;
        const { ref: ticketRef } = req.query;

        const tickets = await resolveTicketCandidates({
            ticketToken,
            ticketRef,
            populate: [
                {
                    path: 'ticketClass',
                    select: 'name seatType event',
                    populate: {
                        path: 'event',
                        select: 'title startDateTime location'
                    }
                },
                {
                    path: 'purchase',
                    select: 'paymentStatus totalAmount purchaseDate createdAt user',
                    populate: {
                        path: 'user',
                        select: 'firstName lastName email phoneNumber'
                    }
                }
            ]
        });

        const ticket = pickPaidTicket(tickets);

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
        const logoDataUri = getWatermarkLogoDataUri();

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
            position: relative;
            width: min(96vw, 760px);
            max-height: calc(100vh - 20px);
            border: 1px solid #d6e1ee;
            border-radius: 18px;
            background: #ffffff;
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
            padding: 14px;
            overflow: hidden;
        }
        .watermark {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            user-select: none;
            z-index: 0;
        }
        .watermark img {
            width: min(80%, 420px);
            height: auto;
            opacity: 0.06;
        }
        .card-content {
            position: relative;
            z-index: 1;
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
        ${logoDataUri ? `<div class="watermark"><img src="${logoDataUri}" alt="MyTicket watermark" /></div>` : ''}
        <div class="card-content">
            <div class="head">
                <h1 class="title">THÔNG TIN VÉ ĐIỆN TỬ</h1>
                <span class="paid">ĐÃ THANH TOÁN</span>
            </div>
            <p class="sub">MyTicket - Vé hợp lệ đã thanh toán</p>

            <div class="table">
                ${rowsHtml}
            </div>
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

// === CÁC API MỚI BỔ SUNG ĐỂ XỬ LÝ HỦY ĐƠN VÀ NHẢ VÉ ===

// 1. Hàm hủy đơn hàng và nhả vé (Dùng khi khách bấm Hủy trên web)
export const cancelPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const purchase = await Purchase.findById(id).session(session);

        if (!purchase || purchase.paymentStatus !== 'pending') {
            throw new Error('Đơn hàng không hợp lệ hoặc đã được xử lý');
        }

        purchase.paymentStatus = 'cancelled';
        await purchase.save({ session });

        await Ticket.updateMany(
            { purchase: purchase._id },
            { $set: { isSold: false, purchase: null } },
            { session }
        );

        const tc = await TicketClass.findById(purchase.ticketClass).session(session);
        if (tc) {
            tc.soldQuantity = Math.max(0, tc.soldQuantity - purchase.quantity);
            if (tc.soldQuantity < tc.totalQuantity) {
                tc.status = 'available';
            }
            await tc.save({ session });
        }

        await session.commitTransaction();
        res.status(200).json({ message: 'Đã hủy đơn hàng và hoàn trả vé thành công' });

    } catch (err) {
        await session.abortTransaction();
        console.error("Lỗi khi hủy đơn:", err);
        res.status(400).json({ error: err.message });
    } finally {
        session.endSession();
    }
};

// 2. API dành riêng cho webhook Cron-job.org gọi vào để dọn vé kẹt
export const cancelExpiredPurchases = async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ message: "Truy cập bị từ chối" });
    }

    try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        const expiredPurchases = await Purchase.find({
            paymentStatus: 'pending',
            createdAt: { $lt: fifteenMinutesAgo }
        });

        let canceledCount = 0;

        for (const purchase of expiredPurchases) {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                purchase.paymentStatus = 'failed';
                await purchase.save({ session });

                await Ticket.updateMany(
                    { purchase: purchase._id },
                    { $set: { isSold: false, purchase: null } },
                    { session }
                );

                const tc = await TicketClass.findById(purchase.ticketClass).session(session);
                if (tc) {
                    tc.soldQuantity = Math.max(0, tc.soldQuantity - purchase.quantity);
                    if (tc.soldQuantity < tc.totalQuantity) {
                        tc.status = 'available';
                    }
                    await tc.save({ session });
                }

                await session.commitTransaction();
                canceledCount++;
            } catch (err) {
                await session.abortTransaction();
                console.error(`Lỗi hủy đơn tự động ${purchase._id}:`, err);
            } finally {
                session.endSession();
            }
        }

        return res.status(200).json({ 
            message: "Đã chạy Cron Job thành công", 
            canceledTickets: canceledCount 
        });

    } catch (error) {
        console.error("Lỗi Cron Job:", error);
        return res.status(500).json({ error: error.message });
    }
};