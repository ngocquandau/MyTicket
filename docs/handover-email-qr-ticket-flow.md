# Handover luồng QR vé điện tử trong email

## Mục tiêu

Tài liệu này giải thích:

- Cơ chế hiện tại để tạo thông tin vé điện tử và mã QR
- Vì sao email trước đó gửi thành công nhưng không có QR và link lại dẫn về sai trang
- Vì sao sau bản sửa đầu tiên email vẫn có thể bị lỗi hiển thị ảnh QR trong Gmail
- Cách sửa đã áp dụng
- Dữ liệu nào được tạo động, dữ liệu nào được lưu trong database
- Những file đã chỉnh sửa

Lưu ý: phần sửa được giữ tối thiểu, không thay đổi luồng PayOS và không đụng vào logic vé `0đ` hiện tại.

## 1. Cơ chế tạo mã QR và vé điện tử hiện tại

### 1.1 Vé điện tử là gì trong hệ thống này

Hiện tại hệ thống có trang frontend công khai để xem thông tin vé điện tử:

- Route frontend: `/ticket-info/:ticketId`

Trang này gọi API backend public để lấy thông tin vé đã thanh toán:

- `GET /api/purchases/tickets/:ticketId/public`

Nói ngắn gọn:

- `ticketId` là định danh của từng vé
- frontend dùng `ticketId` để hiển thị trang thông tin vé điện tử
- QR chỉ cần encode URL dẫn tới trang này là đủ

### 1.2 QR hiện được tạo theo kiểu nào

Trong backend, QR đang được tạo theo kiểu **on-demand**, không phải upload file ảnh lên storage và cũng không phải tạo sẵn một file tĩnh trong thư mục public.

Có 2 kiểu tạo QR đang dùng trong toàn hệ thống:

1. Tạo ảnh PNG trong memory bằng `QRCode.toBuffer(...)`
2. Tạo ảnh base64/data URL trong memory bằng `QRCode.toDataURL(...)`

Thư viện đang dùng:

- package `qrcode`

Vị trí import:

- `BE/controllers/purchaseController.js`

### 1.3 QR được tạo khi nào

Sau khi thanh toán hoàn tất hoặc sau khi đơn vé `0đ` được đánh dấu `paid`, hàm `triggerTicketEmail(purchaseId)` được gọi.

Luồng hiện tại:

1. Tìm `purchase`
2. Populate `user`, `ticketClass`, `event`
3. Gom các vé thật thuộc purchase bằng `ensurePurchaseTickets(...)`
4. Với từng `ticketId`, backend tạo:
   - link frontend `/ticket-info/:ticketId`
   - QR data URL trỏ tới chính link đó
5. Gửi email bằng `sendBookingConfirmation(...)`

Ngoài ra khi người dùng bấm tải QR trong phần “Vé của tôi”, backend cũng tạo QR on-demand bằng `QRCode.toBuffer(...)` và trả file PNG trực tiếp cho browser tải về.

### 1.4 QR có được lưu vào database hay không

Hiện tại: **không**.

QR sau khi sửa vẫn được tạo động trong memory khi cần dùng, rồi đưa thẳng vào email hoặc trả về response tải file PNG.

Điểm quan trọng:

- Model `Ticket` có field `qrCode`
- Nhưng ở luồng hiện tại field này **không được ghi dữ liệu**
- Nghĩa là QR không được persist vào MongoDB

Kết luận:

- Có field trong schema, nhưng hiện chưa sử dụng để lưu QR
- QR hiện là dữ liệu sinh động theo yêu cầu

### 1.5 QR lưu ở đâu sau khi sửa

QR hiện không được lưu thành file cố định và cũng không được lưu vào database.

Nó tồn tại ở 2 dạng tạm thời:

1. Buffer PNG trong memory khi dựng email để gắn làm inline attachment
2. Buffer PNG trong memory khi người dùng tải QR từ API

Sau khi email gửi xong hoặc response kết thúc thì dữ liệu QR này không được giữ lại.

