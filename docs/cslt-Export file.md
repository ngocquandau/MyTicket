# Cơ sở lý thuyết cho chức năng export file PDF/CSV danh sách khách hàng mua vé của role organizer

## 1. Tổng quan chức năng

Chức năng export danh sách khách hàng mua vé theo từng sự kiện là một chức năng nghiệp vụ quan trọng trong phân hệ dành cho `organizer` của hệ thống MyTicket. Mục tiêu của chức năng này là cho phép ban tổ chức xem và trích xuất danh sách người đã mua vé của một sự kiện cụ thể, phục vụ các nhu cầu đối soát, chăm sóc khách hàng, xác nhận thông tin trước sự kiện và hỗ trợ công tác vận hành tại điểm check-in. Về mặt kỹ thuật, chức năng này không chỉ đơn thuần là một nút tải file, mà là một quy trình phối hợp giữa frontend, backend, hệ thống xác thực, cơ sở dữ liệu và các thư viện xuất tài liệu.

Trong implementation hiện tại, organizer mở danh sách khách hàng trong một modal thuộc trang quản lý sự kiện. Dữ liệu khách hàng được lấy động từ backend thông qua một API chuyên biệt, chỉ trả về những đơn hàng đã thanh toán thành công. Sau khi dữ liệu được hiển thị trên bảng, frontend cho phép xuất sang hai định dạng phổ biến nhất là `CSV` và `PDF`. CSV phù hợp cho việc tiếp tục xử lý bằng spreadsheet như Microsoft Excel hoặc Google Sheets, trong khi PDF phù hợp cho việc lưu trữ, in ấn và chia sẻ dưới dạng tài liệu có bố cục cố định.

Từ góc nhìn kiến trúc, đây là một chức năng tiêu biểu vì nó cho thấy cách hệ thống web full-stack giải quyết một bài toán thực tế: backend chịu trách nhiệm tổng hợp dữ liệu chính xác và kiểm soát quyền truy cập, frontend chịu trách nhiệm trình bày, tạo file và kích hoạt tải xuống trên trình duyệt. Vì vậy, phần cơ sở lý thuyết cần làm rõ vai trò của từng ngôn ngữ lập trình, framework, thư viện và công nghệ tham gia vào luồng export này.

## 2. Ngôn ngữ lập trình được sử dụng

### 2.1 TypeScript ở phía frontend

Frontend của MyTicket được phát triển bằng TypeScript kết hợp React. TypeScript là ngôn ngữ mở rộng từ JavaScript, bổ sung hệ thống kiểu dữ liệu tĩnh nhằm phát hiện lỗi sớm ngay trong quá trình phát triển. Đối với chức năng export danh sách khách hàng, TypeScript giúp định nghĩa rõ cấu trúc của mỗi dòng dữ liệu attendee thông qua các interface như `AttendeeRow`, gồm các trường như họ tên khách hàng, email, số điện thoại, mã vé, hạng vé, ghế, loại ghế, giá vé, phương thức thanh toán và thời điểm mua.

Lợi ích của TypeScript trong chức năng này thể hiện ở chỗ frontend phải xử lý một bảng dữ liệu có nhiều cột, cần mapping từ JSON trả về từ backend sang cấu trúc hiển thị trong giao diện và tiếp tục tái sử dụng chính cấu trúc đó để sinh file CSV và PDF. Khi các trường dữ liệu được khai báo rõ ràng, khả năng nhầm lẫn giữa các cột sẽ giảm đi, giúp việc bảo trì và mở rộng sau này thuận lợi hơn.

### 2.2 JavaScript ở phía backend

Phần backend của MyTicket được xây dựng bằng JavaScript chuẩn ES Modules. JavaScript ở backend phù hợp với hệ thống web cần xử lý request HTTP, truy vấn MongoDB, kiểm tra quyền truy cập và tổng hợp dữ liệu từ nhiều collection khác nhau. Trong chức năng export danh sách khách hàng, backend không sinh file CSV hay PDF trực tiếp mà cung cấp một API tổng hợp dữ liệu attendee cho frontend. JavaScript được dùng để thực hiện các tác vụ sau:

