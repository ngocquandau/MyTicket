# Handover làm mới giao diện email MyTicket

## Mục tiêu

Tài liệu này mô tả việc tinh chỉnh nội dung và hình thức hiển thị của các email trong hệ thống để trông chuyên nghiệp, đồng bộ và nhận diện thương hiệu tốt hơn, trong khi vẫn giữ nguyên dữ liệu đầu vào hiện có của từng hàm gửi email.

Tài liệu cũng bao gồm bước chuẩn hóa toàn bộ nội dung hiển thị sang tiếng Việt có dấu, ngoại trừ tên riêng và keyword như MyTicket, OTP, QR, TikTok.

## Phạm vi thay đổi

File đã thay đổi:

- `BE/services/emailService.js`

Không thay đổi:

- contract đầu vào của các hàm gửi email hiện có
- logic gửi email bằng `nodemailer`
- dữ liệu nghiệp vụ đầu vào như `cusEmail`, `cusName`, `code`, `password`, `eventName`, `eventDate`, `venue`, `link`, `qr`, `ticketEntries`, `invoiceNumber`, `amount`, `surveyLink`...

## Vấn đề trước khi chỉnh sửa

Trước khi cập nhật, mỗi hàm email tự dựng HTML riêng với cấu trúc đơn giản, chủ yếu là:

- vài thẻ `h3`, `p`, `a`
- không có layout dùng chung
- không có phần nhận diện thương hiệu rõ ràng
- không có footer hỗ trợ khách hàng thống nhất
- thiếu tính thẩm mỹ và độ chuyên nghiệp khi nhìn trong hộp thư

Điều này dẫn đến:

- email không đồng bộ giữa các loại thông báo
- khó mở rộng khi muốn tinh chỉnh giao diện đồng loạt
- trải nghiệm người dùng thiếu nhất quán

## Hướng xử lý

Thay vì chỉ chỉnh từng email riêng lẻ, phần `emailService.js` được tổ chức lại theo hướng:

1. Tạo một layout email dùng chung cho toàn bộ hệ thống
2. Đưa các thông tin thương hiệu cố định về một chỗ
3. Bọc nội dung riêng của từng email vào layout chung đó
4. Vẫn dùng đúng dữ liệu đầu vào cũ của từng hàm, không cắt bớt thông tin
5. Chuẩn hóa nội dung hiển thị sang tiếng Việt có dấu cho tất cả các email

## Những gì đã được thêm vào

### 1. Thông tin thương hiệu cố định

Đã thêm các hằng số cố định trong `BE/services/emailService.js`:

- `SUPPORT_EMAIL = 'support@myticket.vn'`
- `SUPPORT_ADDRESS = '158 Linh Dong, Thu Duc, TP.HCM'`
- `SUPPORT_PHONE = '0123.456.78'`

Ý nghĩa:

- tất cả email đều có footer hỗ trợ khách hàng thống nhất
- nếu sau này cần đổi thông tin liên hệ, chỉ cần sửa một nơi

### 2. Màu thương hiệu dùng chung

Đã thêm:

- `BRAND_COLOR`
- `BRAND_DARK`
- `BRAND_LIGHT`

Ý nghĩa:

- giúp toàn bộ email có cùng tông màu nhận diện thương hiệu
- dễ bảo trì và đồng bộ khi chỉnh theme

### 3. Logo MyTicket trong email

Đã thêm cơ chế nạp logo từ file:

- `FE/src/assets/myticket_logo.png`

Thông qua helper:

- `getLogoAttachment()`

Logo được đính kèm vào email dưới dạng inline attachment bằng `cid` để hiển thị trong phần đầu email.

### 4. Icon mạng xã hội dạng minh họa

Đã thêm các social badge trong footer email bằng helper:

- `renderSocialBadge(label, background)`

Các badge hiện đang hiển thị minh họa cho:

- Facebook
- Instagram
- YouTube
- TikTok

Lưu ý:

- đây là icon minh họa dạng badge chữ trong email HTML
- chưa gắn link thật tới tài khoản mạng xã hội cụ thể

### 5. Chuẩn hóa ngôn ngữ hiển thị tiếng Việt có dấu

