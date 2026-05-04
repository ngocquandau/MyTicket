# Báo cáo Test Backend MyTicket

## 1. Mục tiêu
Báo cáo này mô tả toàn bộ quá trình kiểm thử backend MyTicket, gồm:
- Xác thực và phân quyền người dùng.
- Kiểm thử các API quan trọng: user, event, purchase, payment.
- Đảm bảo không có lỗi regression khi thay đổi backend.
- Sử dụng test tự động để đảm bảo tính ổn định của hệ thống.

## 2. Môi trường test
- Node.js runtime.
- Test runner: `Jest`.
- API test với `Supertest`.
- MongoDB in-memory với `mongodb-memory-server`.
- Cấu hình ESM cho Jest bằng `node --experimental-vm-modules`.
- File backend tách riêng: `BE/app.js` export app, `BE/server.js` khởi chạy server.

## 3. Công cụ và thư viện sử dụng
- `jest`
- `supertest`
- `mongodb-memory-server`
- `bcryptjs`
- `jsonwebtoken`
- `mongoose`

## 4. Cấu trúc test
- `BE/tests/unit/authMiddleware.test.js`
- `BE/tests/integration/userRoutes.test.js`
- `BE/tests/integration/eventRoutes.test.js`
- `BE/tests/integration/purchaseRoutes.test.js`
- `BE/tests/integration/paymentRoutes.test.js`
- `BE/tests/setup.js` (kết nối MongoDB in-memory)
- `BE/tests/testUtils.js` (helper tạo user và lấy token đăng nhập)
- `BE/tests/test-report.md` (báo cáo kết quả)

## 5. Phương pháp kiểm thử
- Unit test cho middleware `verifyToken` và `verifyAdmin`.
- Integration test cho các route quan trọng với Express app.
- Dùng MongoDB in-memory để mô phỏng database sạch mỗi lần chạy.
- Không dùng DB thật hoặc các service ngoại vi trong test.

## 6. Test case chi tiết

### 6.1. Middleware xác thực
- `verifyToken` trả về 403 khi không có header Authorization.
- `verifyToken` trả về 401 khi token không hợp lệ.
- `verifyToken` trả về 403 khi user được xác thực nhưng `isActive` là false.
- `verifyToken` gọi `next()` khi token hợp lệ và user active.
- `verifyAdmin` trả về 401 khi `req.user` chưa có.
- `verifyAdmin` trả về 403 khi user không phải admin.
- `verifyAdmin` gọi `next()` khi user role là `admin`.

### 6.2. API User
- `POST /api/user`:
  - Tạo user mới thành công.
  - Trả về status `201`.
  - Response không bao gồm `password`.
- `POST /api/user/login`:
  - Trả về token khi đăng nhập đúng email/password.
  - Trả về 401 khi mật khẩu sai.
- `GET /api/user/profile`:
  - Truy vấn profile thành công khi token hợp lệ.
- `GET /api/user`:
  - Trả về 403 nếu user thường không có quyền admin.
  - Trả về danh sách user nếu user admin.

### 6.3. API Event
- `POST /api/event`:
  - Trả về 403 khi thiếu token.
  - Trả về 403 khi user không phải admin.
  - Tạo event thành công khi admin hợp lệ.
- `GET /api/event`:
  - Trả về danh sách event, ít nhất bao gồm event vừa tạo.

### 6.4. API Purchase
- `POST /api/purchases`:
  - Tạo đơn hàng mới thành công với `paymentStatus` là `pending`.
  - Kiểm tra luồng mua vé general.
- `GET /api/purchases/my-tickets`:
  - Chỉ trả về các đơn hàng có `paymentStatus` là `paid`.
  - Response có `ticketList`.

### 6.5. API Payment
- `POST /api/payment/create-url`:
  - Trả về 403 khi thiếu token.
  - Trả về 404 khi purchaseId không tồn tại.
- `POST /api/payment/payos-webhook`:
  - Mô phỏng webhook PayOS.
  - Cập nhật đơn hàng từ `pending` sang `paid` khi webhook hợp lệ.

## 7. Kết quả chạy test
- Tổng số test suite: 5
- Tổng số test case: 22
- Kết quả: `22 passed`
- Lệnh thực thi: `cd BE && npm test`
- Môi trường chạy: local, sử dụng MongoDB in-memory, không cần cấu hình DB thật.

## 8. Những thay đổi chính đã thực hiện
- Tách `BE/app.js` chỉ export Express app.
- Tạo `BE/server.js` để khởi động kết nối MongoDB và cron job.
- Thêm test middleware cho `verifyToken` và `verifyAdmin`.
- Thêm test route cho:
  - `POST /api/user`, `POST /api/user/login`, `GET /api/user/profile`, `GET /api/user`.
  - `POST /api/event`, `GET /api/event`.
  - `POST /api/purchases`, `GET /api/purchases/my-tickets`.
  - `POST /api/payment/create-url`, `POST /api/payment/payos-webhook`.
- Sửa controller `createUser` để trả về user không chứa password.
- Cấu hình `tests/setup.js` dùng `MongoMemoryReplSet` cho transaction Mongoose.

## 9. Gợi ý bổ sung cho đồ án
- Mở rộng test cho các route quan trọng khác: voucher, review, statistic, email.
- Thêm test cho các workflow thực tế như mua vé có voucher, hủy mua, tải QR.
- Triển khai CI/CD để chạy `npm test` tự động khi deploy.

## 10. Kết luận
Suite test hiện tại đã bao phủ các luồng cốt lõi của backend MyTicket và có thể dùng làm phần "báo cáo test" trong đồ án. Test đã được chạy thành công 22/22 cases, chứng tỏ backend hoạt động ổn định với các kịch bản cơ bản đã kiểm thử.
