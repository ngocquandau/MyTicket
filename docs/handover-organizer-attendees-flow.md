# Handover: Chức năng xem/tải danh sách khách hàng mua vé theo từng sự kiện (Organizer)

## 1) Mục tiêu chức năng
Cho phép tài khoản `organizer`:
- Mở danh sách khách hàng đã mua vé của **một sự kiện cụ thể** do mình tổ chức.
- Xem trực tiếp dạng bảng trong FE.
- Tải danh sách ra file `CSV` hoặc `PDF`.

Phạm vi này dùng dữ liệu thanh toán thành công (`paymentStatus = paid`).

---

## 2) API đang dùng

### 2.1 API mới (chuyên biệt cho chức năng này)
- **Method:** `GET`
- **URL:** `/api/organizer/:id/events/:eventId/attendees`
- **Auth:** `verifyToken` (Bearer token)
- **Mục đích:** Trả dữ liệu danh sách khách đã mua vé theo event của organizer.

### 2.2 API nền liên quan (đã có sẵn)
- `GET /api/organizer/me`  
  Dùng để lấy `organizerId` theo token user hiện tại.
- `GET /api/organizer/:id/events`  
  Dùng để lấy danh sách event thuộc organizer.
- `GET /api/event?search=...`  
  Dùng cho tìm kiếm event theo từ khóa tại màn organizer (FE lọc lại theo event của organizer).

---

## 3) Vị trí code

## BE
- Route: `BE/routes/organizerRoutes.js`
  - Added: `router.get('/:id/events/:eventId/attendees', verifyToken, getEventAttendeesForOrganizer)`
- Controller: `BE/controllers/organizerController.js`
  - Added function: `getEventAttendeesForOrganizer`

## FE
- Page: `FE/src/pages/organizer/EventInforPage/index.tsx`
  - `openAttendeeModal(...)` gọi API mới để lấy attendees.
  - `exportAttendeesCsv()` xuất file CSV.
  - `exportAttendeesPdf()` xuất file PDF.

---

## 4) Luồng chạy end-to-end

1. Organizer mở trang Event Information.
2. FE gọi `GET /api/organizer/me` để lấy `organizerId`.
3. FE gọi `GET /api/organizer/:id/events` để hiển thị danh sách sự kiện.
4. Organizer bấm icon danh sách khách ở cột `Action` của một event.
5. FE gọi `GET /api/organizer/:id/events/:eventId/attendees`.
6. BE xác thực quyền, kiểm tra event có thuộc organizer không.
7. BE tổng hợp từ `Purchase + Ticket + User + TicketClass` và trả về `attendees[]`.
8. FE render table trong modal + cho phép export CSV/PDF.

---

## 5) Quy tắc phân quyền

Trong `getEventAttendeesForOrganizer`:
- Nếu chưa đăng nhập/token sai -> `401`.
- Chỉ cho `organizer` hoặc `admin`.
- Nếu role `organizer` nhưng không phải organizer sở hữu dữ liệu (`organizer.user !== req.user.id`) -> `403`.
- Nếu event không thuộc organizer `:id` -> `404`.

---

## 6) Input / Output chi tiết

### 6.1 Request
- Path params:
  - `id`: Organizer ID.
  - `eventId`: Event ID cần lấy danh sách khách.
- Header:
  - `Authorization: Bearer <token>`

### 6.2 Response success
```json
{
  "event": {
    "_id": "...",
    "title": "...",
    "startDateTime": "2026-...",
    "endDateTime": "2026-..."
  },
  "totalRows": 3,
  "attendees": [
    {
      "key": "GEN-...",
      "purchaseId": "...",
      "customerName": "NGUYEN VAN A",
      "customerEmail": "a@example.com",
      "customerPhone": "090...",
      "ticketId": "GEN-...",
      "ticketClassName": "VIP",
      "seat": "A12",
      "seatType": "reserved",
      "ticketPrice": 500000,
      "quantity": 2,
      "totalAmount": 1000000,
      "paymentMethod": "Momo",
      "paymentStatus": "paid",
      "purchasedAt": "2026-..."
    }
  ]
}
```

