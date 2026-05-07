# Handover luồng QR vé điện tử cho Vé của tôi và email

## 1. Mục tiêu tài liệu

Tài liệu này thay cho các ghi chú cũ đang bị chồng chéo về QR/email. Nội dung tập trung vào đúng phạm vi hiện tại của hệ thống:

- QR hiển thị trong màn hình `Vé của tôi`
- QR tải về từ backend
- QR và link xuất hiện trong email xác nhận vé
- route/frontend page mở ra khi người dùng bấm link hoặc quét QR
- public API dùng để lấy dữ liệu vé điện tử
- thứ tự chạy theo từng file, từng hàm

## 2. Kết luận ngắn

Hiện tại hệ thống có **2 cách tạo QR khác nhau** nhưng cùng trỏ tới trang vé điện tử công khai:

1. **Frontend tự render QR để preview trong modal `Vé của tôi`** bằng component `QRCode` của `antd`.
2. **Backend tự tạo QR PNG thật** bằng thư viện `qrcode` cho:
   - email xác nhận vé
   - API tải QR về máy

Đích cuối cùng của QR/link là route frontend:

```txt
/ticket-info/:ticketToken
```

Trang này tiếp tục gọi public API backend để lấy dữ liệu vé đã thanh toán:

```txt
GET /api/purchases/tickets/:ticketToken/public?ref=<ticketMongoId>
```

Trong implementation hiện tại, token công khai được ưu tiên là `_id` của document `Ticket` khi có sẵn, thay vì chỉ dùng `ticketId`, để giảm rủi ro trùng mã giữa nhiều purchase khác nhau.

## 3. Bản đồ file liên quan

### Backend

- `BE/routes/purchaseRoutes.js`
  - đăng ký các API lấy vé của tôi, tải QR, public JSON, public HTML
- `BE/controllers/purchaseController.js`
  - chứa toàn bộ helper build link vé điện tử, tạo QR PNG, resolve ticket, gửi email vé
- `BE/services/emailService.js`
  - dựng HTML email, đính kèm QR inline qua `cid`, gửi mail bằng SendGrid
- `BE/controllers/paymentController.js`
  - tạo link thanh toán PayOS và gọi `triggerTicketEmail` khi webhook báo thanh toán thành công

### Frontend

- `FE/src/App.tsx`
  - khai báo route public `/ticket-info/:ticketId`
- `FE/src/pages/client/MyTicketsPage/index.tsx`
  - hiển thị modal QR, dựng link xem vé, gọi API tải QR
- `FE/src/services/purchaseService.ts`
  - wrapper gọi các API liên quan đến purchase/ticket QR
- `FE/src/pages/client/TicketInfoPage/index.tsx`
  - mở trang vé điện tử và gọi public API lấy dữ liệu vé

## 4. Thư viện, component và công dụng

### 4.1 Backend

#### `qrcode`

File dùng:

- `BE/controllers/purchaseController.js`

Hàm đang dùng:

- `QRCode.toBuffer(...)`

Công dụng:

- tạo PNG buffer cho QR email
- tạo PNG buffer cho API tải QR về máy

Ghi chú:

- implementation hiện tại **không** dùng `QRCode.toDataURL(...)` cho email nữa
- email đang dùng inline attachment `cid`, tương thích tốt hơn với Gmail

#### `@sendgrid/mail`

File dùng:

- `BE/services/emailService.js`

Công dụng:

- gửi email xác nhận đặt vé
- nhận HTML hoàn chỉnh và danh sách attachment để gửi đi

#### `node:fs`, `node:path`, `node:url`

File dùng:

- `BE/controllers/purchaseController.js`
- `BE/services/emailService.js`

Công dụng:

- đọc logo watermark/logo email từ `FE/src/assets/myticket_logo.png`
- nhúng logo vào HTML public page hoặc email

### 4.2 Frontend

#### `QRCode` của `antd`

File dùng:

- `FE/src/pages/client/MyTicketsPage/index.tsx`

Công dụng:

- render QR preview trực tiếp trong modal `Mã vé check-in`
- đây chỉ là QR hiển thị ở client, không phải file PNG do backend tạo

#### `react-router-dom`

File dùng:

- `FE/src/App.tsx`
- `FE/src/pages/client/TicketInfoPage/index.tsx`

Công dụng:

- nhận path `/ticket-info/:ticketId`
- lấy `ticketId` từ URL để gọi API public