## 2. Vì sao email cũ không có QR và link dẫn sai trang

### 2.1 Có phải do dòng `qr: ''` không?

Có. Đây là nguyên nhân trực tiếp khiến email không hiển thị QR.

Trong `BE/controllers/purchaseController.js`, đoạn cũ gọi:

```javascript
await sendBookingConfirmation({
  ...
  link: `${FRONTEND_URL}/my-tickets`,
  qr: ''
});
```

Trong `BE/services/emailService.js`, hàm `sendBookingConfirmation(...)` chỉ render thẻ `<img>` QR nếu `qr` có dữ liệu.

Nghĩa là:

- `qr: ''` -> điều kiện `if (qr)` không chạy
- email không có ảnh QR

Đây là nguyên nhân trực tiếp của lỗi ở phiên bản đầu tiên.

### 2.2 Vì sao link lại dẫn về trang “Vé của tôi”

Vì link đang bị gắn cứng về:

- `${FRONTEND_URL}/my-tickets`

Đây là trang danh sách vé của user sau khi đăng nhập, không phải trang thông tin của từng vé điện tử.

Trong khi yêu cầu đúng phải là:

- `${FRONTEND_URL}/ticket-info/:ticketId`

để bấm vào email hoặc quét QR là vào thẳng đúng vé.

### 2.3 Có một điểm sai thêm trong QR download cũ

Ở API tải QR trước đó, nội dung QR đang encode URL:

- `/api/purchases/tickets/:ticketId/e-ticket`

Nhưng route này hiện không tồn tại trong backend.

Điều đó có nghĩa là kể cả QR tải về trước đó, nếu quét, cũng có nguy cơ dẫn đến sai route hoặc 404.

### 2.4 Vì sao sau khi đã truyền QR vào email nhưng Gmail vẫn hiện ảnh lỗi

Ở bản sửa đầu tiên, QR được nhúng vào email dưới dạng:

```html
<img src="data:image/png;base64,..." />
```

Về mặt HTML điều này hợp lệ, nhưng Gmail và một số email client không hỗ trợ tốt `data:` URL trong nội dung email hoặc chủ động chặn kiểu nhúng này vì lý do bảo mật và tối ưu hiển thị.

Kết quả thường gặp:

- email có khung ảnh
- alt text vẫn hiện
- nhưng ảnh QR không load được

Đây chính là lỗi đang thấy trong ảnh chụp màn hình mới.

## 3. Cách sửa đã áp dụng

## 3.1 Mục tiêu của bản sửa

Không thay đổi luồng thanh toán PayOS và không thay đổi flow vé miễn phí.

Chỉ sửa phần sau khi purchase đã `paid`:

- tạo link đúng tới trang vé điện tử
- tạo QR đúng từ link đó
- nhúng QR và link vào email

## 3.2 Cách tạo link sau khi sửa

Trong `BE/controllers/purchaseController.js` đã thêm helper:

- `getFrontendBaseUrl()`
- `buildTicketInfoUrl(ticketId)`

Link chuẩn mới:

- `${FRONTEND_URL}/ticket-info/${ticketId}`

## 3.3 Cách tạo QR sau khi sửa

Đã thêm helper:

- `buildTicketQrAttachment(ticketId)`

Helper này dùng:

- `QRCode.toBuffer(buildTicketInfoUrl(ticketId), { type: 'png', width: 280, margin: 1 })`

Kết quả:

- tạo ra `Buffer` ảnh PNG trong memory
- đồng thời sinh metadata cho nodemailer gồm:
  - `cid`
  - `filename`
  - `content`

Không cần lưu file, không cần upload ảnh ở đâu cả.

### 3.3.1 Cách nhúng QR vào email sau bản fix cuối

Thay vì nhúng bằng `data:image/...`, QR bây giờ được đính kèm như một **inline attachment** của email bằng `cid`.

Ý tưởng:

1. Backend tạo PNG buffer bằng thư viện `qrcode`
2. Backend truyền buffer này sang `nodemailer` trong mảng `attachments`
3. HTML email tham chiếu ảnh bằng:

```html
<img src="cid:ticket-qr-...@myticket" />
```

Đây là cơ chế được Gmail hỗ trợ tốt hơn nhiều so với `data:` URL.

## 3.4 Cách lấy đúng vé để gửi email

Trong `triggerTicketEmail(purchaseId)` đã sửa theo hướng:

1. Dùng `ensurePurchaseTickets(purchase)` để lấy đúng danh sách vé gắn với purchase
2. Với từng vé, build object gồm:
   - `ticketId`
   - `seat`
   - `link`
  - `qrCid`
  - `qrFilename`
  - `qrContent`
3. Truyền `ticketEntries` vào `sendBookingConfirmation(...)`

Nhờ vậy email có thể hiển thị:

- link trực tiếp tới từng vé điện tử
- QR tương ứng với từng vé qua inline attachment

## 3.5 Cách sửa email template

Trong `BE/services/emailService.js`, hàm `sendBookingConfirmation(...)` đã được mở rộng để nhận thêm:

- `ticketEntries = []`

Nếu có `ticketEntries`, email sẽ render theo danh sách vé:

- Vé 1
- link tới trang `ticket-info/:ticketId`
- ảnh QR tương ứng qua `cid`

Nếu không có `ticketEntries`, hàm vẫn fallback về logic cũ với `link` và `qr` đơn lẻ.

Điều này giữ backward compatibility, tránh làm vỡ các chỗ gọi cũ khác nếu có.

Ngoài ra email service bây giờ còn tạo `attachments` cho từng vé với các field:

- `filename`
- `content`
- `cid`
- `contentType: 'image/png'`
- `disposition: 'inline'`

## 3.6 Cách sửa QR tải về từ API

Trong `downloadTicketQrImage`, nội dung QR đã được chuẩn hóa về cùng một đích:

- `/ticket-info/:ticketId`

Tức là:

- email QR
- QR tải từ “Vé của tôi”

đều dẫn về cùng trang thông tin vé điện tử.

## 4. Những file đã sửa

### 4.1 `BE/controllers/purchaseController.js`

Đã sửa:

- thêm helper build frontend URL cho vé điện tử
- thêm helper tạo QR attachment buffer
- sửa `triggerTicketEmail(purchaseId)` để:
  - lấy đúng danh sách vé của purchase
  - tạo link đúng đến từng vé điện tử
  - tạo QR buffer + cid tương ứng
  - truyền đầy đủ sang email service
- sửa `downloadTicketQrImage` để QR tải về trỏ đúng tới `/ticket-info/:ticketId`

### 4.2 `BE/services/emailService.js`

Đã sửa:

- mở rộng `sendBookingConfirmation(...)`
- hỗ trợ render danh sách vé `ticketEntries`
- mỗi vé có:
  - ticket id
  - seat
  - link trực tiếp
  - ảnh QR nhúng trong email qua `cid`
- thêm `attachments` inline cho QR để Gmail hiển thị được ảnh

## 5. Quy trình sau khi sửa

### 5.1 Thanh toán PayOS thành công

1. Webhook PayOS gọi `handlePayOSWebhook`
2. Purchase được cập nhật thành `paid`
3. `triggerTicketEmail(purchase._id)` được gọi
4. Backend lấy danh sách ticket thuộc purchase
5. Backend tạo link `ticket-info/:ticketId`
6. Backend tạo QR PNG buffer từ link này
7. Email gửi đến user, kèm link và QR cho từng vé

### 5.2 Vé miễn phí `0đ`

1. Purchase được tạo với `paymentStatus = 'paid'`
2. Sau commit transaction, `triggerTicketEmail(newPurchase._id)` vẫn được gọi
3. Phần tạo QR và link chạy giống hệt flow PayOS

=> Không cần thay đổi gì ở flow vé `0đ`, chỉ hưởng lợi từ phần gửi email mới.

## 6. Công cụ và thư viện đang dùng

### Backend

