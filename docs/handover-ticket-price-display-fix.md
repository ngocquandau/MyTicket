# Handover sửa lỗi hiển thị giá vé

## Mục tiêu

Tổng kết nguyên nhân và hướng xử lý cho lỗi sau:

- Một số sự kiện đã tạo vé thành công và trang chi tiết vẫn hiện bảng giá vé bình thường.
- Nhưng ở trang HomePage, trang kết quả tìm kiếm và phần `Giá vé chỉ từ` của trang chi tiết lại hiển thị `Đang cập nhật`.

## Nguyên nhân gốc

### 1. Dữ liệu giá vé ở trang danh sách đang đọc sai nguồn

Các trang danh sách như HomePage và SearchResultPage dùng hàm `getMinPrice(ev.tickets)` để tính giá thấp nhất.

Tuy nhiên API danh sách sự kiện `GET /api/event` trong file `BE/controllers/eventController.js` không trả về trường `tickets`. API này chỉ trả các field cơ bản của event như:

- `_id`
- `title`
- `genre`
- `status`
- `posterURL`
- `organizer`
- `location`
- `startDateTime`
- `endDateTime`
- `createdAt`

Kết quả là `ev.tickets` ở HomePage và SearchResultPage thường là `undefined`, nên giao diện luôn rơi vào nhánh `Đang cập nhật`.

### 2. Trang chi tiết đang loại bỏ vé miễn phí `0đ`

Trang chi tiết sự kiện không dùng `ev.tickets` từ event list API mà lấy danh sách vé thật bằng API riêng `GET /api/event/:id/tickets`, nên bảng giá vé bên dưới vẫn hiển thị đúng.

Tuy nhiên phần `Giá vé chỉ từ` ở đầu trang chi tiết lại tính `minPrice` bằng cách lọc các giá `> 0`.

Điều này gây ra lỗi với sự kiện miễn phí:

- Vé có giá `0`
- Sau khi lọc `> 0`, mảng giá bị rỗng
- Giao diện hiểu nhầm là chưa có dữ liệu và hiển thị `Đang cập nhật`

## Hướng xử lý

### Hướng 1. Sửa backend để API danh sách trả sẵn giá vé tối thiểu

Thay vì để frontend phụ thuộc vào `ev.tickets`, backend `getAllEvents` được bổ sung bước gom nhóm từ `TicketClass` để trả thêm:

- `minTicketPrice`
- `ticketClassCount`

Nhờ đó, các trang danh sách có thể hiển thị giá vé ngay từ API danh sách mà không cần gọi API vé riêng cho từng sự kiện.

### Hướng 2. Sửa frontend để dùng `minTicketPrice`

HomePage và SearchResultPage được sửa để:

- Ưu tiên dùng `event.minTicketPrice`
- Hiển thị `Miễn phí` nếu `minTicketPrice === 0`
- Chỉ fallback sang `event.tickets` nếu cần tương thích dữ liệu cũ

### Hướng 3. Sửa trang chi tiết để xử lý đúng vé miễn phí

`EventDetail` được sửa để:

- Không loại bỏ giá `0`
- Nếu giá thấp nhất bằng `0` thì hiển thị `Miễn phí`
- Chỉ hiển thị `Đang cập nhật` khi thật sự không có dữ liệu vé

## File đã sửa

### 1. `BE/controllers/eventController.js`

Phần đã sửa:

- Sau khi lấy danh sách `events`, bổ sung truy vấn aggregate trên `TicketClass`
- Tính `minTicketPrice` và `ticketClassCount` theo từng event
- Trả `events: enrichedEvents` thay vì trả thẳng `events`

Ý nghĩa:

- API `GET /api/event` nay đã có đủ dữ liệu để các trang danh sách hiển thị giá vé đúng

### 2. `FE/src/pages/client/HomePage/index.tsx`

Phần đã sửa:

- Thay hàm `getMinPrice(tickets)` bằng `getMinPrice(event)`
- Ưu tiên đọc `event.minTicketPrice`
- Xử lý đúng các trường hợp:
  - `minTicketPrice > 0` -> `Từ ... VND`
  - `minTicketPrice === 0` -> `Miễn phí`
  - không có dữ liệu -> `Đang cập nhật`
- Các chỗ render giá đổi từ `getMinPrice(ev.tickets)` sang `getMinPrice(ev)`

Ý nghĩa:

- Trang HomePage không còn phụ thuộc vào `ev.tickets` vốn không có từ list API

### 3. `FE/src/pages/client/SreachResultPage/index.tsx`

Phần đã sửa:

- Cập nhật logic `getMinPrice` giống HomePage
- Đổi phần render từ `getMinPrice(ev.tickets)` sang `getMinPrice(ev)`

Ý nghĩa:

- Trang kết quả tìm kiếm hiển thị đúng giá vé thấp nhất hoặc `Miễn phí`

### 4. `FE/src/pages/client/EventDetail/index.tsx`

Phần đã sửa:

- Logic tính `minPrice` từ `ticketsDisplay` không còn loại bỏ giá `0`
- Phần hiển thị `Giá vé chỉ từ` đổi sang:
  - `Đang cập nhật` nếu `minPrice === null`
  - `Miễn phí` nếu `minPrice === 0`
  - `${minPrice.toLocaleString('vi-VN')} VND` với vé có giá

Ý nghĩa:

- Event miễn phí không còn bị hiển thị sai thành `Đang cập nhật`

## Tóm tắt logic sau khi sửa

### Ở HomePage và SearchResultPage

- Lấy danh sách sự kiện từ `GET /api/event`
- Mỗi event đã có thêm `minTicketPrice`
- Frontend dùng `minTicketPrice` để hiển thị giá

### Ở EventDetail

- Lấy danh sách vé thật từ `GET /api/event/:id/tickets`
- Tính lại `minPrice` từ dữ liệu vé hiện có
- Hỗ trợ cả trường hợp vé miễn phí `0đ`

## Kết quả mong đợi sau khi áp dụng

- Sự kiện có vé trả phí sẽ hiển thị `Từ ... VND` ở HomePage
- Sự kiện miễn phí sẽ hiển thị `Miễn phí` ở HomePage
- Trang kết quả tìm kiếm hiển thị giá đúng như HomePage
- Phần `Giá vé chỉ từ` của trang chi tiết hiển thị đúng cả với vé `0đ`
- Chỉ những sự kiện thực sự chưa có vé mới hiển thị `Đang cập nhật`

## Gợi ý kiểm tra lại

Nên test tối thiểu 3 trường hợp:

1. Sự kiện có vé trả phí
2. Sự kiện chỉ có vé miễn phí
3. Sự kiện chưa tạo vé

Kỳ vọng:

- Trường hợp 1: hiển thị `Từ ... VND`
- Trường hợp 2: hiển thị `Miễn phí`
- Trường hợp 3: hiển thị `Đang cập nhật`