Đã chuyển các nội dung hiển thị trước đây còn không dấu sang tiếng Việt có dấu, bao gồm:

- tiêu đề email
- preview text
- nhãn trong header và footer
- lời chào, mô tả, cảnh báo, ghi chú
- nhãn thông tin sự kiện, hóa đơn, hoàn tiền, khảo sát
- alt text của ảnh QR

Không chuyển ngữ đối với:

- tên riêng như `MyTicket`
- keyword như `OTP`, `QR`
- tên nền tảng mạng xã hội như `TikTok`

## Các helper mới được thêm

### 1. `escapeHtml(value)`

Mục đích:

- escape dữ liệu đầu vào trước khi chèn vào HTML email
- tránh lỗi hiển thị hoặc chèn HTML ngoài ý muốn

### 2. `getLogoAttachment()`

Mục đích:

- đọc file logo MyTicket từ frontend asset
- cache lại trong memory để không phải đọc file lặp lại mỗi lần gửi mail
- trả về object attachment cho `nodemailer`

### 3. `renderSocialBadge(label, background)`

Mục đích:

- tạo badge mạng xã hội dạng tròn với màu riêng cho từng nền tảng

### 4. `renderEmailLayout(...)`

Mục đích:

- render toàn bộ khung HTML email dùng chung

Layout mới gồm:

- header nền đậm
- logo MyTicket
- dòng nhãn nhỏ (`eyebrow`)
- tiêu đề chính (`title`)
- phần nội dung riêng (`introHtml`, `bodyHtml`)
- footer hỗ trợ khách hàng
- email hỗ trợ, địa chỉ, số điện thoại
- badge mạng xã hội

Phần text tĩnh trong layout cũng đã được chuẩn hóa sang tiếng Việt có dấu, ví dụ:

- `Cần hỗ trợ thêm?`
- `Địa chỉ`
- `Điện thoại`

### 5. `buildMailOptions(...)`

Mục đích:

- gom phần dựng `mailOptions` vào một chỗ
- tự động gắn logo nếu có
- gắn layout email dùng chung
- nhận thêm attachments riêng cho từng loại email nếu cần, ví dụ QR vé điện tử

## Những hàm đã được làm mới giao diện

### 1. `sendAccountConfirmation(...)`

Đã làm mới:

- phần chào người dùng rõ ràng hơn
- mã OTP hiển thị trong khối nổi bật ở giữa email
- có ghi chú thời hạn OTP trong một khối cảnh báo nhẹ
- có footer thương hiệu dùng chung
- toàn bộ text hiển thị dùng tiếng Việt có dấu

### 2. `sendNewPassword(...)`

Đã làm mới:

- mật khẩu mới được hiển thị trong khối nổi bật
- phần nhắc đổi lại mật khẩu sau khi đăng nhập rõ ràng hơn
- có cảnh báo không chia sẻ mật khẩu
- có footer thương hiệu dùng chung
- toàn bộ text hiển thị dùng tiếng Việt có dấu

### 3. `sendBookingConfirmation(...)`

Đã làm mới:

- tiêu đề và phần giới thiệu chuyên nghiệp hơn
- thông tin sự kiện được đưa vào một khối tóm tắt riêng
- các vé điện tử hiển thị thành từng card rõ ràng
- nút xem vé điện tử được trình bày nổi bật hơn
- QR vẫn giữ nguyên luồng hoạt động hiện tại
- footer hỗ trợ khách hàng và branding được áp dụng thống nhất
- toàn bộ text hiển thị dùng tiếng Việt có dấu, bao gồm cả alt text của QR
- phần header của email booking dùng nền trắng
- dòng `Đặt vé thành công` hiển thị màu đỏ
- vùng body của email booking dùng nền xanh dương đậm trước đây của header, nhưng vẫn giữ nguyên nền của các card thông tin và card vé

### 4. `sendInvoiceReceipt(...)`

Đã làm mới:

- thông tin hóa đơn được đưa vào khối tóm tắt rõ ràng
- bố cục dễ đọc hơn so với trước
- toàn bộ text hiển thị dùng tiếng Việt có dấu

### 5. `sendEventUpdate(...)`

Đã làm mới:

- nội dung cập nhật được đưa vào card riêng
- tiêu đề và phần mở đầu mang tính thông báo chuyên nghiệp hơn
- toàn bộ text hiển thị dùng tiếng Việt có dấu

### 6. `sendEventReminder(...)`

Đã làm mới:

- nhắc nhở sự kiện được trình bày như một thẻ sự kiện
- ngày diễn ra và địa điểm được hiển thị nổi bật hơn
- toàn bộ text hiển thị dùng tiếng Việt có dấu

### 7. `sendRefundNotification(...)`

Đã làm mới:

- phần tiền hoàn được hiển thị rõ trong khối riêng
- lời văn chuyên nghiệp và rõ trạng thái hơn
- toàn bộ text hiển thị dùng tiếng Việt có dấu

### 8. `sendPostEventSurvey(...)`

Đã làm mới:

- có lời mời khảo sát chuyên nghiệp hơn
- nút tham gia khảo sát nổi bật thay vì chỉ hiển thị link text đơn giản
- toàn bộ text hiển thị dùng tiếng Việt có dấu

## Dữ liệu đầu vào có bị thay đổi không

Không.

Tất cả các hàm vẫn nhận cùng dữ liệu như trước. Việc thay đổi chỉ nằm ở:

- cách hiển thị nội dung
- cách bọc nội dung vào layout dùng chung
- cách thêm thông tin thương hiệu cố định

Nói cách khác:

- không bớt input
- không thêm yêu cầu input bắt buộc mới cho các hàm cũ
- không thay đổi luồng gọi từ controller sang service
- không dịch tên riêng và keyword kỹ thuật không cần thiết
- chỉ bổ sung khả năng tùy biến giao diện layout để áp dụng riêng cho từng loại email khi cần

## Dữ liệu mới có được lưu vào database không

Không.

Những thứ được thêm vào như:

- logo MyTicket
- email hỗ trợ
- địa chỉ
- số điện thoại
- social badge
- layout HTML dùng chung

đều chỉ được dựng trong quá trình gửi email.

Không có dữ liệu nào mới được lưu vào:

- MongoDB
- file upload riêng
- bảng/collection mới

## Công cụ và thư viện sử dụng

Trong thay đổi này đang dùng:

- `nodemailer`: gửi email
- `fs` từ Node.js: đọc file logo
- `path` từ Node.js: resolve đường dẫn logo
- `fileURLToPath` từ Node.js: lấy đường dẫn file hiện tại trong môi trường ES Module

Không thêm thư viện ngoài mới.

## Nơi lưu data và cache

### 1. Logo MyTicket

Nguồn logo hiện tại:

- `FE/src/assets/myticket_logo.png`

Khi gửi email:

- logo được đọc từ file system
- được cache trong biến `cachedLogoAttachment`
- dùng lại cho các lần gửi email sau trong cùng tiến trình Node.js

Logo không được ghi vào database.

### 2. Nội dung email HTML

Chỉ được dựng động trong runtime, không lưu lại sau khi gửi.

### 3. Attachment riêng của email vé điện tử

QR vé điện tử vẫn đi theo luồng attachment riêng đang có sẵn, không bị loại bỏ.

## Kết quả mong đợi sau khi chỉnh sửa

Sau khi cập nhật:

- tất cả email có giao diện đồng bộ hơn
- có nhận diện thương hiệu MyTicket rõ hơn
- phần hỗ trợ khách hàng hiển thị chuyên nghiệp hơn
- nội dung từng email dễ đọc hơn
- những thông tin quan trọng như OTP, mật khẩu, link vé, QR, hóa đơn, khảo sát đều nổi bật hơn

## Gợi ý kiểm tra lại

Nên gửi test tối thiểu các email sau:

1. Xác nhận tài khoản
2. Cấp lại mật khẩu
3. Xác nhận đặt vé
4. Hóa đơn thanh toán
5. Nhắc nhở sự kiện

Kỳ vọng:

- logo hiển thị ở đầu email
- footer có email hỗ trợ, địa chỉ, số điện thoại
- social badge xuất hiện ở cuối email
- nội dung chính không bị mất dữ liệu so với trước
- email vé điện tử vẫn giữ được QR và link đang hoạt động