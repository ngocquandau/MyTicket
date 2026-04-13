# Handover: Rich Text Cho Mô Tả Sự Kiện

## 1. Mục tiêu

Chức năng này được bổ sung để phần mô tả sự kiện không còn bị giới hạn ở ô nhập văn bản thuần, đồng thời khắc phục lỗi hiển thị xuống dòng bị dính thành một đoạn văn khi xem lại hoặc hiển thị cho user.

Sau khi triển khai:

- Admin có thể định dạng mô tả sự kiện với các format cơ bản.
- Nội dung mô tả được giữ nguyên xuống dòng, danh sách và căn chỉnh khi chỉnh sửa lại.
- Nội dung mô tả hiển thị đúng ở trang admin, organizer và trang chi tiết sự kiện phía user.

---

## 2. Các format đang hỗ trợ

Trong màn hình tạo/chỉnh sửa sự kiện, editor hiện hỗ trợ các nhóm định dạng sau:

- Cỡ chữ
- Font chữ
- Heading
- Chữ đậm, nghiêng, gạch chân, gạch ngang
- Màu chữ và màu nền
- Căn trái, căn phải, căn giữa, căn đều
- Danh sách thứ tự và danh sách bullet
- Tăng/giảm thụt lề
- Blockquote
- Link
- Xuống dòng và tách đoạn

---

## 3. Phạm vi thay đổi

Chỉ thay đổi ở Frontend, không chỉnh Backend.

Các file chính đã tác động:

- `FE/src/pages/admin/EventInforPage/index.tsx`
- `FE/src/pages/organizer/EventInforPage/index.tsx`
- `FE/src/pages/client/EventDetail/index.tsx`
- `FE/src/utils/richText.ts`
- `FE/src/index.css`
- `FE/package.json`
- `FE/package-lock.json`

---

## 4. Thư viện được thêm vào FE

Đã cài thêm các package sau:

- `react-quill`
- `quill`
- `dompurify`

Vai trò của từng package:

- `react-quill`: cung cấp rich text editor trong React.
- `quill`: engine editor phía dưới.
- `dompurify`: làm sạch HTML trước khi render để giảm rủi ro XSS.

---

## 5. Cách hoạt động

### 5.1. Khi admin tạo hoặc chỉnh sửa sự kiện

Thay vì dùng `Input.TextArea`, trường mô tả đã được thay bằng `ReactQuill` trong file:

- `FE/src/pages/admin/EventInforPage/index.tsx`

Editor sẽ lưu dữ liệu mô tả dưới dạng HTML string.

Ví dụ dữ liệu lưu có thể giống như:

```html
<h2>Giới thiệu sự kiện</h2>
<p>Sự kiện dành cho người yêu công nghệ.</p>
<ul>
  <li>Diễn giả khách mời</li>
  <li>Hoạt động networking</li>
</ul>
```

### 5.2. Khi mở lại để chỉnh sửa

Nếu mô tả cũ đã ở dạng HTML thì editor hiển thị lại nguyên trạng.

Nếu mô tả cũ chỉ là text thường, hệ thống sẽ tự chuẩn hóa sang dạng HTML đơn giản để:

- giữ xuống dòng
- giữ tách đoạn
- tránh mất nội dung khi đưa vào editor

Phần này được xử lý trong helper:

- `FE/src/utils/richText.ts`

Hàm chính:

- `normalizeRichTextContent`

### 5.3. Khi hiển thị mô tả

Ở các màn hình xem chi tiết, mô tả không còn render kiểu text thường nữa mà render HTML đã được sanitize.

Điều này giúp:

- giữ đúng format
- giữ đúng list
- giữ đúng căn lề
- giữ đúng xuống dòng

Hàm dùng để render an toàn:

- `sanitizeRichText`

---

## 6. Các điểm hiển thị đã được cập nhật

### 6.1. Admin xem chi tiết sự kiện

Trong modal chi tiết ở:

- `FE/src/pages/admin/EventInforPage/index.tsx`

Mô tả được render bằng HTML đã sanitize thay vì hiển thị text thuần.

### 6.2. Organizer xem chi tiết sự kiện