- kiểm tra người đăng nhập có phải organizer hợp lệ hay không;
- kiểm tra sự kiện có thuộc đúng organizer đang truy cập hay không;
- truy vấn `Purchase`, `Ticket`, `User` và `TicketClass`;
- tổng hợp dữ liệu thành danh sách attendee phẳng để frontend dễ dàng render và export.

Vì sử dụng cùng một hệ sinh thái JavaScript/TypeScript cho cả frontend và backend, hệ thống giảm được chi phí chuyển đổi công nghệ và dễ đồng bộ về mặt nghiệp vụ giữa hai đầu.

## 3. Framework và nền tảng phát triển

### 3.1 Node.js

Node.js là môi trường chạy JavaScript phía server và là nền tảng của backend MyTicket. Điểm mạnh của Node.js là xử lý bất đồng bộ hiệu quả, phù hợp với các ứng dụng web có nhiều request truy cập đồng thời. Trong chức năng export danh sách khách hàng, Node.js hỗ trợ backend tiếp nhận request từ organizer, truy vấn dữ liệu đơn mua đã thanh toán, ghép thông tin người mua và vé, sau đó trả về JSON cho frontend.

Node.js phù hợp với bài toán này vì nó không bắt buộc backend phải lưu trữ trước các file export. Dữ liệu chỉ được tổng hợp khi organizer yêu cầu, sau đó frontend tự quyết định cách tạo CSV hoặc PDF. Cách tổ chức này giúp hệ thống linh hoạt và giảm tải lưu trữ tệp trên server.

### 3.2 Express.js

Express.js là framework backend được xây dựng trên Node.js, có vai trò tổ chức route và middleware cho REST API. Trong chức năng này, Express định nghĩa endpoint chính:

```txt
GET /api/organizer/:id/events/:eventId/attendees
```

Endpoint này là điểm vào kỹ thuật cho toàn bộ chức năng export. Khi organizer muốn xem hoặc tải danh sách khách hàng, frontend sẽ gọi API này để lấy dữ liệu attendee. Express kết hợp với middleware `verifyToken` để đảm bảo request đã được xác thực. Sau đó controller kiểm tra thêm về vai trò và quyền sở hữu dữ liệu. Điều này cho thấy Express không chỉ làm nhiệm vụ điều hướng request, mà còn đóng vai trò then chốt trong việc bảo vệ dữ liệu nghiệp vụ nhạy cảm.

### 3.3 ReactJS

ReactJS là thư viện xây dựng giao diện được sử dụng ở frontend. Trong chức năng export danh sách khách hàng, React có vai trò quản lý trạng thái dữ liệu attendee, hiển thị bảng trong modal và gắn các hành động export vào nút bấm. Khi organizer chọn xem khách hàng của một sự kiện, React cập nhật state `attendeeEvent`, `attendeeRows`, `attendeeLoading` và mở modal để hiển thị bảng dữ liệu.

Lợi ích của React ở đây nằm ở cơ chế cập nhật giao diện theo state. Cùng một nguồn dữ liệu `attendeeRows` được sử dụng cho cả ba mục đích:

- hiển thị bảng danh sách khách hàng trong modal;
- tạo nội dung CSV;
- tạo nội dung PDF.

Điều này giúp tránh lặp lại logic lấy dữ liệu và đảm bảo file export luôn nhất quán với bảng mà organizer đang nhìn thấy trên màn hình.

### 3.4 Ant Design

Ant Design là thư viện giao diện chính được sử dụng ở khu vực organizer. Trong chức năng này, Ant Design cung cấp nhiều component quan trọng như `Table`, `Modal`, `Button`, `Input`, `Space`, `Typography` và `message`. Những component này tạo nên một giao diện thao tác rõ ràng cho organizer:

- danh sách sự kiện được hiển thị trên bảng;
- nút action cho phép mở modal khách hàng;
- trong modal có bảng attendee và hai nút export CSV/PDF;
- thông báo được hiển thị khi không có dữ liệu hoặc có lỗi xảy ra.

Về mặt lý thuyết, sử dụng một thư viện UI component như Ant Design giúp hệ thống tăng tính đồng bộ giao diện, giảm thời gian phát triển và dễ mở rộng thêm các thao tác quản lý dữ liệu phức tạp.

