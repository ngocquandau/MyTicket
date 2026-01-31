import nodemailer from 'nodemailer';
import dotenv   from 'dotenv';
// import agenda from '../agenda.js';



/*
Gồm các loại email
    - Xác nhận đăng ký tài khoản
    - Đặt lại mật khẩu

    - Xác nhận đặt vé
    - Hóa đơn / Biên lai thanh toán
    - Cập nhật sự kiện
    - Nhắc nhở trước sự kiện
    - Thông báo hoàn tiền

    - Khảo sát sau sự kiện (hài lòng khách hàng)

    - Các trường hợp khác
*/
dotenv.config({quiet: true});
const EMAIL = process.env.EMAIL; 
const EMAIL_PASSWORD = process.env.EMAIL_PW;

// Tạo transporter với Gmail
const transporter = nodemailer.createTransport({ 
    service: 'gmail', 
    auth: { 
        user: EMAIL,
        pass: EMAIL_PASSWORD,
}, });

export const sendAccountConfirmation = async ({cusEmail, cusName, code}) => {
  try {
    // Nội dung email 
    const mailOptions = { 
        from: `"MyTicket" <${process.env.EMAIL}>`, 
        to: cusEmail, 
        subject: 'Xác nhận tài khoản', 
        html: `
            <h3>Xin chào ${cusName},</h3> 
            <p>Dưới đây là mã xác minh tài khoản email của bạn:</p> 
            <h2 style="color:blue;">${code}</h2>
            <p>Vui lòng nhập mã này vào ứng dụng để hoàn tất việc đăng ký.</p>
            <p>LƯU Ý: OTP này sẽ hết hạn sau 10 phút.</p> 
            `, 
        };

        // Gửi email 
        await transporter.sendMail(mailOptions);

        // service chỉ trả data
        return { success: true };
  } catch (err) {
        console.error('Lỗi trong khi gửi email xác nhận tài khoản:', err);
        return { success: false};
  }
};

export const sendNewPassword = async ({cusEmail, cusName, password}) => {
    try {
        // Nội dung email 
        const mailOptions = { 
            from:   `"MyTicket" <${process.env.EMAIL}>`, 
            to:     cusEmail, 
            subject: 'Thay đổi mật khẩu thành công', 
            html: `
                <h3>Xin chào ${cusName},</h3> 
                <p>Dưới đây là mật khẩu mới cho tài khoản của bạn:</p> 
                <h2 style="color:blue;">${password}</h2>
                <p>Vui lòng đăng nhập vào ứng dụng bằng mật khẩu này, sau đó bạn có thể thay đổi mật khẩu mới.</p>
                <p>LƯU Ý: Không chia sẻ mật khẩu này với người khác.</p> 
                `, 
        };

        // Gửi email 
        await transporter.sendMail(mailOptions);

        // service chỉ trả data
        return { success: true };
    } catch (err) {
        console.error('Lỗi trong khi gửi email mật khẩu mới:', err);
        return { success: false};
    }
    
}

export const sendBookingConfirmation = async ({ cusEmail, cusName, eventName, eventDate, venue, link, qr }) => {
    try {
        // Nếu có link => option 1, nếu không có link => option 2:
        // 1. Xác nhận đặt vé thành công kèm theo link vé (trg hợp vé do đối tác phát hành và có sẵn link vé)
        // 2. Xác nhận đặt vé thành công và đợi vé bên đối tác phê duyệt (thông báo đối tác sẽ gửi vé sau)
        var dynamicPart = "";
        if (link) {  
            dynamicPart =  `<p>Đính kèm bên dưới là liên kết đến vé của bạn.</p>
            <a href="${link}">Xem vé của bạn</a>`;
            if (qr) {
                dynamicPart += `<p>Hoặc bạn có thể quét mã QR dưới đây để truy cập vé:</p>
                <img src="${qr}" alt="Mã QR vé" style="width:200px;height:200px;"/>`;
            }
        } else        
            dynamicPart =   '<p>Thông tin vé của bạn sẽ được ban tổ chức gửi sau.</p>';   

        const mailOptions = {
        from: `"MyTicket" <${process.env.EMAIL}>`,
        to: cusEmail,
        subject: 'Xác nhận đặt vé thành công',
        html: `
            <h3>Xin chào ${cusName},</h3>
            <p>Bạn đã đặt vé thành công tại sự kiện <b>${eventName}</b></p>
            <p>Sự kiện sẽ diễn ra vào ngày ${eventDate} tại ${venue}</p> 
            ${dynamicPart}
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            `
    };
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('Lỗi trong khi gửi email xác nhận đặt vé:', err);
        return { success: false};
    }
};

