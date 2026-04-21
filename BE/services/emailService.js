import nodemailer from 'nodemailer';
import dotenv   from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
const SUPPORT_EMAIL = 'support@myticket.vn';
const SUPPORT_ADDRESS = '158 Linh Đông, Thủ Đức, TP.HCM';
const SUPPORT_PHONE = '0123.456.78';
const BRAND_COLOR = '#1d84de';
const BRAND_DARK = '#0f2747';
const BRAND_LIGHT = '#eef6ff';
const ACCENT_RED = '#dc2626';
const LOGO_CID = 'myticket-logo@myticket';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedLogoAttachment;

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getLogoAttachment = () => {
    if (cachedLogoAttachment !== undefined) {
        return cachedLogoAttachment;
    }

    try {
        const logoPath = path.resolve(__dirname, '../../FE/src/assets/myticket_logo.png');
        if (!fs.existsSync(logoPath)) {
            cachedLogoAttachment = null;
            return cachedLogoAttachment;
        }

        cachedLogoAttachment = {
            filename: 'myticket-logo.png',
            content: fs.readFileSync(logoPath),
            cid: LOGO_CID,
            contentType: 'image/png',
            disposition: 'inline'
        };

        return cachedLogoAttachment;
    } catch (error) {
        console.warn('Không thể tải logo email:', error?.message || error);
        cachedLogoAttachment = null;
        return cachedLogoAttachment;
    }
};

const SOCIAL_ICON_SVG = {
    facebook: '<path d="M13.5 8H15V5.5h-1.5c-2 0-3.5 1.5-3.5 3.5V11H8v2.5h2V19h2.5v-5.5H15l.5-2.5h-3V9c0-.6.4-1 1-1Z" fill="#ffffff"/>',
    instagram: '<path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2.2A1.8 1.8 0 0 0 5.2 7v10c0 1 .8 1.8 1.8 1.8h10c1 0 1.8-.8 1.8-1.8V7c0-1-.8-1.8-1.8-1.8H7Zm10.2 1.3a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 7.4A4.6 4.6 0 1 1 7.4 12 4.6 4.6 0 0 1 12 7.4Zm0 2.2A2.4 2.4 0 1 0 14.4 12 2.4 2.4 0 0 0 12 9.6Z" fill="#ffffff"/>',
    youtube: '<path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2A29.7 29.7 0 0 0 2 12a29.7 29.7 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2A29.7 29.7 0 0 0 22 12a29.7 29.7 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" fill="#ffffff"/>',
    tiktok: '<path d="M14.5 3c.3 1.9 1.4 3.5 3 4.4 1 .6 2 .9 3.1.9v2.6c-1.3 0-2.6-.3-3.8-.8v5.3c0 2.9-2.3 5.2-5.2 5.2S6.4 18.3 6.4 15.4s2.3-5.2 5.2-5.2c.3 0 .7 0 1 .1v2.7a2.7 2.7 0 0 0-1-.2 2.5 2.5 0 1 0 2.5 2.5V3h2.4Z" fill="#ffffff"/>'
};

const renderSocialBadge = (platform, background) => {
    const iconSvg = SOCIAL_ICON_SVG[platform];

    if (!iconSvg) {
        return `
            <span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:999px;background:${background};color:#ffffff;font-size:12px;font-weight:700;margin:0 6px 0 0;">${escapeHtml(platform)}</span>
        `;
    }

    return `
        <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;background:${background};margin:0 6px 0 0;vertical-align:middle;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" role="img">${iconSvg}</svg>
        </span>
    `;
};