## 4. Thư viện và công nghệ trực tiếp phục vụ export PDF/CSV

### 4.1 jsPDF

`jsPDF` là thư viện được sử dụng để tạo file PDF trực tiếp trên frontend. Trong chức năng hiện tại, khi organizer bấm nút export PDF, frontend tạo một đối tượng `jsPDF` với cấu hình trang ngang `landscape`, đơn vị `pt` và khổ giấy `a4`. Sau đó hệ thống chèn tiêu đề tài liệu và truyền dữ liệu bảng attendee vào plugin `jspdf-autotable` để vẽ bảng dữ liệu trên file PDF.

Vai trò của `jsPDF` là tạo bộ khung tài liệu PDF và hỗ trợ thao tác lưu tệp xuống máy người dùng thông qua lệnh `doc.save(...)`. Ưu điểm của giải pháp này là file được tạo ngay trên trình duyệt, không cần backend phải render tài liệu, nhờ đó giảm tải cho server và rút ngắn thời gian phản hồi.

### 4.2 jspdf-autotable

`jspdf-autotable` là plugin mở rộng của `jsPDF`, cho phép sinh bảng dữ liệu có nhiều cột và nhiều dòng một cách có cấu trúc. Nếu chỉ dùng `jsPDF` thuần, việc căn lề, xuống dòng, đặt tiêu đề cột và canh chiều rộng cho bảng sẽ phức tạp hơn nhiều. Plugin này giải quyết bài toán đó bằng cách nhận vào danh sách tiêu đề và dữ liệu body, sau đó tự động tính toán bố cục bảng.

Trong chức năng export hiện tại, `jspdf-autotable` được dùng để xuất các cột như tên khách hàng, email, số điện thoại, mã vé, hạng vé, ghế, loại ghế, giá vé, hình thức thanh toán và thời điểm mua. Về mặt cơ sở lý thuyết, đây là thư viện phù hợp cho những bài toán xuất báo cáo bảng biểu từ dữ liệu động. Nó giúp file PDF dễ đọc hơn, có tính chuyên nghiệp hơn và dễ in ấn hơn so với việc ghi text thủ công từng dòng.

### 4.3 Blob API và cơ chế download trên trình duyệt

Khác với PDF, file CSV trong implementation hiện tại không sử dụng một thư viện chuyên biệt để tạo tệp mà được tạo trực tiếp bằng các API có sẵn của trình duyệt. Frontend ghép từng dòng dữ liệu thành một chuỗi CSV, thêm `BOM` ký tự `\uFEFF` để hỗ trợ UTF-8, sau đó tạo `Blob` với MIME type `text/csv;charset=utf-8;`. Tiếp theo, hệ thống tạo `object URL` và gán vào một phần tử `a` tạm thời, rồi kích hoạt `click()` để tải file xuống máy.

Về mặt kỹ thuật, đây là một giải pháp đơn giản nhưng hiệu quả cho bài toán export CSV. Nó không cần thư viện ngoài, không cần request thêm lên server và phù hợp với các bộ dữ liệu được frontend đã nắm sẵn trong bộ nhớ. Ngoài ra, việc thêm BOM giúp dữ liệu tiếng Việt hiển thị đúng hơn khi mở bằng các phần mềm spreadsheet phổ biến.

### 4.4 Axios

Frontend sử dụng `axiosClient`, được xây dựng trên thư viện Axios, để giao tiếp với backend. Trong chức năng export này, Axios có vai trò lấy dữ liệu attendee từ API organizer trước khi export. Cụ thể, khi organizer mở modal danh sách khách hàng, frontend gọi:

```txt
/api/organizer/${organizerId}/events/${event._id}/attendees
```

Sau khi nhận JSON phản hồi, frontend map dữ liệu về `AttendeeRow[]`, sắp xếp theo tên khách hàng, rồi dùng chính mảng đó cho việc render bảng và export file. Axios do đó đóng vai trò cầu nối giữa lớp giao diện và lớp nghiệp vụ dữ liệu.

### 4.5 MongoDB và Mongoose

Chức năng export danh sách khách hàng phụ thuộc trực tiếp vào dữ liệu nghiệp vụ lưu trong MongoDB và được truy vấn thông qua Mongoose. Backend cần ghép dữ liệu từ nhiều thực thể:

- `Purchase` để biết đơn hàng nào đã thanh toán thành công;
- `User` để lấy thông tin người mua;
- `TicketClass` để lấy tên hạng vé, giá vé và loại chỗ ngồi;
- `Ticket` để lấy mã vé và số ghế thực tế;
- `Event` để xác minh sự kiện thuộc organizer nào.

Mongoose đóng vai trò quan trọng vì nó hỗ trợ `populate`, giúp backend tổng hợp dữ liệu tham chiếu giữa các collection mà không cần frontend phải gọi nhiều API riêng lẻ. Về lý thuyết, đây là mô hình xử lý dữ liệu tập trung ở backend, giúp frontend đơn giản hơn và giảm nguy cơ sai lệch dữ liệu khi export.

### 4.6 JWT và middleware xác thực

Dữ liệu khách hàng mua vé là dữ liệu nhạy cảm, do đó chức năng export bắt buộc phải kèm cơ chế xác thực và phân quyền. Hệ thống đang sử dụng token dạng JWT và middleware `verifyToken` trong backend để xác minh người gọi API đã đăng nhập. Sau khi middleware giải mã token, controller tiếp tục kiểm tra `req.user.role` có phải `organizer` hoặc `admin` hay không, đồng thời đảm bảo organizer chỉ được xem dữ liệu sự kiện của chính mình.

Điều này có ý nghĩa lớn trong báo cáo đồ án, vì nó cho thấy chức năng export không chỉ được xây dựng theo hướng dễ dùng, mà còn được xây dựng theo hướng an toàn dữ liệu và phân quyền nghiệp vụ.

## 5. Cơ chế hoạt động của chức năng export

### 5.1 Lấy dữ liệu attendee từ backend

Luồng xử lý bắt đầu khi organizer nhấn vào action xem khách hàng trên một sự kiện cụ thể. Frontend trước tiên lấy `organizerId` từ API `/api/organizer/me`, sau đó gọi endpoint attendees với `eventId` từ sự kiện đang được chọn. Backend nhận request và thực hiện các bước:

1. xác thực người dùng từ token;
2. kiểm tra vai trò có hợp lệ hay không;
3. kiểm tra sự kiện có đúng thuộc organizer đang truy cập hay không;
4. truy vấn các đơn mua có `paymentStatus = paid`;
5. populate thông tin user và hạng vé;
6. truy vấn danh sách `Ticket` theo các `purchaseId`;
7. ghép dữ liệu thành danh sách attendee phẳng để trả về frontend.

Cách làm này cho thấy backend đảm nhận phần nghiệp vụ và xử lý dữ liệu, trong khi frontend nhận một dataset đã đủ được chuẩn hóa để phục vụ hiển thị và export.

### 5.2 Hiển thị dữ liệu trong modal

Sau khi frontend nhận danh sách attendees, dữ liệu được map thành mảng `AttendeeRow[]` và sắp xếp theo tên khách hàng. Bảng attendee được hiển thị trong `Modal` bằng component `Table` của Ant Design. Việc hiển thị dữ liệu trước khi export có ý nghĩa quan trọng: organizer được kiểm tra dữ liệu ngay trên màn hình trước khi quyết định tải xuống tệp.

Cùng một mảng dữ liệu attendee được tái sử dụng cho cả giao diện và file export, nhờ đó tránh tình trạng giao diện hiển thị một kiểu còn tệp tải về lại dữ liệu khác.

### 5.3 Export CSV

Khi người dùng bấm `Export CSV`, frontend kiểm tra xem `attendeeRows` có rỗng hay không. Nếu có dữ liệu, hệ thống tạo mảng header cố định và mảng các dòng dữ liệu từ danh sách attendee. Trước khi nối thành chuỗi CSV, frontend sử dụng một hàm `escapeCsv(...)` để xử lý các trường hợp có dấu phẩy, dấu nháy kép hoặc xuống dòng. Bước này rất quan trọng về mặt kỹ thuật, vì nếu không escape đúng chuẩn thì file CSV có thể bị vỡ cấu trúc khi mở trong Excel hoặc Google Sheets.