export const sendInvoiceReceipt = async ({ cusEmail, cusName, invoiceNumber, invoiceDate, amount }) => {
    try {
        const mailOptions = {
            from: `"MyTicket" <${process.env.EMAIL}>`,
            to: cusEmail,
            subject: 'Hóa đơn thanh toán',
            html: `
                <h3>Xin chào ${cusName},</h3>
                <p>Đây là hóa đơn cho giao dịch của bạn trên MyTicket.</p>
                <p>Số hóa đơn: <b>${invoiceNumber}</b></p>
                <p>Ngày phát hành: ${invoiceDate}</p>
                <p>Số tiền: ${amount}</p>
                <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>    `
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('Lỗi trong khi gửi email hóa đơn:', err);
        return { success: false };
    }
};

export const sendEventUpdate = async ({ cusEmail, cusName, eventName, updateContent }) => {
    try {
        const mailOptions = {
            from: `"MyTicket" <${process.env.EMAIL}>`,
            to: cusEmail,
            subject: `Cập nhật sự kiện: ${eventName}`,
            html: `
                <h3>Xin chào ${cusName},</h3>
                <p>Chúng tôi có một số cập nhật quan trọng về sự kiện <b>${eventName}</b>:</p>
                <p>${updateContent}</p>
                <p>Cảm ơn bạn đã đồng hành cùng chúng tôi!</p>
            `
        };
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('Lỗi khi gửi email cập nhật sự kiện:', err);
        return { success: false };
    }
};

export const sendEventReminder = async ({ reminderType, cusEmail, cusName, eventName, eventDate, venue }) => {
    try {
        console.log("EMAIL REMINDER FUNCTION CALLED");
        const mailOptions = {
            from: `"MyTicket" <${process.env.EMAIL}>`,
            to: cusEmail,
            subject: `Nhắc nhở còn ${reminderType} ngày nữa đến sự kiện ${eventName}`,
            html: `
                <h3>Xin chào ${cusName},</h3>
                <p>Đây là lời nhắc nhở rằng sự kiện <b>${eventName}</b> sẽ diễn ra vào ngày ${eventDate.getDate()} tháng ${eventDate.getMonth() + 1} năm ${eventDate.getFullYear()} tại ${venue}.</p>
                <p>Cảm ơn bạn đã đồng hành cùng chúng tôi!</p>
            `
        };
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('Lỗi khi gửi email nhắc nhở sự kiện:', err);
        return { success: false };
    }
};

export const sendRefundNotification = async ({ cusEmail, cusName, eventName, amount }) => {
    try {
        const mailOptions = {
            from: `"MyTicket" <${process.env.EMAIL}>`,
            to: cusEmail,
            subject: `Thông báo hoàn tiền - ${eventName}`,
            html: `
                <h3>Xin chào ${cusName},</h3>
                <p>Chúng tôi xin thông báo rằng yêu cầu hoàn tiền của bạn cho sự kiện <b>${eventName}</b> đã được phê duyệt.</p>
                <p>Số tiền hoàn lại: ${amount}</p>
                <p>Số tiền sẽ được chuyển về tài khoản của bạn trong vài ngày tới.</p>
                <p>Rất tiếc vì sự bất tiện này và cảm ơn bạn đã đồng hành cùng chúng tôi!</p>
            `
        };
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('Lỗi khi gửi email hoàn tiền:', err);
        return { success: false };
    }
};

export const sendPostEventSurvey = async ({ cusEmail, cusName, eventName, surveyLink }) => {
    try {
        const mailOptions = {
            from: `"MyTicket" <${process.env.EMAIL}>`,
            to: cusEmail,
            subject: `Khảo sát sau sự kiện - ${eventName}`,
            html: `
                <h3>Xin chào ${cusName},</h3>
                <p>Cảm ơn bạn đã tham gia sự kiện <b>${eventName}</b>.</p>
                <p>Chúng tôi rất mong nhận được phản hồi của bạn để cải thiện chất lượng dịch vụ.</p>
                <p>Vui lòng tham gia khảo sát tại liên kết sau:</p>
                <a href="${surveyLink}">Tham gia khảo sát</a>
                <p>Xin chân thành cảm ơn!</p>
            `
        };
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('Lỗi khi gửi email khảo sát:', err);
        return { success: false };
    }
};
