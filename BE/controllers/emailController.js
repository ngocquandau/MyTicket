/*
Gồm các loại email
    - Xác nhận đăng ký tài khoản
    - Đặt lại mật khẩu

    - Xác nhận đặt vé
    - Hóa đơn / Biên lai thanh toán
    - Thông tin vé
    - Cập nhật sự kiện
    - Nhắc nhở trước sự kiện
    - Thông báo hoàn tiền

    - Khảo sát sau sự kiện (hài lòng khách hàng)

    - Các trường hợp khác
*/

// import Event from '../models/Event.js';
// import TicketClass from '../models/TicketClass.js';
// import { send } from 'node:process';
import User from '../models/User.js';
import { 
    sendBookingConfirmation, 
    sendInvoiceReceipt, 
    sendEventUpdate,
    sendEventReminder
} from '../services/emailService.js';

import { ScheduledJob } from '../models/ScheduledJob.js';

// import { getMailQueue } from "../scheduled_email/mailQueue.ts";
// import dotenv from 'dotenv';
// dotenv.config({quiet: true});


async function checkOTP(userID, otp){
    try {
        const user = await User.findById(userID);   
        if(!user){
            return {status: false, message: 'User not found'};
        }   

        const currentTime = new Date();
        if(user.OTP_CODE.code === otp && user.OTP_CODE.expiresAt > currentTime){
            return {status: true, message: 'OTP is valid'};
        } else {
            return {status: false, message: 'Invalid or expired OTP'};
        }   
    } catch (err) {
        console.error('Lỗi khi kiểm tra OTP:', err);
        return {status: false, message: 'Error checking OTP'};
    }
}

export const replyAccountConfirmation = async (req, res) => {
    try {
        const { userID, otp } = req.body;
        const checkResult =  await checkOTP(userID, otp);
        if(checkResult.status){
                const user = await User.findById(userID);
                user.emailVerified = true;
                user.OTP_CODE = { code: null, expiresAt: null };
                await user.save();
            return res.status(200).json({ message: 'OTP is valid' });
        } else {
            return res.status(400).json({ message: checkResult.message });
        }
    } catch (err) {
        console.error('Lỗi trong khi gửi email xác nhận tài khoản:', err);
        return res.status(500).json({ error: 'Thất bại khi gửi email xác nhận' });
    }
};

export const sendTicketConfirmation = async (req, res) => {
    try {
        const { cusEmail, cusName, eventName, eventDate, venue, link, qr } = req.body;

        const emailResponse = await sendBookingConfirmation({ cusEmail, cusName, eventName, eventDate, venue, link, qr });
        if (!emailResponse.success){
            return res.status(500).json({ error: 'Thất bại khi gửi email xác nhận đặt vé' });
        }
        res.status(200).json({ message: 'Đã gửi email xác nhận đặt vé' });
    } catch (err) {
        console.error('Lỗi trong khi gửi email xác nhận đặt vé:', err);
        return res.status(500).json({ error: 'Thất bại khi gửi email xác nhận đặt vé' });
    }   
};

export const sendInvoice = async (req, res) => {
    try {
        // Lấy thông tin từ req.body
        const { email, name, invoiceNumber, invoiceDate, amount } = req.body; 
        // Gọi service gửi email hóa đơn    
        const emailResponse = await sendInvoiceReceipt({ 
            cusEmail: email, 
            cusName: name, 
            invoiceNumber, 
            invoiceDate, 
            amount 
        });
        if (!emailResponse.success){
            return res.status(500).json({ error: 'Thất bại khi gửi email hóa đơn' });
        }
        res.status(200).json({ message: 'Đã gửi email hóa đơn' });
    } catch (err) {
        console.error('Lỗi trong khi gửi email hóa đơn:', err);
        return res.status(500).json({ error: 'Thất bại khi gửi email hóa đơn' });
    }   
};

export const sendEventUpdateController = async (req, res) => {
    try {
        const { cusEmail, cusName, eventName, updateContent } = req.body;   
        // Gọi service gửi email cập nhật sự kiện
        const emailResponse = await sendEventUpdate({ cusEmail, cusName, eventName, updateContent });
        if (!emailResponse.success){
            return res.status(500).json({ error: 'Thất bại khi gửi email cập nhật sự kiện' });
        }   
        res.status(200).json({ message: 'Đã gửi email cập nhật sự kiện' });
    } catch (err) {
        console.error('Lỗi trong khi gửi email cập nhật sự kiện:', err);
        return res.status(500).json({ error: 'Thất bại khi gửi email cập nhật sự kiện' });
    }
};

export const addScheduledEmail = async (req, res) => {
    try {
        const totalJobs = await scheduleEventReminderEmails(req.body);

        res.status(200).json({
            message: 'Đã lên lịch gửi email nhắc nhở sự kiện',
            totalJobs
        });
    } catch (err) {
        res.status(500).json({ error: 'Thất bại khi lên lịch' });
    }
};

export const scheduleEventReminderEmails = async ({
    cusEmail,
    cusName,
    eventName,
    eventDate,
    venue
}) => {
    const runAt = new Date(eventDate);

    const eventDateObj = new Date(runAt.getTime() + 7 * 60 * 60 * 1000);

    const now = new Date();

    const jobs = [
        { reminderType: '7', runAt: new Date(runAt.getTime() - 7 * 86400000) },
        { reminderType: '3', runAt: new Date(runAt.getTime() - 3 * 86400000) },
        { reminderType: '1', runAt: new Date(runAt.getTime() - 1 * 86400000) },
        { reminderType: 'test', runAt: new Date(now.getTime() + 60000) }
    ];

    const validJobs = jobs.filter(j => j.runAt > now);

    await ScheduledJob.insertMany(
        validJobs.map(j => ({
            type: 'email',
            status: 'pending',
            runAt: j.runAt,
            payload: {
                reminderType: j.reminderType,
                cusEmail,
                cusName,
                eventName,
                eventDate: eventDateObj,
                venue
            }
        }))
    );

    return validJobs.length;
};

export const cronWakeup = async (req, res) => {
  try {
    const now = new Date()
    let processed = 0
    const MAX_JOBS = 10

    for (let i = 0; i < MAX_JOBS; i++) {
        const job = await ScheduledJob.findOneAndUpdate(
            {
                status: 'pending',
                runAt: { $lte: now }
            },
            {
                $set: {
                    status: 'processing',
                    lockedAt: now
                }
            },
            { 
                new: true
            }
        )

        if (!job) break

        try {
            // await handleJob(job)
            const send_email_result = await sendEventReminder(job.payload);
            if (!send_email_result.success) {
                throw new Error('Failed to send reminder email');
            }
            job.status = 'done'
            job.executedAt = new Date()
            await job.save()

            processed++
        } catch (err) {
            job.retryCount += 1

            if (job.retryCount >= job.maxRetries) {
                job.status = 'failed'
            } else {
                job.status = 'pending'
            }

            job.lockedAt = null
            job.lastError = err.message

            await job.save()
        }
    }

    res.json({ message: 'Cron executed', processed })
    console.log("Processed jobs:", processed)
  } catch (err) {
    console.error('Cron wakeup error:', err)
    res.status(500).json({ error: 'Cron failed' })
  }
}