Sau khi hoàn tất chuỗi CSV, hệ thống tạo `Blob`, sinh `object URL`, tạo thẻ `a` tạm thời, gán tên tệp theo tên sự kiện và tự động kích hoạt tải xuống. Tên tệp được chuẩn hóa theo định dạng không dấu và in hoa, giúp tránh lỗi font và giúp file dễ quản lý hơn trong môi trường văn phòng.

### 5.4 Export PDF

Khi người dùng bấm `Export PDF`, frontend tạo đối tượng `jsPDF`, thêm tiêu đề cho tài liệu, sau đó gọi `autoTable(...)` để đưa dữ liệu attendee vào bảng. Plugin tự động xử lý dòng cột, padding, màu tiêu đề và bố cục bảng trên trang A4 nằm ngang. Cuối cùng, tệp được lưu bằng `doc.save(...)`.

Về mặt cơ sở lý thuyết, file PDF có ưu điểm là giữ nguyên bố cục và dễ chia sẻ trong bối cảnh cần tài liệu chính thức. Nếu organizer cần gửi danh sách cho nhân sự check-in, in ra giấy hoặc lưu trữ làm hồ sơ, PDF là định dạng phù hợp hơn CSV.

## 6. Luồng thực thi và logic xử lý

### 6.1 Luồng mở danh sách khách hàng của một sự kiện

Luồng xử lý bắt đầu từ trang quản lý sự kiện của organizer. Khi organizer đăng nhập, frontend trước tiên gọi API `/api/organizer/me` để xác định `organizerId` phù hợp với token hiện tại. Tiếp theo, frontend gọi API `/api/organizer/:id/events` để lấy danh sách các sự kiện mà organizer được phép quản lý. Danh sách này được hiển thị trên bảng sự kiện trong `EventInforPage`.

Khi organizer bấm vào icon xem khách hàng ở cột `Action`, frontend gọi hàm `openAttendeeModal(event)`. Hàm này mở modal, đặt trạng thái loading, sau đó gửi request tới endpoint `/api/organizer/${organizerId}/events/${event._id}/attendees`. Kết quả trả về là một danh sách attendee đã được backend tổng hợp sẵn. Frontend map dữ liệu này thành `AttendeeRow[]`, sắp xếp theo tên khách hàng và hiển thị bằng Ant Design trong modal.

Trình tự xử lý:

1. frontend gọi `/api/organizer/me` để lấy `organizerId`;
2. frontend gọi `/api/organizer/:id/events` để hiển thị danh sách sự kiện;
3. organizer chọn một sự kiện và bấm xem khách hàng;
4. frontend gọi `/api/organizer/:id/events/:eventId/attendees`;
5. frontend nhận `attendeeRows` và render bảng trong modal.

### 6.2 Logic tổng hợp attendee ở backend

Tại backend, controller `getEventAttendeesForOrganizer` là nơi xử lý nghiệp vụ chính. Đầu tiên, controller kiểm tra request đã đăng nhập hay chưa và role có phải `organizer` hoặc `admin` hay không. Sau đó backend tìm organizer theo `organizerId`, đồng thời đối chiếu với `req.user.id` để đảm bảo organizer chỉ có thể xem dữ liệu của chính mình. Nếu sự kiện không thuộc organizer đó, request sẽ bị từ chối.

Sau khi qua bước phân quyền, backend truy vấn `Purchase` với điều kiện `event = eventId` và `paymentStatus = paid`. Mỗi purchase được populate thêm `user` và `ticketClass`. Tiếp theo, backend truy vấn collection `Ticket` theo danh sách `purchaseIds`, group ticket theo từng purchase, rồi flatten thành từng dòng attendee. Nếu một purchase không có document ticket cụ thể, controller tạo fallback row để vẫn giữ được thông tin người mua và đơn hàng trong kết quả trả về.

Logic tổng hợp này quan trọng ở chỗ nó biến dữ liệu nghiệp vụ phân tán thành một dataset phẳng, để frontend không cần tự tư duy lại quan hệ giữa purchase, ticket, user và ticketClass. Nhờ đó giao diện và chức năng export đơn giản hơn rất nhiều.

Trình tự xử lý ở backend:

1. kiểm tra token và role;
2. xác minh organizer và event;
3. truy vấn `Purchase` đã thanh toán thành công;
4. populate thông tin `User` và `TicketClass`;
5. truy vấn `Ticket` theo `purchaseIds`;
6. group ticket theo purchase;
7. flatten thành `attendees[]`;
8. trả JSON cho frontend.

### 6.3 Luồng hiển thị và chuẩn hóa dữ liệu ở frontend

Sau khi nhận JSON từ backend, frontend không đưa dữ liệu vào bảng ngay lập tức mà còn qua bước chuẩn hóa. Trong `openAttendeeModal(...)`, frontend map mỗi phần tử attendee thành một `AttendeeRow` có các trường được đảm bảo tồn tại, nếu thiếu sẽ thay bằng ký hiệu `'—'`. Ngoài ra, giá vé được chuyển sang `number`, thời điểm mua được format sang `toLocaleString('vi-VN')`, và danh sách được sắp xếp theo `customerName`.

Bước chuẩn hóa này có vai trò quan trọng về mặt kỹ thuật vì nó tách biệt dữ liệu nghiệp vụ trả về từ backend với dữ liệu hiển thị cụ thể của giao diện. Nhờ vậy, các hàm export CSV và PDF có thể dùng chung một mảng `attendeeRows` đã sạch và nhất quán, không cần tự xử lý thêm logic thiếu dữ liệu ở mỗi nơi.

### 6.4 Luồng export CSV

Khi organizer bấm `Export CSV`, frontend gọi `exportAttendeesCsv()`. Hàm này trước tiên kiểm tra danh sách attendee có rỗng hay không. Nếu có dữ liệu, hệ thống tạo một dòng header cố định, sau đó map từng attendee thành một dòng dữ liệu. Trước khi ghép thành chuỗi CSV, hàm `escapeCsv(...)` được sử dụng để xử lý các trường hợp ký tự đặc biệt như dấu phẩy, dấu nháy kép và xuống dòng, nhằm tránh vỡ cấu trúc tệp khi mở trong Excel hoặc Google Sheets.

Sau khi tạo xong nội dung CSV, frontend thêm BOM `\uFEFF` để tăng khả năng hiển thị đúng tiếng Việt, tạo `Blob`, sinh `object URL`, tạo một phần tử `a` tạm thời và kích hoạt tải tệp xuống máy. Tên tệp được tạo động theo tên sự kiện đã được bỏ dấu và viết hoa để tránh lỗi encoding.

Trình tự xử lý:

1. kiểm tra `attendeeRows` có dữ liệu hay không;
2. tạo header CSV;
3. map `attendeeRows` thành danh sách dòng dữ liệu;
4. escape các trường ký tự đặc biệt;
5. ghép thành chuỗi CSV + BOM UTF-8;
6. tạo `Blob` và `object URL`;
7. kích hoạt tải tệp `.csv` trên trình duyệt.

### 6.5 Luồng export PDF

Khi organizer bấm `Export PDF`, frontend gọi `exportAttendeesPdf()`. Hàm này tạo một đối tượng `jsPDF` với cấu hình trang ngang A4, đặt tiêu đề cho tài liệu, sau đó truyền tiêu đề cột và dữ liệu attendee vào `autoTable(...)`. Plugin `jspdf-autotable` sẽ tự động sinh bảng, căn cột, chia hàng và tô màu hàng tiêu đề.

Sau khi bảng dữ liệu được dựng xong, frontend gọi `doc.save(...)` để tải tệp PDF xuống máy. Từ góc nhìn logic xử lý, luồng PDF và luồng CSV đều dùng chung nguồn dữ liệu `attendeeRows`, nhưng PDF ưu tiên một bố cục tài liệu cố định và dễ in ấn hơn.

Trình tự xử lý:

1. kiểm tra `attendeeRows` có dữ liệu hay không;
2. tạo `jsPDF` với cấu hình trang ngang A4;
3. chèn tiêu đề tài liệu;
4. gọi `autoTable(...)` với header và body từ attendeeRows;
5. lưu file bằng `doc.save(...)`.

### 6.6 Mối quan hệ giữa giao diện, API và export file

