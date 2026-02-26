# Bàn giao BE - Chức năng QR vé (Tải về + Quét mã)

## 1) Mục tiêu chức năng
- Cho phép người mua vé tải ảnh QR theo từng vé.
- Cho phép check-in/quét QR để mở trang thông tin vé điện tử (public).
- Cho phép hệ thống scanner/app khác lấy thông tin vé ở dạng JSON public.

---

## 2) Luồng chạy end-to-end

### Luồng A - Người dùng tải ảnh QR từ trang Vé của tôi
1. FE gọi `GET /api/purchases/my-tickets` (có token) để lấy danh sách vé đã thanh toán.
2. User bấm nút **QR thông tin vé** -> mở modal hiển thị QR.
3. User bấm **Tải QR** trên từng vé.
4. FE gọi `GET /api/purchases/tickets/:ticketId/qr-image` (có token).
5. BE xác thực quyền (chủ vé hoặc admin), tạo PNG QR và trả file để FE tải xuống.

### Luồng B - Quét QR để xem bảng thông tin vé điện tử
1. Nội dung QR là URL public:
   - `/api/purchases/tickets/:ticketId/public-image`
2. Thiết bị scanner mở URL trên.
3. BE trả về HTML bảng thông tin vé điện tử (không cần token).
4. Bảng hiển thị: mã vé, sự kiện, người mua, liên hệ, thời gian, địa điểm, chỗ ngồi, tổng tiền, ngày mua.

### Luồng C - Quét QR lấy JSON (cho app scanner tích hợp)
1. App scanner gọi:
   - `GET /api/purchases/tickets/:ticketId/public`
2. BE trả JSON thông tin vé + payment + buyer.

---

## 3) Danh sách API liên quan

## 3.1 GET /api/purchases/my-tickets
### Công dụng
- Lấy danh sách vé đã thanh toán của user hiện tại để FE hiển thị trang Vé của tôi.

### Auth
- Bắt buộc Bearer token.

### Request
- Header: `Authorization: Bearer <token>`
- Không có body.

### Response thành công (200)
- Mảng purchase đã populate event, ticketClass, ticketList.

Ví dụ rút gọn:
```json
[
  {
    "_id": "67b1...",
    "paymentStatus": "paid",
    "quantity": 2,
    "totalAmount": 200000,
    "event": {
      "_id": "67a9...",
      "title": "AAAAA",
      "startDateTime": "2025-12-05T00:00:00.000Z",
      "posterURL": "https://...",
      "location": { "address": "Nhà hát Bến Thành..." }
    },
    "ticketClass": {
      "name": "Vé tự do",
      "price": 100000,
      "seatType": "general"
    },
    "ticketList": [
      { "seat": "VIP - Tự do", "ticketId": "T-1765031215215-273" }
    ]
  }
]
```

### Error
- `401`: token thiếu/hết hạn/không hợp lệ.
- `500`: lỗi server.

---

## 3.2 GET /api/purchases/tickets/:ticketId/qr-image
### Công dụng
- Tạo ảnh QR PNG cho 1 vé để người dùng tải về.

### Auth
- Bắt buộc Bearer token.
- Quyền: chỉ **chủ vé** hoặc **admin**.

### Request
- Path param: `ticketId`.
- Header: `Authorization: Bearer <token>`.

### Response thành công (200)
- Header:
  - `Content-Type: image/png`
  - `Content-Disposition: attachment; filename="ticket-<ticketId>.png"`
- Body: binary PNG.

### Error
- `404`: không tìm thấy vé.
- `400`: vé chưa thanh toán.
- `403`: user không có quyền tải QR của vé này.
- `500`: lỗi server.

---

## 3.3 GET /api/purchases/tickets/:ticketId/public-image
### Công dụng
- Endpoint public cho luồng quét QR check-in, trả trang HTML thông tin vé điện tử.

### Auth
- Không yêu cầu token.

### Request
- Path param: `ticketId`.

### Response thành công (200)
- Header: `Content-Type: text/html; charset=utf-8`
- Body: HTML bảng vé điện tử.

