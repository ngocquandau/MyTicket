# Handover cấu hình domain public cho link vé điện tử, QR email và PayOS

## 1. Mục tiêu tài liệu

Tài liệu này chỉ tập trung vào một việc: khi deploy hoặc đổi domain, cần cập nhật ở đâu để các link public sau cùng trỏ đúng môi trường mới.

Các phạm vi bị ảnh hưởng:

- QR preview trong `Vé của tôi`
- QR PNG tải từ backend
- link và QR trong email xác nhận vé
- `returnUrl` và `cancelUrl` của PayOS

## 2. Tổng quan nhanh

Hiện tại có **2 lớp cấu hình domain frontend**:

### Backend

Biến dùng chính:

```env
FRONTEND_URL=https://your-frontend-domain.com
```

Được dùng tại:

- `BE/controllers/purchaseController.js`
- `BE/controllers/paymentController.js`

### Frontend

Biến dùng cho modal `Vé của tôi`:

```env
REACT_APP_FRONTEND_URL=https://your-frontend-domain.com
```

Được dùng tại:

- `FE/src/pages/client/MyTicketsPage/index.tsx`

## 3. Cụ thể từng file đang lấy domain từ đâu

## 3.1 `BE/controllers/purchaseController.js`

Implementation hiện tại:

```js
const DEFAULT_FRONTEND_URL = 'https://mticket.vercel.app';
const getFrontendBaseUrl = () => (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(/\/$/, '');
```

Domain này được dùng để build link public vé tại helper:

```js
const buildTicketInfoUrl = (ticketId, ticketRef) => (
    `${getFrontendBaseUrl()}/ticket-info/${encodeURIComponent(buildTicketPublicToken(ticketId, ticketRef))}`
);
```

Ảnh hưởng tới:

- QR trong email xác nhận vé
- link trong email xác nhận vé
- QR PNG tải về từ API `GET /api/purchases/tickets/:ticketId/qr-image`

## 3.2 `BE/controllers/paymentController.js`

Implementation hiện tại:

```js
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
```

Domain này được dùng trong:

```js
cancelUrl: `${FRONTEND_URL}/payment-result?resultCode=cancel&orderId=${purchase._id}`,
returnUrl: `${FRONTEND_URL}/payment-result?resultCode=0&orderId=${purchase._id}`,
```

Ảnh hưởng tới:

- người dùng quay về frontend sau khi PayOS xử lý xong

Ghi chú quan trọng:

- fallback của file này là `http://localhost:3000`
- fallback của `purchaseController.js` lại là `https://mticket.vercel.app`

Nghĩa là nếu production không cấu hình `FRONTEND_URL`, các luồng có thể lệch domain nhau.

## 3.3 `FE/src/pages/client/MyTicketsPage/index.tsx`

Implementation hiện tại:

```ts
const configuredFrontendUrl = process.env.REACT_APP_FRONTEND_URL;
const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const fallbackPublicFrontend = 'https://mticket.vercel.app';
const baseUrl = configuredFrontendUrl || (isLocalhost ? fallbackPublicFrontend : window.location.origin);
```

Domain này được dùng để build link cho:

- QR preview bằng `antd` trong modal `Vé của tôi`
- cảnh báo nếu QR hiện đang trỏ về `localhost`

Ảnh hưởng tới:

- QR hiển thị trên màn hình frontend
- không ảnh hưởng trực tiếp đến QR PNG backend hoặc QR email

## 4. Khi deploy cần cập nhật gì

### Bắt buộc ở backend

```env
FRONTEND_URL=https://domain-frontend-moi.com
```

Ví dụ:

```env
FRONTEND_URL=https://mticket.vn
```

Sau khi cập nhật:

- restart backend service

### Nên cập nhật ở frontend để đồng bộ modal `Vé của tôi`

```env
REACT_APP_FRONTEND_URL=https://domain-frontend-moi.com
```

Sau khi cập nhật:

- rebuild/redeploy frontend

## 5. Mapping ảnh hưởng theo biến môi trường

### `FRONTEND_URL`

Ảnh hưởng trực tiếp tới:

1. QR trong email
2. Link trong email
3. QR PNG tải về từ backend
4. `returnUrl` và `cancelUrl` của PayOS

### `REACT_APP_FRONTEND_URL`

Ảnh hưởng trực tiếp tới:

1. QR preview trong modal `Vé của tôi`
2. link public FE tự build tại client nếu có dùng helper `buildTicketInfoUrl(...)`

## 6. Checklist kiểm tra sau khi đổi domain

1. Mở `Vé của tôi`, bật modal QR và quét thử QR preview.
2. Tải QR PNG về từ `Vé của tôi` rồi quét thử.
3. Tạo đơn hàng mới và kiểm tra link trong email.
4. Quét QR trong email.
5. Thanh toán qua PayOS và kiểm tra `returnUrl` / `cancelUrl`.
6. Mở trực tiếp route `/ticket-info/:ticketToken` trên domain mới.

## 7. Kết luận ngắn

Nếu sau deploy vẫn còn QR hoặc link trỏ sai domain, cần kiểm tra tách biệt:

1. `FRONTEND_URL` của backend
2. `REACT_APP_FRONTEND_URL` của frontend
3. việc restart backend và rebuild frontend sau khi đổi env

Không cần migration database vì QR và public link đều được dựng động từ ticket data hiện có.