#### `react-barcode`

File dùng:

- `FE/src/pages/client/TicketInfoPage/index.tsx`

Công dụng:

- render barcode trong trang vé điện tử sau khi public API trả dữ liệu
- không tham gia vào quá trình tạo QR, nhưng là thành phần hiển thị tiếp theo sau khi người dùng mở link từ QR

## 5. Helper và hàm quan trọng theo từng file

## 5.1 `BE/controllers/purchaseController.js`

### `getFrontendBaseUrl()`

Công dụng:

- lấy domain frontend public từ `process.env.FRONTEND_URL`
- nếu không có thì fallback về `https://mticket.vercel.app`
- cắt dấu `/` cuối URL nếu có

### `sanitizeTicketToken(value)`

Công dụng:

- chuẩn hóa token trước khi đưa vào tên file và `cid` của ảnh QR email

### `buildTicketPublicToken(ticketId, ticketRef)`

Công dụng:

- chọn token public dùng trong link
- ưu tiên `ticketRef` (`Ticket._id`) nếu có
- nếu không có mới fallback về `ticketId`

### `buildTicketInfoUrl(ticketId, ticketRef)`

Công dụng:

- tạo URL frontend public dạng:

```txt
${FRONTEND_URL}/ticket-info/${publicToken}
```

Được dùng ở đâu:

- `triggerTicketEmail(...)`
- `buildTicketQrAttachment(...)`
- `downloadTicketQrImage(...)`

### `buildTicketQrAttachment({ ticketId, ticketRef })`

Công dụng:

- gọi `QRCode.toBuffer(buildTicketInfoUrl(...))`
- tạo object attachment cho email gồm:
  - `cid`
  - `filename`
  - `content`

### `resolveTicketCandidates({ ticketToken, ticketRef, populate })`

Công dụng:

- tìm vé theo nhiều kiểu input:
  - `_id` từ `ref`
  - `_id` từ path param
  - `ticketId` truyền thống
- phục vụ cho cả API tải QR và public API

### `pickPaidTicket(tickets)`

Công dụng:

- ưu tiên chọn vé có `purchase.paymentStatus === 'paid'`

### `ensurePurchaseTickets(purchaseDoc)`

Công dụng:

- lấy đủ danh sách vé thuộc purchase
- nếu thiếu vé general thì tự tạo thêm vé động
- nếu vé legacy chưa gắn `purchase`, hàm sẽ cập nhật lại liên kết

Hàm này là mắt xích quan trọng vì:

- email cần ticket list đầy đủ để tạo QR từng vé
- màn hình `Vé của tôi` cần ticket list đầy đủ để hiển thị modal QR

### `triggerTicketEmail(purchaseId)`

Công dụng:

- entry point gửi email vé sau khi thanh toán thành công

Thứ tự chạy bên trong:

1. `Purchase.findById(...).populate('user').populate('ticketClass.event')`
2. `ensurePurchaseTickets(purchase)`
3. với từng ticket, gọi `buildTicketQrAttachment(...)`
4. với từng ticket, gọi `buildTicketInfoUrl(...)`
5. build `ticketEntries`
6. gọi `sendBookingConfirmation(...)`
7. gọi tiếp `scheduleEventReminderEmails(...)`

### `downloadTicketQrImage(req, res)`

Công dụng:

- tạo file PNG QR để user tải về từ `Vé của tôi`

Thứ tự chạy:

1. nhận `:ticketId` từ path và `?ref=` từ query
2. `resolveTicketCandidates(...)`
3. kiểm tra quyền user hoặc admin
4. kiểm tra vé đã `paid`
5. `buildTicketInfoUrl(ticket.ticketId, ticket._id)`
6. `QRCode.toBuffer(...)`
7. trả `Content-Type: image/png`

### `getPaidTicketPublicInfo(req, res)`

Công dụng:

- public JSON cho trang vé điện tử và scanner app

Thứ tự chạy:

1. nhận `:ticketId` và `?ref=`
2. `resolveTicketCandidates(...)`
3. `pickPaidTicket(...)`
4. kiểm tra `purchase.paymentStatus === 'paid'`
5. trả JSON gồm `ticket`, `ticketClass`, `event`, `payment`, `buyer`

### `getPaidTicketPublicImage(req, res)`

Công dụng:

- public HTML page hiển thị bảng thông tin vé điện tử ngay trên backend
- chủ yếu phục vụ trường hợp scanner hoặc browser mở trực tiếp endpoint HTML