### Dữ liệu hiển thị chính
- Mã vé
- Sự kiện
- Người mua
- Liên hệ (email | phone)
- Thời gian
- Địa điểm
- Chỗ ngồi
- Tổng tiền
- Ngày mua

### Error
- `404`: ticket không tồn tại hoặc chưa thanh toán.
- `500`: lỗi server.

---

## 3.4 GET /api/purchases/tickets/:ticketId/public
### Công dụng
- Endpoint public trả JSON cho app scanner/đối tác tích hợp.

### Auth
- Không yêu cầu token.

### Request
- Path param: `ticketId`.

### Response thành công (200)
Ví dụ:
```json
{
  "ticketId": "T-1765031215215-273",
  "seat": "VIP - Tự do",
  "seatType": "general",
  "ticketClass": {
    "name": "Vé tự do",
    "price": 100000
  },
  "event": {
    "_id": "67a9...",
    "title": "AAAAA",
    "startDateTime": "2025-12-05T00:00:00.000Z",
    "location": {
      "address": "Nhà hát Bến Thành, 6 Mạc Đĩnh Chi, ..."
    }
  },
  "payment": {
    "status": "paid",
    "method": "Momo",
    "quantity": 2,
    "totalAmount": 200000,
    "purchasedAt": "2025-12-14T22:19:10.000Z"
  },
  "buyer": {
    "name": "Nguyễn Văn A",
    "email": "a.nguyen@email.com",
    "phoneNumber": "0901234567"
  }
}
```

### Error
- `404`: không tìm thấy vé.
- `403`: vé chưa thanh toán hoặc không hợp lệ.
- `500`: lỗi server.

---

## 4) Ví dụ gọi API (curl)

### 4.1 Lấy vé của tôi
```bash
curl -X GET "http://localhost:3000/api/purchases/my-tickets" \
  -H "Authorization: Bearer <USER_TOKEN>"
```

### 4.2 Tải ảnh QR
```bash
curl -X GET "http://localhost:3000/api/purchases/tickets/T-1765031215215-273/qr-image" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  --output ticket-T-1765031215215-273.png
```

### 4.3 Mở bảng vé điện tử (public HTML)
```bash
curl -X GET "http://localhost:3000/api/purchases/tickets/T-1765031215215-273/public-image"
```

### 4.4 Lấy JSON public cho scanner app
```bash
curl -X GET "http://localhost:3000/api/purchases/tickets/T-1765031215215-273/public"
```

---

## 5) Error matrix (tóm tắt)
| API | 400 | 401 | 403 | 404 | 500 |
|---|---|---|---|---|---|
| GET /my-tickets | - | Có | - | - | Có |
| GET /tickets/:ticketId/qr-image | Có (chưa paid) | Có | Có (không quyền) | Có | Có |
| GET /tickets/:ticketId/public-image | - | - | - | Có | Có |
| GET /tickets/:ticketId/public | - | - | Có (chưa paid) | Có | Có |

---

## 6) Cấu hình quan trọng
- `PUBLIC_API_BASE_URL` phải là domain/IP có thể truy cập từ thiết bị quét QR.
- Không dùng `localhost` nếu quét bằng điện thoại/máy khác.

---

## 7) Ghi chú kỹ thuật cho BE kế nhiệm
- QR-image hiện encode URL tới `public-image`.
- Public endpoints dựa trên `ticketId` và trạng thái thanh toán (`paid`).
- Dữ liệu người mua lấy qua quan hệ `purchase.user` (populate user trong purchase).
- Không phụ thuộc vào các API User riêng để render bảng vé điện tử.

---

## 8) Checklist bàn giao nhanh
- [ ] Kiểm tra quyền tải QR: user thường không tải được vé của user khác.
- [ ] Kiểm tra vé `pending` không tải được QR.
- [ ] Kiểm tra quét QR mở đúng public-image trên thiết bị ngoài LAN/domain.
- [ ] Kiểm tra JSON public có đầy đủ `buyer`.
- [ ] Kiểm tra nội dung bảng điện tử không tràn khi text dài.
