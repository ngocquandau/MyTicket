# Handover thay đổi link QR khi deploy

## Mục tiêu

Tài liệu này mô tả:

- QR hiện đang lấy domain từ đâu
- Khi deploy website thì cần đổi ở đâu
- File nào đang dùng chung cấu hình này
- Sau khi đổi thì ảnh hưởng đến những phần nào trong hệ thống

## 1. Link QR hiện được tạo từ đâu

Trong backend, link dùng cho QR vé điện tử được tạo ở file:

- `BE/controllers/purchaseController.js`

Đoạn quyết định domain hiện tại là:

```js
const getFrontendBaseUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';
```

Sau đó link vé điện tử được build bằng:

```js
const buildTicketInfoUrl = (ticketId) => `${getFrontendBaseUrl()}/ticket-info/${encodeURIComponent(ticketId)}`;
```

Nghĩa là:

- nếu có `FRONTEND_URL` trong environment variables thì hệ thống dùng giá trị đó
- nếu không có thì tự fallback về `http://localhost:3000`

Do đó nếu hiện tại QR quét ra `localhost`, nguyên nhân là backend đang chưa được cấu hình `FRONTEND_URL` cho môi trường deploy.

## 2. Cần đổi ở đâu khi deploy

Khi deploy, bạn không cần sửa trực tiếp code nếu chỉ muốn đổi domain.

Bạn chỉ cần cập nhật biến môi trường của backend:

```env
FRONTEND_URL=https://ten-mien-frontend-cua-ban.com
```

Ví dụ:

```env
FRONTEND_URL=https://myticket.vercel.app
```

hoặc:

```env
FRONTEND_URL=https://myticket.com
```

Sau khi cập nhật biến môi trường, cần restart backend để giá trị mới được áp dụng.

## 3. Những phần nào sẽ bị ảnh hưởng sau khi đổi `FRONTEND_URL`

### 3.1 QR trong email vé điện tử

File dùng:

- `BE/controllers/purchaseController.js`

QR trong email được tạo từ link:

```txt
${FRONTEND_URL}/ticket-info/:ticketId
```

Nghĩa là sau khi đổi `FRONTEND_URL`, người dùng quét QR trong email sẽ vào đúng domain mới.

### 3.2 Link trong email vé điện tử

File dùng:

- `BE/controllers/purchaseController.js`
- `BE/services/emailService.js`

Link “Xem thông tin vé điện tử” trong email cũng dùng cùng link được build từ `FRONTEND_URL`.

Nghĩa là:

- đổi `FRONTEND_URL`
- link trong email cũng đổi theo

### 3.3 Ảnh QR tải về từ “Vé của tôi”

File dùng:

- `BE/controllers/purchaseController.js`

API tải QR cũng tạo QR từ cùng helper `buildTicketInfoUrl(ticketId)`.

Nghĩa là QR tải về máy cũng sẽ trỏ tới domain frontend mới.

### 3.4 Link quay về từ PayOS

File dùng:

- `BE/controllers/paymentController.js`

Trong file này đang có:

```js
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
```

và dùng để tạo:

- `cancelUrl`
- `returnUrl`

Nghĩa là cùng một biến `FRONTEND_URL` hiện đang ảnh hưởng cả:

- QR email
- link email
- QR tải về
- luồng trả về của PayOS

## 4. Có cần lưu data gì mới khi đổi link không

Không.

Hiện tại link QR không được lưu cố định trong database.

Hệ thống chỉ lưu dữ liệu gốc như:

- `ticketId`
- `purchase`
- `ticketClass`

Khi cần tạo QR hoặc link vé điện tử, backend sẽ dựng lại URL từ:

- `FRONTEND_URL`
- `ticketId`

Nghĩa là:

- không cần migration database
- không cần cập nhật lại các vé cũ trong DB
- chỉ cần đổi environment variable và restart backend

## 5. Quy trình thay đổi link QR khi deploy

### Bước 1

Cập nhật environment variable của backend:

```env
FRONTEND_URL=https://domain-moi-cua-frontend.com
```

### Bước 2

Restart backend service.

### Bước 3

Kiểm tra lại:

1. Tạo một đơn hàng mới
2. Mở email xác nhận vé
3. Bấm link trong email
4. Quét QR trong email
5. Tải QR từ trang “Vé của tôi” rồi quét thử
6. Thanh toán qua PayOS để kiểm tra `returnUrl` và `cancelUrl`

## 6. Kết luận

Nếu sau này website được deploy và QR vẫn ra `localhost`, chỗ cần cập nhật là biến môi trường backend:

- `FRONTEND_URL`

Không cần sửa logic QR ở nhiều nơi, vì hiện tại các phần sau đều đang dùng chung biến này:

- `BE/controllers/purchaseController.js`
- `BE/controllers/paymentController.js`

Vì vậy, đây là điểm cấu hình trung tâm để đổi domain cho:

- QR vé điện tử
- link vé trong email
- link trả về từ PayOS