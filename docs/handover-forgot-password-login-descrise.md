# Tài liệu bàn giao: Chức năng Quên mật khẩu và Đổi mật khẩu (User/Organizer/Admin)

## 1) Mục tiêu nghiệp vụ
Chức năng này giúp người dùng, ban tổ chức (organizer) và admin:
- Có thể lấy lại mật khẩu nhanh khi quên mật khẩu tại màn hình đăng nhập.
- Đăng nhập bằng mật khẩu mới được cấp qua email.
- Được điều hướng ngay đến trang hồ sơ để đổi lại mật khẩu chủ động.
- Có khu vực đổi mật khẩu trực tiếp trong trang hồ sơ hoặc trang setting theo từng role.

Mục tiêu chính:
- Giảm tỷ lệ bỏ phiên đăng nhập khi quên mật khẩu.
- Tăng mức an toàn tài khoản sau khi reset mật khẩu.
- Đồng nhất trải nghiệm cho cả user, organizer và admin.

---

## 2) Phạm vi triển khai
- Chỉ triển khai ở FE (giao diện + luồng người dùng).
- Sử dụng lại API BE đã có sẵn, không thay đổi logic backend.

---

## 3) Trải nghiệm người dùng sau cập nhật

## 3.1 Tại màn hình đăng nhập
1. Người dùng bấm Quên mật khẩu.
2. Nhập email đã đăng ký.
3. Hệ thống gửi mật khẩu mới ngẫu nhiên qua email (nếu email tồn tại).
4. Người dùng đăng nhập lại bằng mật khẩu mới.

## 3.2 Điều hướng sau đăng nhập bằng mật khẩu reset
- Nếu là user: chuyển thẳng đến trang Hồ sơ người dùng (`/profile`).
- Nếu là organizer: chuyển thẳng đến trang Hồ sơ organizer (`/organizer/profile`).
- Nếu là admin: chuyển thẳng đến trang Setting admin (`/admin/settings`).
- Kèm thông báo nhắc đổi mật khẩu ngay để đảm bảo an toàn.

## 3.3 Tại trang hồ sơ / setting
- User và organizer có mục Bảo mật tài khoản trong trang hồ sơ.
- Admin có mục Bảo mật tài khoản trong trang Setting.
- Form đổi mật khẩu được ẩn mặc định, chỉ hiện khi bấm nút Đổi mật khẩu.
- Có kiểm tra xác nhận mật khẩu khớp và độ dài tối thiểu.

---

## 4) Các API đã dùng và công dụng

## API 1: Quên mật khẩu
- Endpoint: `POST /api/user/forgot-password`
- Công dụng:
  - Kiểm tra email có tồn tại tài khoản hay không.
  - Nếu có, backend tạo mật khẩu mới, lưu lại (đã hash) và gửi qua email.
- Dùng ở đâu trên FE:
  - Popup Quên mật khẩu trong modal đăng nhập.

## API 2: Đăng nhập
- Endpoint: `POST /api/user/login`
- Công dụng:
  - Xác thực email + mật khẩu.
  - Trả token để người dùng đăng nhập vào hệ thống.
- Dùng ở đâu trên FE:
  - Nút Đăng nhập trong modal đăng nhập.

## API 3: Cập nhật hồ sơ (đổi mật khẩu)
- Endpoint: `PUT /api/user/profile`
- Công dụng:
  - Cập nhật thông tin hồ sơ của tài khoản hiện tại.
  - Khi gửi kèm trường password, hệ thống đổi mật khẩu cho tài khoản đó.
- Dùng ở đâu trên FE:
  - Form đổi mật khẩu tại profile user.
  - Form đổi mật khẩu tại profile organizer.
  - Form đổi mật khẩu tại setting admin.

## API 4: Lấy danh sách organizer (phục vụ luồng organizer sau đăng nhập)
- Endpoint FE đang gọi: `GET /api/organizer`
- Công dụng:
  - Sau đăng nhập organizer, FE lấy dữ liệu organizer để ánh xạ và lưu organizerId.
- Ghi chú:
  - API này không phải trọng tâm của quên mật khẩu, nhưng nằm trong cùng luồng đăng nhập organizer.

---

## 5) Cơ chế an toàn trong luồng reset mật khẩu
- FE tạm lưu email vừa reset trong session để nhận biết lần đăng nhập ngay sau reset.
- Nếu email đăng nhập trùng email vừa reset:
  - Bỏ điều hướng tạm khác (nếu có).
  - Ưu tiên vào trang hồ sơ để đổi mật khẩu ngay.
- Sau khi điều hướng xong, dữ liệu nhận biết này được xóa để không ảnh hưởng các lần đăng nhập sau.

---

## 6) Kết quả đạt được
- Luồng quên mật khẩu đã hoạt động cho cả user, organizer và admin.
- Luồng đổi mật khẩu đã có ở profile user, profile organizer và setting admin.
- Giao diện đổi mật khẩu đã được làm rõ và dễ thao tác hơn:
  - Nút chính nổi bật.
  - Form có bố cục rõ ràng.
  - Trạng thái ẩn/hiện gọn gàng, không gây rối màn hình.
- Menu admin đã được đổi từ `Messages` sang `Setting` để phản ánh đúng chức năng thực tế.

---

## 7) Các kịch bản kiểm thử đề xuất cho UAT
1. Quên mật khẩu với email hợp lệ (user/organizer/admin): nhận email và đăng nhập được.
2. Quên mật khẩu với email không tồn tại: hiển thị thông báo lỗi phù hợp.
3. Đăng nhập bằng mật khẩu mới:
- user vào `/profile`
- organizer vào `/organizer/profile`
- admin vào `/admin/settings`
4. Đổi mật khẩu thành công trong profile của user.
5. Đổi mật khẩu thành công trong profile của organizer.
6. Đổi mật khẩu thành công trong setting của admin.
7. Xác nhận mật khẩu không khớp: hiển thị lỗi và không cho submit.

---

## 8) Ghi chú cho stakeholder
- Không cần thay đổi hạ tầng hoặc API mới để vận hành chức năng này.
- Chức năng đã đảm bảo cân bằng giữa tiện lợi (khôi phục nhanh) và an toàn (ép đổi mật khẩu sau reset).
- Có thể truyền thông cho người dùng bằng thông báo ngắn: “Sau khi nhận mật khẩu mới qua email, vui lòng đổi lại mật khẩu riêng của bạn trong Hồ sơ hoặc Setting.”