Ghi chú:

- QR chính hiện tại không encode endpoint này nữa
- đích chính của QR bây giờ là frontend route `/ticket-info/:token`
- nhưng endpoint này vẫn còn tồn tại và hoạt động độc lập

## 5.2 `BE/services/emailService.js`

### `sendBookingConfirmation(...)`

Công dụng:

- dựng nội dung email xác nhận đặt vé
- nếu có `ticketEntries`, email render theo danh sách từng vé
- mỗi vé có:
  - `ticketId`
  - `seat`
  - nút link tới trang vé điện tử
  - ảnh QR qua `cid`

Thứ tự xử lý:

1. nhận dữ liệu từ `triggerTicketEmail(...)`
2. build `dynamicPart` tùy theo `ticketEntries`
3. tạo `attachments` từ `qrContent`
4. gọi `buildMailOptions(...)`
5. `sgMail.send(mailOptions)`

### `buildMailOptions(...)`

Công dụng:

- gom HTML, attachment, logo email thành payload đúng format của SendGrid

### `getLogoAttachment()`

Công dụng:

- đọc logo MyTicket để gắn inline vào email layout

## 5.3 `BE/controllers/paymentController.js`

### `createPaymentUrl(req, res)`

Công dụng:

- tạo `checkoutUrl` PayOS cho purchase
- tạo `cancelUrl` và `returnUrl` bằng `FRONTEND_URL`

Liên quan đến QR ở chỗ:

- cùng dùng biến môi trường `FRONTEND_URL`, nên cấu hình domain frontend sai có thể làm PayOS trả về sai domain dù QR/email đã đúng hoặc ngược lại

### `handlePayOSWebhook(req, res)`

Công dụng:

- khi PayOS báo thành công, hàm cập nhật `purchase.paymentStatus = 'paid'`
- sau đó gọi `triggerTicketEmail(purchase._id)`

## 5.4 `FE/src/services/purchaseService.ts`

### `getMyPurchasesAPI()`

Gọi API:

```txt
GET /api/purchases/my-tickets
```

Công dụng:

- lấy danh sách purchase đã thanh toán của user hiện tại

### `downloadTicketQrImageAPI(ticketId, ticketRef?)`

Gọi API:

```txt
GET /api/purchases/tickets/:ticketId/qr-image?ref=<ticketMongoId>
```

Công dụng:

- tải file PNG QR từ backend

### `getPaidTicketPublicInfoAPI(ticketId, ticketRef?)`

Gọi API:

```txt
GET /api/purchases/tickets/:ticketId/public?ref=<ticketMongoId>
```

Công dụng:

- lấy dữ liệu public của vé để render trang `/ticket-info/:ticketId`

## 5.5 `FE/src/pages/client/MyTicketsPage/index.tsx`

### `buildTicketInfoUrl(ticketId, ticketRef?)`

Công dụng:

- dựng link frontend public tại client cho modal `Vé của tôi`

Thứ tự chọn base URL:

1. `process.env.REACT_APP_FRONTEND_URL`
2. nếu đang chạy localhost thì fallback về `https://mticket.vercel.app`
3. nếu không phải localhost thì dùng `window.location.origin`

Ghi chú quan trọng:

- đây là logic **riêng của frontend**
- nó không dùng chung trực tiếp helper `getFrontendBaseUrl()` của backend

### `showQRModal(tickets, seatType)`

Công dụng:

- mở modal QR cho danh sách vé thuộc purchase
- kiểm tra cảnh báo nếu link đang trỏ về `localhost`

### `handleDownloadQr(ticketId, ticketRef?)`

Công dụng:

- gọi `downloadTicketQrImageAPI(...)`
- nhận blob PNG
- tạo file tải về trong browser

### `QRCode value={buildTicketInfoUrl(...)}`

Công dụng:

- render QR preview trực tiếp trong modal bằng `antd`

## 5.6 `FE/src/App.tsx`

### Route `/ticket-info/:ticketId`

Công dụng:

- là đích chính của link trong email và QR hiện tại

## 5.7 `FE/src/pages/client/TicketInfoPage/index.tsx`

### `useParams()` + `useLocation()`

Công dụng:

- lấy `ticketId` từ path
- lấy `ref` từ query string nếu có

### `getPaidTicketPublicInfoAPI(ticketId, ticketRef)`