Một điểm quan trọng trong implementation hiện tại là backend không tạo file CSV/PDF sẵn mà chỉ trả dataset attendee. Frontend mới là nơi quyết định định dạng export và thực hiện tải xuống tệp. Cách tách trách nhiệm này tạo ra một logic rất rõ ràng:

- backend chịu trách nhiệm đúng dữ liệu và phân quyền;
- frontend chịu trách nhiệm hiển thị và tạo tài liệu;
- cùng một nguồn dữ liệu attendee được tái sử dụng cho xem bảng, export CSV và export PDF.

Từ góc nhìn kiến trúc, đây là một mô hình hợp lý cho hệ thống web hiện đại, vì nó giữ backend gọn, dễ mở rộng và tránh phải quản lý các tệp tạm trên server.

## 7. Lý do lựa chọn tập công nghệ hiện tại

Tập công nghệ được chọn cho chức năng export này là hợp lý và thực dụng. React và TypeScript phù hợp với bài toán giao diện cần thao tác dữ liệu phong phú và cần tái sử dụng state. Axios giúp frontend lấy dữ liệu attendee từ backend một cách rõ ràng. `jsPDF` và `jspdf-autotable` đáp ứng tốt bài toán xuất PDF bảng biểu ngay trên client, trong khi Blob API của trình duyệt cho phép tạo CSV không cần thư viện bổ sung. Backend dùng Node.js, Express, MongoDB và Mongoose để tổng hợp dữ liệu attendee một cách chính xác và kiểm soát quyền truy cập.

Sự kết hợp này đem lại nhiều ưu điểm:

- giảm tải cho backend vì việc tạo file được đẩy xuống frontend;
- frontend chủ động tạo được nhiều định dạng tệp khác nhau từ cùng một nguồn dữ liệu;
- backend tập trung vào nghiệp vụ và phân quyền;
- dễ mở rộng thêm định dạng export khác trong tương lai như Excel hoặc in phiếu check-in.

## 8. Vai trò của chức năng trong hệ thống organizer

Chức năng export PDF/CSV danh sách khách hàng là một chức năng tiêu biểu cho phân hệ organizer vì nó liên kết trực tiếp giữa dữ liệu thanh toán và nghiệp vụ vận hành sự kiện. Thông qua chức năng này, organizer có thể nhanh chóng nắm được ai đã mua vé, loại vé nào đã được bán, cách thanh toán ra sao và thời điểm mua hàng. Đây là cơ sở để thực hiện các công việc quan trọng như:

- đối soát danh sách khách hàng trước sự kiện;
- liên hệ lại người mua khi cần thông báo;
- tổng hợp báo cáo bán vé phục vụ vận hành nội bộ;
- hỗ trợ bộ phận check-in tại địa điểm sự kiện.

Về mặt kỹ thuật, đây là một minh chứng rõ ràng cho khả năng xây dựng hệ thống web full-stack có phân quyền, có tổng hợp dữ liệu nghiệp vụ và có xuất tài liệu phục vụ công tác thực tế.

## 9. Kết luận

Từ góc nhìn cơ sở lý thuyết, chức năng export file PDF/CSV danh sách khách hàng mua vé của role organizer được xây dựng trên sự kết hợp hợp lý giữa nhiều thành phần công nghệ. TypeScript và React đảm bảo giao diện có cấu trúc rõ ràng và dễ quản lý state. Axios đóng vai trò kết nối frontend với backend. `jsPDF` và `jspdf-autotable` phục vụ bài toán xuất PDF, trong khi Blob API của trình duyệt hỗ trợ sinh CSV hiệu quả ngay trên client. Ở phía server, Node.js, Express, MongoDB, Mongoose và middleware xác thực đảm bảo dữ liệu attendee được tổng hợp đúng và an toàn.

Nhờ tập công nghệ này, hệ thống MyTicket không chỉ hiển thị được danh sách khách hàng cho organizer mà còn cho phép trích xuất dữ liệu dưới dạng tài liệu phục vụ vận hành sự kiện trong thực tế. Đây là một chức năng có giá trị ứng dụng cao và phù hợp để đưa vào báo cáo đồ án tốt nghiệp như một ví dụ điển hình của việc áp dụng công nghệ web hiện đại vào bài toán quản lý sự kiện.