const renderEmailLayout = ({
    previewText,
    eyebrow,
    title,
    introHtml,
    bodyHtml,
    footerNote,
    hasLogo,
    headerBackground = BRAND_DARK,
    eyebrowColor = '#93c5fd',
    titleColor = '#ffffff',
    contentBackground = '#ffffff',
    fallbackBadgeBackground = 'rgba(255,255,255,0.12)',
    fallbackBadgeColor = '#ffffff'
}) => `
<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText || title)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dce8f5;box-shadow:0 18px 40px rgba(15,39,71,0.08);">
                    <tr>
                        <td style="padding:0;background:${headerBackground};">
                            <div style="height:6px;background:linear-gradient(90deg, ${BRAND_COLOR} 0%, #48b2ff 100%);"></div>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:26px 28px 18px;">
                                <tr>
                                    <td align="left" style="vertical-align:top;">
                                        ${hasLogo ? `<img src="cid:${LOGO_CID}" alt="MyTicket" style="display:block;width:128px;height:auto;margin:0 0 18px;" />` : `<div style="display:inline-block;padding:10px 16px;border-radius:999px;background:${fallbackBadgeBackground};color:${fallbackBadgeColor};font-size:20px;font-weight:700;letter-spacing:0.4px;margin:0 0 18px;">MyTicket</div>`}
                                        <div style="font-size:12px;letter-spacing:1.8px;text-transform:uppercase;color:${eyebrowColor};font-weight:700;margin:0 0 8px;">${escapeHtml(eyebrow)}</div>
                                        <div style="font-size:30px;line-height:1.25;color:${titleColor};font-weight:700;margin:0;">${escapeHtml(title)}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;background:${contentBackground};">
                            ${introHtml}
                            ${bodyHtml}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 28px 28px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND_LIGHT};border:1px solid #d8e8fb;border-radius:18px;">
                                <tr>
                                    <td style="padding:18px 20px;">
                                        <div style="font-size:14px;font-weight:700;color:${BRAND_DARK};margin:0 0 8px;">Cần hỗ trợ thêm?</div>
                                        <div style="font-size:14px;line-height:1.7;color:#334155;">
                                            Email: <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};text-decoration:none;">${SUPPORT_EMAIL}</a><br />
                                            Địa chỉ: ${SUPPORT_ADDRESS}<br />
                                            Điện thoại: ${SUPPORT_PHONE}
                                        </div>
                                        // <div style="margin:14px 0 0;">
                                        //     ${renderSocialBadge('facebook', '#1877f2')}
                                        //     ${renderSocialBadge('instagram', '#e1306c')}
                                        //     ${renderSocialBadge('youtube', '#ff0000')}
                                        //     ${renderSocialBadge('tiktok', '#111827')}
                                        // </div>
                                    </td>
                                </tr>
                            </table>
                            <div style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#64748b;text-align:center;">
                                ${footerNote ? escapeHtml(footerNote) : 'MyTicket cảm ơn bạn đã đồng hành cùng chúng tôi.'}
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const buildMailOptions = ({
    to,
    subject,
    previewText,
    eyebrow,
    title,
    introHtml,
    bodyHtml,
    footerNote,
    attachments = [],
    layoutOptions = {}
}) => {
    const finalAttachments = [...attachments];
    const logoAttachment = getLogoAttachment();

    if (logoAttachment) {
        finalAttachments.unshift(logoAttachment);
    }

    return {
        from: `"MyTicket" <${process.env.EMAIL}>`,
        to,
        subject,
        html: renderEmailLayout({
            previewText,
            eyebrow,
            title,
            introHtml,
            bodyHtml,
            footerNote,
            hasLogo: Boolean(logoAttachment),
            ...layoutOptions
        }),
        attachments: finalAttachments
    };
};

// Tạo transporter với Gmail
const transporter = nodemailer.createTransport({ 
    service: 'gmail', 
    auth: { 
        user: EMAIL,
        pass: EMAIL_PASSWORD,
}, });

export const sendAccountConfirmation = async ({cusEmail, cusName, code}) => {
  try {
    const safeName = escapeHtml(cusName);
    const safeCode = escapeHtml(code);
    const mailOptions = buildMailOptions({
        to: cusEmail,
        subject: 'Xác nhận tài khoản',
        previewText: `Mã xác minh tài khoản của bạn là ${code}`,
        eyebrow: 'Tài khoản MyTicket',
        title: 'Xác nhận tài khoản',
        introHtml: `
            <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">Xin chào <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">Cảm ơn bạn đã đăng ký tài khoản MyTicket. Vui lòng sử dụng mã xác minh bên dưới để hoàn tất quá trình kích hoạt email.</p>
        `,
        bodyHtml: `
            <div style="margin:0 0 22px;padding:20px;border-radius:20px;background:${BRAND_LIGHT};border:1px solid #d8e8fb;text-align:center;">
                <div style="font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#64748b;font-weight:700;margin:0 0 10px;">Mã xác minh</div>
                <div style="font-size:32px;line-height:1.2;font-weight:800;color:${BRAND_COLOR};letter-spacing:6px;">${safeCode}</div>
            </div>
            <div style="margin:0;padding:18px 20px;border:1px solid #e5edf7;border-radius:18px;background:#ffffff;">
                <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#334155;">Nhập mã trên vào ứng dụng để kích hoạt tài khoản.</p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#b45309;"><strong>Lưu ý:</strong> Mã OTP chỉ có hiệu lực trong 10 phút.</p>
            </div>
        `,
        footerNote: 'Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.'
    });

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
        const safeName = escapeHtml(cusName);
        const safePassword = escapeHtml(password);
        const mailOptions = buildMailOptions({
            to: cusEmail,
            subject: 'Thay đổi mật khẩu thành công',
            previewText: 'Mật khẩu tạm thời của bạn đã sẵn sàng để sử dụng',
            eyebrow: 'Bảo mật tài khoản',
            title: 'Cập nhật mật khẩu',
            introHtml: `
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">Xin chào <strong>${safeName}</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">Hệ thống đã tạo mật khẩu mới cho tài khoản MyTicket của bạn. Vui lòng đăng nhập bằng thông tin dưới đây và đổi sang mật khẩu riêng ngay sau khi đăng nhập.</p>
            `,
            bodyHtml: `
                <div style="margin:0 0 22px;padding:20px;border-radius:20px;background:${BRAND_LIGHT};border:1px solid #d8e8fb;text-align:center;">
                    <div style="font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#64748b;font-weight:700;margin:0 0 10px;">Mật khẩu tạm thời</div>
                    <div style="font-size:28px;line-height:1.35;font-weight:800;color:${BRAND_COLOR};word-break:break-word;">${safePassword}</div>
                </div>
                <div style="margin:0;padding:18px 20px;border:1px solid #e5edf7;border-radius:18px;background:#ffffff;">
                    <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#334155;">Vui lòng đăng nhập bằng mật khẩu trên và cập nhật lại mật khẩu mới để đảm bảo an toàn.</p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#b91c1c;"><strong>Lưu ý:</strong> Không chia sẻ mật khẩu này với bất kỳ ai.</p>
                </div>
            `,
            footerNote: 'MyTicket khuyến nghị bạn đổi mật khẩu ngay sau khi đăng nhập lần tiếp theo.'
        });

        // Gửi email 
        await transporter.sendMail(mailOptions);

        // service chỉ trả data
        return { success: true };
    } catch (err) {
        console.error('Lỗi trong khi gửi email mật khẩu mới:', err);
        return { success: false};
    }
    
}

export const sendBookingConfirmation = async ({
    cusEmail,
    cusName,
    eventName,
    eventDate,
    venue,
    link,
    qr,
    qrCid,
    qrFilename,
    qrContent,
    ticketEntries = []
}) => {
    try {
        const safeName = escapeHtml(cusName);
        const safeEventName = escapeHtml(eventName);
        const safeEventDate = escapeHtml(eventDate);
        const safeVenue = escapeHtml(venue);
        // Nếu có link => option 1, nếu không có link => option 2:
        // 1. Xác nhận đặt vé thành công kèm theo link vé (trg hợp vé do đối tác phát hành và có sẵn link vé)
        // 2. Xác nhận đặt vé thành công và đợi vé bên đối tác phê duyệt (thông báo đối tác sẽ gửi vé sau)
        var dynamicPart = "";
        if (ticketEntries.length > 0) {
            const ticketsHtml = ticketEntries
                .map((ticket, index) => `
                    <div style="margin:16px 0 0;padding:18px;border:1px solid #dbe7f3;border-radius:18px;background:#f8fbff;max-width:460px;">
                        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#0f172a;"><strong>Vé ${index + 1}</strong>${ticket.ticketId ? ` - ${escapeHtml(ticket.ticketId)}` : ''}</p>
                        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#475569;">${escapeHtml(ticket.seat || 'Vé tự do')}</p>
                        <p style="margin:0 0 14px;"><a href="${ticket.link}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Xem thông tin vé điện tử</a></p>
                        ${ticket.qrCid ? `<img src="cid:${ticket.qrCid}" alt="Mã QR vé ${index + 1}" style="width:200px;height:200px;display:block;"/>` : ''}
                    </div>
                `)
                .join('');

            dynamicPart = `
                <div style="margin:0 0 20px;padding:18px 20px;border:1px solid #dbe7f3;border-radius:18px;background:${BRAND_LIGHT};">
                    <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#334155;">Dưới đây là thông tin truy cập vé điện tử của bạn.</p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">Mỗi mã QR sẽ dẫn trực tiếp đến trang thông tin vé điện tử tương ứng.</p>
                </div>
                ${ticketsHtml}
            `;
        } else if (link) {
            dynamicPart =  `<div style="margin:0 0 20px;padding:18px 20px;border:1px solid #dbe7f3;border-radius:18px;background:${BRAND_LIGHT};">
                <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">Thông tin vé điện tử của bạn đã sẵn sàng.</p>
                <a href="${link}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Xem vé của bạn</a>
            </div>`;
            if (qrCid) {
                dynamicPart += `<div style="margin:0 0 16px;padding:18px;border:1px solid #dbe7f3;border-radius:18px;background:#ffffff;max-width:420px;">
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#475569;">Hoặc bạn có thể quét mã QR dưới đây để truy cập vé nhanh hơn.</p>
                    <img src="cid:${qrCid}" alt="Mã QR vé" style="width:200px;height:200px;display:block;"/>
                </div>`;
            } else if (qr) {
                dynamicPart += `<div style="margin:0 0 16px;padding:18px;border:1px solid #dbe7f3;border-radius:18px;background:#ffffff;max-width:420px;">
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#475569;">Hoặc bạn có thể quét mã QR dưới đây để truy cập vé nhanh hơn.</p>
                    <img src="${qr}" alt="Mã QR vé" style="width:200px;height:200px;display:block;"/>
                </div>`;
            }
        } else        
            dynamicPart =   `<div style="margin:0 0 20px;padding:18px 20px;border:1px solid #fde68a;border-radius:18px;background:#fff7d6;">
                <p style="margin:0;font-size:15px;line-height:1.7;color:#92400e;">Thông tin vé của bạn sẽ được ban tổ chức gửi sau.</p>
            </div>`;   

        const attachments = [];

        for (const ticket of ticketEntries) {
            if (ticket.qrCid && ticket.qrContent) {
                attachments.push({
                    filename: ticket.qrFilename || `${ticket.ticketId || 'ticket'}.png`,
                    content: ticket.qrContent,
                    cid: ticket.qrCid,
                    contentType: 'image/png',
                    disposition: 'inline'
                });
            }
        }

        if (!attachments.length && qrCid && qrContent) {
            attachments.push({
                filename: qrFilename || 'ticket-qr.png',
                content: qrContent,
                cid: qrCid,
                contentType: 'image/png',
                disposition: 'inline'
            });
        }

        const mailOptions = buildMailOptions({
            to: cusEmail,
            subject: 'Xác nhận đặt vé thành công',
            previewText: `Vé của bạn cho sự kiện ${eventName} đã sẵn sàng`,
            eyebrow: 'Vé điện tử MyTicket',
            title: 'Đặt vé thành công',
            introHtml: `
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#eff6ff;">Xin chào <strong>${safeName}</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#dbeafe;">Cảm ơn bạn đã đặt vé qua MyTicket. Đơn hàng của bạn đã được ghi nhận thành công.</p>
                <div style="margin:0 0 22px;padding:18px 20px;border:1px solid #dbe7f3;border-radius:18px;background:${BRAND_LIGHT};">
                    <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;font-weight:700;margin:0 0 10px;">Thông tin sự kiện</div>
                    <div style="font-size:20px;line-height:1.4;font-weight:700;color:${BRAND_DARK};margin:0 0 8px;">${safeEventName}</div>
                    <div style="font-size:14px;line-height:1.7;color:#475569;">Thời gian: ${safeEventDate}</div>
                    <div style="font-size:14px;line-height:1.7;color:#475569;">Địa điểm: ${safeVenue}</div>
                </div>
            `,
            bodyHtml: `${dynamicPart}`,
            footerNote: 'Vui lòng lưu giữ email này để sử dụng khi cần kiểm tra thông tin vé.',
            attachments,
            layoutOptions: {
                headerBackground: '#ffffff',
                eyebrowColor: BRAND_COLOR,
                titleColor: ACCENT_RED,
                contentBackground: BRAND_DARK,
                fallbackBadgeBackground: BRAND_DARK,
                fallbackBadgeColor: '#ffffff'
            }
        });
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('Lỗi trong khi gửi email xác nhận đặt vé:', err);
        return { success: false};
    }
};

export const sendInvoiceReceipt = async ({ cusEmail, cusName, invoiceNumber, invoiceDate, amount }) => {
    try {
        const safeName = escapeHtml(cusName);
        const safeInvoiceNumber = escapeHtml(invoiceNumber);
        const safeInvoiceDate = escapeHtml(invoiceDate);
        const safeAmount = escapeHtml(amount);
        const mailOptions = buildMailOptions({
            to: cusEmail,
            subject: 'Hóa đơn thanh toán',
            previewText: `Hóa đơn ${invoiceNumber} đã sẵn sàng`,
            eyebrow: 'Tài chính giao dịch',
            title: 'Hóa đơn thanh toán',
            introHtml: `
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">Xin chào <strong>${safeName}</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">Đây là hóa đơn cho giao dịch của bạn trên MyTicket.</p>
            `,
            bodyHtml: `
                <div style="padding:20px;border:1px solid #dbe7f3;border-radius:18px;background:${BRAND_LIGHT};">
                    <div style="font-size:14px;line-height:1.8;color:#334155;"><strong>Số hóa đơn:</strong> ${safeInvoiceNumber}</div>
                    <div style="font-size:14px;line-height:1.8;color:#334155;"><strong>Ngày phát hành:</strong> ${safeInvoiceDate}</div>
                    <div style="font-size:14px;line-height:1.8;color:#334155;"><strong>Số tiền:</strong> ${safeAmount}</div>
                </div>
            `,
            footerNote: 'Vui lòng lưu email này để đối chiếu khi cần.'
        });

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('Lỗi trong khi gửi email hóa đơn:', err);
        return { success: false };
    }
};

export const sendEventUpdate = async ({ cusEmail, cusName, eventName, updateContent }) => {
    try {
        const safeName = escapeHtml(cusName);
        const safeEventName = escapeHtml(eventName);
        const safeUpdateContent = escapeHtml(updateContent);
        const mailOptions = buildMailOptions({
            to: cusEmail,
            subject: `Cập nhật sự kiện: ${eventName}`,
            previewText: `Có thông báo mới về sự kiện ${eventName}`,
            eyebrow: 'Thông báo sự kiện',
            title: 'Cập nhật mới nhất',
            introHtml: `
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">Xin chào <strong>${safeName}</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">Chúng tôi có một cập nhật quan trọng liên quan đến sự kiện <strong>${safeEventName}</strong>.</p>
            `,
            bodyHtml: `
                <div style="padding:20px;border:1px solid #dbe7f3;border-radius:18px;background:${BRAND_LIGHT};font-size:15px;line-height:1.8;color:#334155;">
                    ${safeUpdateContent}
                </div>
            `,
            footerNote: 'Vui lòng theo dõi email để không bỏ lỡ thông báo quan trọng từ sự kiện.'
        });
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
        const safeName = escapeHtml(cusName);
        const safeEventName = escapeHtml(eventName);
        const safeVenue = escapeHtml(venue);
        const safeReminderType = escapeHtml(reminderType);
        const eventDateText = `${eventDate.getDate()} tháng ${eventDate.getMonth() + 1} năm ${eventDate.getFullYear()}`;
        const mailOptions = buildMailOptions({
            to: cusEmail,
            subject: `Nhắc nhở còn ${reminderType} ngày nữa đến sự kiện ${eventName}`,
            previewText: `Sự kiện ${eventName} sắp diễn ra`,
            eyebrow: 'Nhắc nhở tham gia',
            title: 'Sự kiện sắp bắt đầu',
            introHtml: `
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">Xin chào <strong>${safeName}</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">Đây là email nhắc nhở rằng bạn chỉ còn <strong>${safeReminderType}</strong> ngày nữa là đến sự kiện đã đăng ký.</p>
            `,
            bodyHtml: `
                <div style="padding:20px;border:1px solid #dbe7f3;border-radius:18px;background:${BRAND_LIGHT};">
                    <div style="font-size:20px;line-height:1.5;font-weight:700;color:${BRAND_DARK};margin:0 0 8px;">${safeEventName}</div>
                    <div style="font-size:14px;line-height:1.8;color:#334155;"><strong>Ngày diễn ra:</strong> ${escapeHtml(eventDateText)}</div>
                    <div style="font-size:14px;line-height:1.8;color:#334155;"><strong>Địa điểm:</strong> ${safeVenue}</div>
                </div>
            `,
            footerNote: 'Hẹn gặp bạn tại sự kiện cùng MyTicket.'
        });
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('Lỗi khi gửi email nhắc nhở sự kiện:', err);
        return { success: false };
    }
};

export const sendRefundNotification = async ({ cusEmail, cusName, eventName, amount }) => {
    try {
        const safeName = escapeHtml(cusName);
        const safeEventName = escapeHtml(eventName);
        const safeAmount = escapeHtml(amount);
        const mailOptions = buildMailOptions({
            to: cusEmail,
            subject: `Thông báo hoàn tiền - ${eventName}`,
            previewText: `Yêu cầu hoàn tiền cho sự kiện ${eventName} đã được duyệt`,
            eyebrow: 'Hỗ trợ giao dịch',
            title: 'Thông báo hoàn tiền',
            introHtml: `
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">Xin chào <strong>${safeName}</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">Yêu cầu hoàn tiền của bạn cho sự kiện <strong>${safeEventName}</strong> đã được phê duyệt.</p>
            `,
            bodyHtml: `
                <div style="padding:20px;border:1px solid #dbe7f3;border-radius:18px;background:${BRAND_LIGHT};">
                    <div style="font-size:14px;line-height:1.8;color:#334155;"><strong>Số tiền hoàn lại:</strong> ${safeAmount}</div>
                    <div style="font-size:14px;line-height:1.8;color:#334155;">Khoản tiền sẽ được chuyển về tài khoản của bạn trong vài ngày tới.</div>
                </div>
            `,
            footerNote: 'Rất tiếc vì trải nghiệm chưa như mong đợi. Cảm ơn bạn đã tiếp tục đồng hành cùng MyTicket.'
        });
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('Lỗi khi gửi email hoàn tiền:', err);
        return { success: false };
    }
};

export const sendPostEventSurvey = async ({ cusEmail, cusName, eventName, surveyLink }) => {
    try {
        const safeName = escapeHtml(cusName);
        const safeEventName = escapeHtml(eventName);
        const safeSurveyLink = escapeHtml(surveyLink);
        const mailOptions = buildMailOptions({
            to: cusEmail,
            subject: `Khảo sát sau sự kiện - ${eventName}`,
            previewText: `Chia sẻ cảm nhận của bạn về sự kiện ${eventName}`,
            eyebrow: 'Phản hồi khách hàng',
            title: 'Thư mời khảo sát',
            introHtml: `
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">Xin chào <strong>${safeName}</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">Cảm ơn bạn đã tham gia sự kiện <strong>${safeEventName}</strong>. Ý kiến của bạn sẽ giúp MyTicket và ban tổ chức nâng cao chất lượng trải nghiệm trong những sự kiện tiếp theo.</p>
            `,
            bodyHtml: `
                <div style="padding:20px;border:1px solid #dbe7f3;border-radius:18px;background:${BRAND_LIGHT};text-align:left;">
                    <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#334155;">Vui lòng dành ít phút để hoàn thành bảng khảo sát dưới đây:</p>
                    <a href="${safeSurveyLink}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Tham gia khảo sát</a>
                </div>
            `,
            footerNote: 'Cảm ơn bạn đã dành thời gian đóng góp ý kiến cho MyTicket.'
        });
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.error('Lỗi khi gửi email khảo sát:', err);
        return { success: false };
    }
};