Công dụng:

- gọi public API backend để lấy dữ liệu thật của vé
- nếu API trả lỗi thì page hiển thị trạng thái không xác thực được vé

## 6. Danh sách API liên quan và công dụng

### 6.1 `GET /api/purchases/my-tickets`

Route file:

- `BE/routes/purchaseRoutes.js`

Controller:

- `getMyPurchases`

Công dụng:

- trả danh sách purchase đã `paid` của user
- mỗi purchase sẽ có `ticketList` lấy từ `ensurePurchaseTickets(...)`

Auth:

- bắt buộc token

### 6.2 `GET /api/purchases/tickets/:ticketId/qr-image?ref=<ticketMongoId>`

Route file:

- `BE/routes/purchaseRoutes.js`

Controller:

- `downloadTicketQrImage`

Công dụng:

- trả file PNG QR để tải về

Auth:

- bắt buộc token
- chỉ chủ vé hoặc admin

### 6.3 `GET /api/purchases/tickets/:ticketId/public?ref=<ticketMongoId>`

Route file:

- `BE/routes/purchaseRoutes.js`

Controller:

- `getPaidTicketPublicInfo`

Công dụng:

- trả JSON public cho frontend page `/ticket-info/:ticketId`
- cũng có thể dùng cho scanner app

Auth:

- public

### 6.4 `GET /api/purchases/tickets/:ticketId/public-image?ref=<ticketMongoId>`

Route file:

- `BE/routes/purchaseRoutes.js`

Controller:

- `getPaidTicketPublicImage`

Công dụng:

- trả HTML public của vé điện tử trực tiếp từ backend

Auth:

- public

### 6.5 `POST /api/payment/create-url`

Route file:

- `BE/routes/paymentRoutes.js`

Controller:

- `createPaymentUrl`

Công dụng:

- tạo link checkout PayOS
- dùng `FRONTEND_URL` để build `cancelUrl` và `returnUrl`

### 6.6 `POST /api/payment/payos-webhook`

Route file:

- `BE/routes/paymentRoutes.js`

Controller:

- `handlePayOSWebhook`

Công dụng:

- đánh dấu purchase là `paid`
- kích hoạt gửi email vé qua `triggerTicketEmail(...)`

## 7. Luồng chạy thực tế theo từng kịch bản

## 7.1 Kịch bản A: mở modal QR trong `Vé của tôi`

1. FE gọi `getMyPurchasesAPI()` trong `FE/src/pages/client/MyTicketsPage/index.tsx`.
2. API `GET /api/purchases/my-tickets` vào `getMyPurchases` trong `BE/controllers/purchaseController.js`.
3. `getMyPurchases` gọi `ensurePurchaseTickets(...)` cho từng purchase để trả `ticketList` đầy đủ.
4. FE nhận `ticketList`, người dùng bấm nút mở modal QR.
5. `showQRModal(...)` chạy.
6. Mỗi vé trong modal render QR ngay tại client bằng:

```tsx
<QRCode value={buildTicketInfoUrl(t.ticketId, t._id)} />
```

Kết luận:

- luồng preview này **không gọi backend để sinh ảnh QR**
- backend chỉ cung cấp dữ liệu vé

## 7.2 Kịch bản B: tải QR PNG từ `Vé của tôi`

1. Người dùng bấm `Tải QR` trong modal.
2. FE chạy `handleDownloadQr(ticketId, ticketRef)`.
3. FE gọi `downloadTicketQrImageAPI(ticketId, ticketRef)`.
4. Request vào route `GET /api/purchases/tickets/:ticketId/qr-image`.
5. Controller `downloadTicketQrImage` chạy.
6. Controller gọi `resolveTicketCandidates(...)` để tìm đúng vé.
7. Controller kiểm tra quyền và trạng thái `paid`.
8. Controller gọi `buildTicketInfoUrl(ticket.ticketId, ticket._id)`.
9. Controller gọi `QRCode.toBuffer(...)` để tạo PNG.
10. Backend trả file PNG cho FE.
11. FE tạo blob URL và tải file xuống máy người dùng.

## 7.3 Kịch bản C: email vé sau thanh toán PayOS thành công