Trong modal chi tiết ở:

- `FE/src/pages/organizer/EventInforPage/index.tsx`

Mô tả cũng được render đúng format.

Ngoài ra, khi organizer tìm kiếm theo mô tả, hệ thống sẽ bóc text từ HTML để search vẫn hoạt động bình thường.

Hàm hỗ trợ:

- `stripRichText`

### 6.3. User xem trang chi tiết sự kiện

Trong phần giới thiệu ở:

- `FE/src/pages/client/EventDetail/index.tsx`

Mô tả được hiển thị đúng rich text, không còn bị dính thành một đoạn văn.

---

## 7. CSS hỗ trợ hiển thị rich text

File:

- `FE/src/index.css`

Đã bổ sung các class để:

- tăng chiều cao vùng editor
- hiển thị đoạn văn rõ ràng
- hiển thị list đúng khoảng cách
- hiển thị heading dễ đọc hơn
- hỗ trợ class căn lề của Quill như `ql-align-center`, `ql-align-right`, `ql-align-justify`

Class chính đang dùng:

- `.event-description-editor`
- `.rich-text-content`

---

## 8. Khả năng tương thích với dữ liệu cũ

Chức năng này có xử lý tương thích với dữ liệu mô tả cũ đã lưu trước đây dưới dạng text thường.

Điều đó có nghĩa là:

- Không bắt buộc phải migrate dữ liệu cũ ở Backend.
- Mô tả cũ vẫn hiển thị được.
- Khi admin mở ra chỉnh sửa lại và lưu, dữ liệu sẽ dần chuyển sang dạng HTML có cấu trúc hơn.

---

## 9. Lưu ý kỹ thuật

### 9.1. Không chỉnh Backend

Toàn bộ chức năng này được làm hoàn toàn ở FE.

Backend vẫn chỉ nhận trường `description` như trước, chỉ khác là giá trị gửi lên bây giờ có thể là HTML string.

### 9.2. Bảo mật khi render

Do mô tả được lưu dưới dạng HTML, cần sanitize trước khi render.

Vì vậy đã dùng `dompurify` để làm sạch nội dung trước khi đưa vào `dangerouslySetInnerHTML`.

### 9.3. Bundle tăng kích thước

Sau khi thêm editor, bundle FE tăng đáng kể vì thư viện rich text tương đối nặng.

Nếu sau này cần tối ưu thêm, có thể cân nhắc:

- lazy load editor chỉ khi mở modal tạo/chỉnh sửa sự kiện
- tách chunk riêng cho phần admin event editor

---

## 10. Cách kiểm thử nhanh

### Case 1: Tạo mới mô tả có format

1. Vào trang admin quản lý sự kiện.
2. Tạo mới một sự kiện.
3. Trong ô mô tả, nhập nhiều đoạn văn.
4. Thử thêm đậm, nghiêng, gạch chân, list, căn giữa.
5. Lưu lại.

Kết quả mong đợi:

- Lưu thành công.
- Mở lại modal chỉnh sửa vẫn giữ nguyên format.

### Case 2: Hiển thị phía user

1. Mở trang chi tiết sự kiện phía client.

Kết quả mong đợi:

- Xuống dòng vẫn đúng.
- List hiển thị đúng.
- Định dạng chữ giữ nguyên.

### Case 3: Dữ liệu mô tả cũ

1. Mở một sự kiện cũ đã nhập mô tả kiểu text thường.
2. Vào chỉnh sửa.
3. Kiểm tra nội dung có được đưa vào editor và không bị mất dòng.
4. Lưu lại.

Kết quả mong đợi:

- Nội dung vẫn đọc được.
- Sau khi lưu, lần xem sau hiển thị ổn định hơn.

---

## 11. Hướng mở rộng sau này

Nếu cần nâng cấp tiếp, có thể bổ sung:

- chèn ảnh trực tiếp vào mô tả
- chèn video hoặc embed link
- preset style cho mô tả sự kiện
- preview realtime ngay trong modal tạo/chỉnh sửa
- tách riêng bộ editor dùng chung cho nhiều form khác trong hệ thống