### 6.3 Trường hợp không có dữ liệu
```json
{
  "event": { "_id": "...", "title": "..." },
  "totalRows": 0,
  "attendees": []
}
```

### 6.4 Error codes chính
- `401` Unauthorized
- `403` Forbidden
- `404` Organizer hoặc Event không tồn tại/không thuộc organizer
- `500` Lỗi server

---

## 7) Cách BE tổng hợp dữ liệu

Controller `getEventAttendeesForOrganizer`:
1. Query `Purchase` theo `{ event: eventId, paymentStatus: 'paid' }`.
2. Populate:
   - `user`: `firstName lastName email phoneNumber`
   - `ticketClass`: `name price seatType`
3. Lấy danh sách `purchaseIds`.
4. Query `Ticket` theo `purchase in purchaseIds` AND `isSold: true` (chỉ lấy những vé đã được mark là bán). Controller hiện chọn thêm trường `isSold` để rõ trạng thái.
5. Group ticket theo `purchase`.
6. Flatten thành `attendees[]`:
   - Mỗi ticket = 1 dòng.
   - Nếu purchase không có ticket record thì tạo fallback row (`ticketId`, `seat` rỗng).

Lưu ý:
- Vì controller bây giờ chỉ lấy `Ticket` với `isSold: true`, trường hợp một `Purchase` có `paymentStatus = 'paid'` nhưng ticket chưa được tạo hoặc chưa được mark `isSold` sẽ không xuất hiện trong nhóm ticket và sẽ được trả dưới dạng fallback row (ticketId/seat rỗng).
- FE nên hiển thị cảnh báo/chuẩn hóa khi `seat` hoặc `ticketId` rỗng để organizer biết có inconsistency trong pipeline tạo vé.

---

## 8) Định dạng dữ liệu FE đang kỳ vọng

`AttendeeRow` tại FE:
- `key: string`
- `customerName: string`
- `customerEmail: string`
- `customerPhone: string`
- `ticketId: string`
- `ticketClassName: string`
- `seat: string`
- `seatType: string`
- `ticketPrice: number`
- `paymentMethod: string`
- `purchasedAt: string` (FE format `toLocaleString('vi-VN')`)

Lưu ý:
- FE chấp nhận giá trị thiếu bằng `'—'` khi map dữ liệu.
- FE sort theo `customerName` trước khi render.

---

## 9) Export file (CSV/PDF)

### CSV
- Tạo từ `attendeeRows` ở FE.
- Có BOM `\uFEFF` để hỗ trợ UTF-8 tốt hơn.
- Tên file được chuẩn hóa:  
  `DANH_SACH_KHACH_HANG_<TEN_SU_KIEN_KHONG_DAU_IN_HOA>.csv`

### PDF
- Dùng `jspdf` + `jspdf-autotable` ở FE.
- Tiêu đề PDF dạng không dấu/in hoa để tránh lỗi font/encoding:  
  `DANH SACH KHACH HANG - <TEN_SU_KIEN_KHONG_DAU_IN_HOA>`
- Tên file:  
  `DANH_SACH_KHACH_HANG_<TEN_SU_KIEN_KHONG_DAU_IN_HOA>.pdf`

---

## 10) Ghi chú triển khai tiếp theo (nếu cần)

1. Nếu dataset lớn, cân nhắc thêm pagination server-side cho endpoint attendees.
2. Nếu cần export chuẩn kế toán, có thể thêm endpoint BE trả file trực tiếp (CSV/PDF), FE chỉ gọi download.
3. Có thể bổ sung filter theo `paymentMethod`, date range, ticketClass ở level BE.
4. Nếu muốn thống nhất i18n, chuẩn hóa ngôn ngữ field/label giữa BE response và FE mapping.