1. FE tạo purchase bằng `createPurchaseAPI(...)`.
2. FE gọi `createPaymentUrlAPI(...)`.
3. `BE/controllers/paymentController.js` chạy `createPaymentUrl` để tạo link checkout.
4. User thanh toán xong, PayOS gọi webhook `POST /api/payment/payos-webhook`.
5. `handlePayOSWebhook(...)` cập nhật purchase thành `paid`.
6. `handlePayOSWebhook(...)` gọi `triggerTicketEmail(purchase._id)`.
7. `triggerTicketEmail(...)` lấy purchase, user, ticketClass, event.
8. `triggerTicketEmail(...)` gọi `ensurePurchaseTickets(...)` để lấy đủ ticket list.
9. Với từng ticket, controller gọi:
   - `buildTicketQrAttachment(...)`
   - `buildTicketInfoUrl(...)`
10. Controller build `ticketEntries`.
11. Controller gọi `sendBookingConfirmation(...)` trong `BE/services/emailService.js`.
12. `sendBookingConfirmation(...)` tạo HTML + attachments inline `cid`.
13. `sgMail.send(...)` gửi email.

## 7.4 Kịch bản D: email vé cho đơn `0đ`

1. `createPurchase(...)` trong `BE/controllers/purchaseController.js` tính ra `finalAmount === 0`.
2. Purchase được tạo luôn với `paymentStatus = 'paid'`.
3. Sau khi transaction commit, code gọi:

```js
setTimeout(() => {
    triggerTicketEmail(newPurchase._id);
}, 500);
```

4. Từ đây flow gửi email chạy giống hệt kịch bản PayOS ở trên.

## 7.5 Kịch bản E: người dùng mở link từ email hoặc quét QR

1. Trình duyệt mở route frontend `/ticket-info/:ticketToken`.
2. `FE/src/App.tsx` match route tới `TicketInfoPage`.
3. `TicketInfoPage` lấy `ticketId` từ path và `ref` từ query nếu có.
4. `TicketInfoPage` gọi `getPaidTicketPublicInfoAPI(ticketId, ticketRef)`.
5. Backend route `/api/purchases/tickets/:ticketId/public` chạy `getPaidTicketPublicInfo(...)`.
6. API trả JSON public của vé.
7. FE render trang vé điện tử hoàn chỉnh.

## 8. Dữ liệu nào được lưu, dữ liệu nào tạo động

### Được lưu trong database

- `Ticket._id`
- `Ticket.ticketId`
- `Ticket.seat`
- `Ticket.purchase`
- `Purchase.paymentStatus`
- `Purchase.purchaseDate`

### Không được lưu cố định

- ảnh QR PNG cho email
- ảnh QR PNG tải về
- HTML email hoàn chỉnh
- link public vé đã build sẵn

Kết luận:

- QR vẫn là dữ liệu sinh động theo yêu cầu
- đổi domain frontend không cần migration database

## 9. Rủi ro cấu hình và lưu ý bàn giao

### 9.1 Có hai nơi build base URL frontend

Backend dùng:

- `process.env.FRONTEND_URL`

Frontend modal `Vé của tôi` dùng:

- `process.env.REACT_APP_FRONTEND_URL`
  hoặc `window.location.origin`
  hoặc fallback `https://mticket.vercel.app`

Nếu hai biến này không đồng bộ thì có thể xảy ra:

- QR preview trong modal trỏ một domain
- QR tải về và QR email trỏ domain khác

### 9.2 `public-image` vẫn còn nhưng không phải đích chính của QR

Hiện tại tài liệu cũ mô tả QR trỏ thẳng tới `public-image`. Điều đó không còn đúng với implementation mới. Đích chính bây giờ là:

```txt
/ticket-info/:ticketToken
```

### 9.3 `ref` query vẫn quan trọng

Khi có `_id` của ticket, frontend/backend ưu tiên truyền thêm `ref` để backend resolve đúng document vé, đặc biệt khi `ticketId` có thể không đủ an toàn để phân biệt mọi trường hợp.

## 10. Khuyến nghị bảo trì

1. Khi sửa logic public link, kiểm tra đồng thời các file:
   - `BE/controllers/purchaseController.js`
   - `BE/controllers/paymentController.js`
   - `FE/src/pages/client/MyTicketsPage/index.tsx`
2. Khi đổi template email, kiểm tra `sendBookingConfirmation(...)` và attachment `cid` thay vì quay lại `data:image/...`.
3. Khi debug QR sai đích, xác minh riêng 3 nguồn:
   - QR preview ở FE modal
   - QR PNG tải từ backend
   - QR trong email