- `qrcode`: tạo QR từ string URL
- `nodemailer`: gửi email HTML và inline attachments bằng `cid`
- `mongoose`: truy vấn purchase, ticket, event, user

### Frontend liên quan

- route React: `/ticket-info/:ticketId`

## 7. Dữ liệu nào dùng để tạo email QR

Nguồn dữ liệu chính:

- `Purchase`
- `Ticket`
- `User`
- `TicketClass`
- `Event`

Trong đó:

- `ticketId` là dữ liệu cốt lõi để dựng link vé điện tử
- link vé điện tử được build từ `FRONTEND_URL`
- QR được tạo từ link đó bằng `qrcode`

## 8. Kết luận ngắn

### Vì sao trước đó không có QR?

Vì `triggerTicketEmail(...)` truyền `qr: ''`, nên email template không có gì để render ảnh QR.

### Vì sao link sai?

Vì link đang gắn cứng về `/my-tickets` thay vì `/ticket-info/:ticketId`.

### Sau khi sửa, QR và link hoạt động thế nào?

- Mỗi vé có link riêng tới trang thông tin vé điện tử
- QR được sinh động từ đúng link đó
- Email nhúng cả link và QR
- Không cần lưu QR vào database
- Không thay đổi PayOS flow và không thay đổi flow vé miễn phí

## 8.1 Bổ sung kết luận cho lỗi mới

Lỗi ảnh QR bị vỡ trong Gmail không còn nằm ở chuyện “chưa truyền QR”, mà nằm ở cách nhúng QR vào email.

So sánh:

- Cũ: nhúng bằng `data:image/png;base64,...` trong HTML email
- Mới: gắn ảnh vào `attachments` của nodemailer và tham chiếu bằng `cid:`

Sau bản fix cuối này, cách hiển thị QR trong email tương thích hơn với Gmail.

## 9. Nếu muốn mở rộng thêm trong tương lai

Có thể cân nhắc, nhưng hiện chưa cần:

1. Lưu sẵn `qrCode` vào field `Ticket.qrCode` nếu muốn cache và tái sử dụng
2. Gửi file đính kèm PNG thay vì nhúng base64 trong HTML
3. Gộp nhiều vé vào một landing page theo `purchaseId` nếu muốn email gọn hơn khi mua nhiều vé

Hiện tại, giải pháp đang dùng là đủ gọn, ít thay đổi và đúng với yêu cầu hiện tại.# Handover QR vé điện tử và email xác nhận đặt vé

## Mục tiêu

Tài liệu này giải thích:

- QR thông tin vé điện tử hiện được tạo theo cơ chế nào
- QR là link hay ảnh, được tạo khi nào, bằng thư viện nào
- Dữ liệu nào được lưu trong database, dữ liệu nào không
- Vì sao email trước đây gửi thành công nhưng không có QR và link lại dẫn về sai trang
- Cách đã sửa để email kèm cả QR và link dẫn trực tiếp tới trang thông tin vé điện tử

## Kết luận ngắn

Nguyên nhân chính đúng là do trong `triggerTicketEmail`, tham số `qr` đang được truyền là chuỗi rỗng:

```js
qr: ''
```

Nghĩa là email service có hỗ trợ hiển thị QR, nhưng controller không truyền dữ liệu QR vào, nên email chỉ hiện link văn bản.

Ngoài ra, link trong email trước đây lại đang trỏ tới:

```js
${FRONTEND_URL}/my-tickets
```

thay vì trỏ trực tiếp tới:

```js
/ticket-info/:ticketId
```

Do đó:

- Email gửi thành công
- Nhưng không có ảnh QR
- Và link trong email không dẫn thẳng tới trang vé điện tử công khai

## 1. Cơ chế tạo thông tin vé điện tử hiện tại

### 1.1 Vé điện tử được định danh bằng gì

Mỗi vé trong collection `tickets` có một `ticketId` riêng.

Ví dụ trong model `Ticket`:

- `ticketId`: mã vé
- `purchase`: liên kết về đơn hàng
- `ticketClass`: liên kết về hạng vé
- `seat`: thông tin ghế hoặc nhãn vé tự do

`ticketId` là dữ liệu cốt lõi để tra cứu vé điện tử.

### 1.2 Trang thông tin vé điện tử hoạt động ra sao

Frontend có route:

```txt
/ticket-info/:ticketId
```

Trang này gọi API backend:

```txt
GET /api/purchases/tickets/:ticketId/public
```

để lấy dữ liệu vé đã thanh toán và hiển thị ra trang `TicketInfoPage`.

Nói ngắn gọn:

- `ticketId` là khóa tra cứu
- frontend route `/ticket-info/:ticketId` là nơi người dùng xem vé điện tử
- backend API `/api/purchases/tickets/:ticketId/public` là nơi frontend lấy dữ liệu vé

### 1.3 QR thực chất là gì

QR không phải là “dữ liệu vé riêng” được lưu cố định trong database.

QR trong hệ thống này thực chất là một ảnh mã hóa từ một URL, cụ thể là URL dẫn tới trang vé điện tử.

Sau khi fix, QR được tạo từ URL có dạng:

```txt
${FRONTEND_URL}/ticket-info/:ticketId
```

Ví dụ:

```txt
http://localhost:3000/ticket-info/GEN-1713700000-12345
```

Khi quét QR:

- Thiết bị mở link này
- Frontend vào trang `TicketInfoPage`
- Trang gọi API backend để lấy dữ liệu vé
- Người dùng thấy thông tin vé điện tử

## 2. QR được tạo khi nào, bằng cơ chế gì, bằng công cụ nào

### 2.1 Thư viện dùng để tạo QR

QR được tạo bằng thư viện:

```txt
qrcode
```

Trong backend hiện đã import:

```js
import QRCode from 'qrcode';
```

### 2.2 Có 2 kiểu tạo QR trong hệ thống

#### a. Tạo ảnh QR dạng `Buffer`

Dùng khi tải QR về máy.

Ví dụ:

```js
QRCode.toBuffer(url, { type: 'png', width: 640, margin: 2 })
```

Kết quả là ảnh PNG trong memory, rồi trả trực tiếp về response.

#### b. Tạo ảnh QR dạng `Data URL`

Dùng khi nhúng trực tiếp vào email HTML.

Ví dụ:

```js
QRCode.toDataURL(url, { width: 280, margin: 1 })
```

Kết quả là chuỗi dạng:

```txt
data:image/png;base64,...
```

Chuỗi này có thể gắn thẳng vào thẻ:

```html
<img src="data:image/png;base64,..." />
```

để email hiện QR ngay trong nội dung thư.

### 2.3 QR được tạo khi nào

Sau khi fix, QR được tạo on-demand ở 2 thời điểm:

#### a. Khi gửi email xác nhận vé

Sau khi thanh toán thành công hoặc nhận vé miễn phí thành công, hệ thống gọi:

```js
triggerTicketEmail(purchaseId)
```

Trong hàm này:

- Tìm purchase
- Tìm các ticket thuộc purchase
- Tạo link vé điện tử cho từng ticket
- Dùng `QRCode.toDataURL(...)` để tạo ảnh QR cho từng ticket
- Truyền sang email service để render trong email HTML

#### b. Khi người dùng bấm tải ảnh QR từ trang vé của tôi

API:

```txt
GET /api/purchases/tickets/:ticketId/qr-image
```

Backend sẽ dùng `QRCode.toBuffer(...)` để tạo ảnh PNG rồi trả về file tải xuống.

## 3. QR có được lưu vào database hay không

### 3.1 Hiện tại: không lưu ảnh QR vào database

Sau khi fix, QR vẫn không được lưu vào database.

Hệ thống chỉ lưu dữ liệu gốc cần thiết:

- `ticketId`
- `purchase`
- `ticketClass`
- `seat`
- `isSold`

Khi cần QR:

