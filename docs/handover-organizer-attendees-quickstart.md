# Quick Start Checklist - Organizer Attendees API

Mục tiêu: giúp BE dev mới nắm và chạy nhanh chức năng xem/tải danh sách khách mua vé theo từng event organizer.

## 1) Điểm vào chính
- Route mới: `GET /api/organizer/:id/events/:eventId/attendees`
- File route: `BE/routes/organizerRoutes.js`
- File controller: `BE/controllers/organizerController.js`
- Tên handler: `getEventAttendeesForOrganizer`

## 2) Auth & phân quyền
- Bắt buộc `Authorization: Bearer <token>` (middleware `verifyToken`).
- Chỉ cho role `organizer` hoặc `admin`.
- Nếu role `organizer`: chỉ xem event thuộc organizer của chính user đó.

## 3) Luồng dữ liệu BE
1. Validate token + role.
2. Verify `organizerId` tồn tại.
3. Verify `eventId` thuộc `organizerId`.
4. Query `Purchase` theo `{ event: eventId, paymentStatus: 'paid' }`.
5. Populate:
   - `user`: `firstName lastName email phoneNumber`
   - `ticketClass`: `name price seatType`
6. Query `Ticket` theo `purchase in purchaseIds`.
7. Group theo purchase và flatten thành `attendees[]` (1 ticket = 1 row).

## 4) Output FE đang dùng
```json
{
  "event": { "_id": "...", "title": "...", "startDateTime": "...", "endDateTime": "..." },
  "totalRows": 0,
  "attendees": [
    {
      "key": "...",
      "purchaseId": "...",
      "customerName": "...",
      "customerEmail": "...",
      "customerPhone": "...",
      "ticketId": "...",
      "ticketClassName": "...",
      "seat": "...",
      "seatType": "general|reserved",
      "ticketPrice": 0,
      "quantity": 0,
      "totalAmount": 0,
      "paymentMethod": "Momo|BankTransfer|CreditCard",
      "paymentStatus": "paid",
      "purchasedAt": "..."
    }
  ]
}
```

## 5) FE tiêu thụ API ở đâu
- `FE/src/pages/organizer/EventInforPage/index.tsx`
- Hàm gọi API: `openAttendeeModal(event)`
- Endpoint FE gọi: `/api/organizer/${organizerId}/events/${event._id}/attendees`

## 6) Test nhanh bằng Postman
1. Lấy token organizer hợp lệ.
2. Gọi `GET /api/organizer/me` để lấy `organizerId`.
3. Gọi `GET /api/organizer/:id/events` để lấy `eventId`.
4. Gọi `GET /api/organizer/:id/events/:eventId/attendees`.
5. Kỳ vọng:
   - 200 + `attendees[]` nếu có data paid.
   - 200 + `attendees: []` nếu chưa có khách paid.

## 7) Các lỗi thường gặp
- `401`: token hết hạn/không hợp lệ.
- `403`: organizer truy cập dữ liệu không thuộc quyền.
- `404`: organizer hoặc event không tồn tại/không thuộc organizer.
- `500`: lỗi query/logic server.

## 8) Tài liệu chi tiết
- Xem bản đầy đủ: `docs/handover-organizer-attendees-flow.md`
