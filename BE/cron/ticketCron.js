import cron from 'node-cron';
import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import Ticket from '../models/Ticket.js';
import TicketClass from '../models/TicketClass.js';

export const startTicketCronJob = () => {
    // Chạy ngầm mỗi 1 phút một lần
    cron.schedule('* * * * *', async () => {
        try {
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

            const expiredPurchases = await Purchase.find({
                paymentStatus: 'pending',
                createdAt: { $lt: fifteenMinutesAgo }
            });

            if (expiredPurchases.length === 0) return;

            console.log(`[CRON JOB] Đang dọn dẹp ${expiredPurchases.length} vé kẹt quá 15 phút...`);

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
                    console.log(`[CRON JOB] Đã thu hồi vé của đơn: ${purchase._id}`);
                } catch (err) {
                    await session.abortTransaction();
                    console.error(`[CRON JOB] Lỗi thu hồi đơn ${purchase._id}:`, err);
                } finally {
                    session.endSession();
                }
            }
        } catch (error) {
            console.error('[CRON JOB] Lỗi hệ thống Cron:', error);
        }
    });

    console.log('⏰ Ticket Cron Job đã kích hoạt (Quét mỗi 1 phút).');
};