- hệ thống lấy `ticketId`
- dựng URL vé điện tử
- tạo QR ngay trong memory

### 3.2 Có trường `qrCode` trong model `Ticket`, nhưng luồng hiện tại không dùng để persist

Trong `Ticket` model có field:

```js
qrCode: { type: String }
```

Nhưng với luồng hiện tại sau fix:

- không ghi QR vào field này
- không lưu file QR vào ổ đĩa
- không lưu base64 QR vào DB

Lý do:

- QR có thể tạo lại rất nhanh từ `ticketId`
- Không cần tăng dung lượng DB
- Không phải đồng bộ dữ liệu QR nếu đổi domain hoặc route frontend

## 4. Vì sao email trước đây không có QR và link lại sai đích

## 4.1 Lý do email không có QR

Trong `BE/services/emailService.js`, hàm `sendBookingConfirmation` chỉ render QR nếu tham số `qr` có dữ liệu:

```js
if (qr) {
    dynamicPart += `<p>Hoặc bạn có thể quét mã QR dưới đây để truy cập vé:</p>
    <img src="${qr}" alt="Mã QR vé" style="width:200px;height:200px;"/>`;
}
```

Nhưng trong `BE/controllers/purchaseController.js`, trước khi fix lại đang truyền:

```js
qr: ''
```

Điều này làm điều kiện `if (qr)` luôn false.

Kết quả:

- Email service hoạt động đúng
- Nhưng không có dữ liệu QR để render
- Nên email không hiện ảnh QR

### 4.2 Lý do link đi sai trang

Trước khi fix, `triggerTicketEmail` truyền:

```js
link: `${FRONTEND_URL}/my-tickets`
```

Điều này chỉ dẫn người dùng về trang danh sách vé của tôi sau khi đăng nhập, không phải trang thông tin vé điện tử công khai cho từng mã vé.

Trong khi yêu cầu đúng cần dẫn tới:

```txt
/ticket-info/:ticketId
```

### 4.3 Có thêm một lỗi phụ trong API tải QR

Trước khi fix, API tải ảnh QR đang tạo QR từ một URL backend dạng:

```txt
/api/purchases/tickets/:ticketId/e-ticket
```

Nhưng route này hiện không tồn tại trong hệ thống.

Vì vậy kể cả khi tải QR về máy, QR đó cũng có nguy cơ trỏ tới một đích không hợp lệ.

## 5. Cách đã sửa

## 5.1 Sửa tại `BE/controllers/purchaseController.js`

Đã bổ sung các helper:

```js
const getFrontendBaseUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';
const buildTicketInfoUrl = (ticketId) => `${getFrontendBaseUrl()}/ticket-info/${encodeURIComponent(ticketId)}`;
const buildTicketQrDataUrl = async (ticketId) => QRCode.toDataURL(buildTicketInfoUrl(ticketId), {
    width: 280,
    margin: 1,
});
```

Ý nghĩa:

- Link vé điện tử được chuẩn hóa về frontend route `/ticket-info/:ticketId`
- QR email được tạo trực tiếp từ chính link đó

## 5.2 Sửa `triggerTicketEmail`

Trước đây:

- chỉ gửi một link chung về `/my-tickets`
- `qr` là chuỗi rỗng

Sau khi fix:

- gọi `ensurePurchaseTickets(purchase)` để lấy toàn bộ vé thuộc purchase
- với mỗi ticket sẽ dựng:
  - `ticketId`
  - `seat`
  - `link`
  - `qr`
- tạo `ticketEntries` và truyền sang `sendBookingConfirmation`

Nếu có nhiều vé trong một đơn hàng, email sẽ hiển thị từng vé tương ứng.

## 5.3 Sửa `BE/services/emailService.js`

Hàm `sendBookingConfirmation` được mở rộng để nhận thêm:

```js
ticketEntries = []
```

Nếu có `ticketEntries`, email sẽ render cho từng vé:

- mã vé
- ghế hoặc nhãn vé tự do
- link “Xem thông tin vé điện tử”
- ảnh QR tương ứng

Điều này giúp email không chỉ có 1 link chung, mà có đầy đủ dữ liệu truy cập cho từng vé.

## 5.4 Sửa API tải ảnh QR

Trong `downloadTicketQrImage`, nội dung QR đã được đổi sang:

```js
buildTicketInfoUrl(ticket.ticketId)
```

Thay vì trỏ tới route `/e-ticket` không tồn tại.

Kết quả:

- QR tải về từ hệ thống
- QR trong email
- Link trong email

đều cùng dẫn tới một đích thống nhất là trang:

```txt
/ticket-info/:ticketId
```

## 6. Quy trình sau khi fix

### Với vé thanh toán qua PayOS

1. User tạo purchase
2. Chuyển qua PayOS thanh toán
3. Webhook PayOS gọi vào backend
4. `paymentStatus` chuyển sang `paid`
5. Backend gọi `triggerTicketEmail(purchaseId)`
6. `triggerTicketEmail` lấy ticket thuộc đơn hàng
7. Với mỗi ticket:
   - dựng link `/ticket-info/:ticketId`
   - tạo QR data URL bằng thư viện `qrcode`
8. Email service nhúng link + QR vào nội dung email
9. Người nhận email bấm link hoặc quét QR để mở đúng trang vé điện tử

### Với vé miễn phí hoặc đơn hàng `0đ`

1. Purchase được đánh dấu `paid` ngay
2. Sau commit transaction, backend gọi `triggerTicketEmail(newPurchase._id)`
3. Các bước còn lại giữ nguyên như trên

Luồng này không thay đổi PayOS và cũng không thay đổi logic free ticket hiện có, chỉ thay phần nội dung email và QR đính kèm.

## 7. File đã sửa

### `BE/controllers/purchaseController.js`

Đã sửa:

- thêm helper dựng URL vé điện tử frontend
- thêm helper tạo QR data URL cho email
- cập nhật `triggerTicketEmail` để tạo QR và link cho từng ticket
- cập nhật `downloadTicketQrImage` để QR trỏ về đúng route `ticket-info/:ticketId`

### `BE/services/emailService.js`

Đã sửa:

- mở rộng `sendBookingConfirmation` để nhận `ticketEntries`
- render danh sách link + QR cho từng vé trong email HTML

## 8. Những gì không bị thay đổi

Theo yêu cầu, không chỉnh sâu vào backend ngoài phần cần thiết và không đụng vào các luồng sau:

- không đổi luồng thanh toán PayOS
- không đổi logic webhook PayOS
- không đổi luồng mua vé miễn phí `0đ`
- không thêm bảng database mới
- không thay đổi route frontend `ticket-info/:ticketId`

## 9. Tóm tắt quyết định kỹ thuật

### Chọn tạo QR on-demand thay vì lưu DB

Ưu điểm:

- ít thay đổi hệ thống
- không cần migration
- không tăng dung lượng DB
- dễ đổi URL frontend về sau

### Chọn QR trỏ thẳng tới frontend `ticket-info/:ticketId`

Ưu điểm:

- đúng với mong muốn người dùng cuối
- mở thẳng trang vé điện tử
- đồng nhất giữa email và QR tải xuống

### Chọn nhúng QR dưới dạng Data URL trong email

Ưu điểm:

- không cần lưu file tạm
- không cần public file storage riêng
- render trực tiếp trong HTML email

## 10. Gợi ý kiểm tra lại sau khi sửa

Nên kiểm tra 3 trường hợp:

1. Thanh toán PayOS thành công với 1 vé
2. Thanh toán PayOS thành công với nhiều vé trong cùng purchase
3. Nhận vé miễn phí `0đ`

Kỳ vọng:

- email có ít nhất 1 QR hiển thị
- mỗi QR quét ra đúng trang `/ticket-info/:ticketId`
- mỗi link trong email bấm vào mở đúng trang vé điện tử
- chức năng tải QR từ “Vé của tôi” cũng mở đúng trang vé điện tử khi quét