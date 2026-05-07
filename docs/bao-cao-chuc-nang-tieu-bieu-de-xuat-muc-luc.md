# Đề xuất vị trí trình bày 2 chức năng tiêu biểu trong báo cáo đồ án

## 1. Mục đích tài liệu

Tài liệu này giúp đặt hai chức năng tiêu biểu vào đúng vị trí trong mục lục hiện có, tránh tình trạng một chức năng bị mô tả rải rác nhưng thiếu ý. Cách sắp xếp bên dưới ưu tiên đủ bốn lớp nội dung: công nghệ sử dụng, quy trình xử lý, tầm quan trọng và vị trí trong kiến trúc hệ thống.

Hai chức năng được xét là:

1. Mã QR code trong lịch sử vé và email xác nhận vé.
2. Ban tổ chức xuất file CSV/PDF danh sách khách hàng mua vé của một sự kiện cụ thể.

## 2. Nguyên tắc chèn nội dung vào báo cáo

Để bài viết gọn mà vẫn đủ ý, tôi đề xuất cách chia như sau:

1. Chương 3 chỉ nói ngắn về công nghệ nào được dùng.
2. Chương 5 mô tả actor, luồng hoạt động và tương tác giữa các thành phần.
3. Chương 6 phân tích sâu hơn về kiến trúc, dữ liệu và trách nhiệm của từng khối xử lý.
4. Chương 8 tập trung vào phần hiện thực giao diện, ảnh chụp màn hình và kết quả chạy thật.

Nhờ vậy, cùng một chức năng sẽ được trình bày đủ chiều sâu nhưng không bị lặp nguyên văn giữa các chương.

## 3. Chức năng 1: Mã QR code trong lịch sử vé và email xác nhận vé

### 3.1 Bản chất chức năng

Đây là chức năng nối liền ba thời điểm quan trọng của hành trình người dùng: sau thanh toán thành công, khi nhận email xác nhận và khi mở lại vé trong mục `Vé của tôi`. Về mặt kỹ thuật, hệ thống vừa phải sinh mã QR đúng cho từng vé, vừa phải đảm bảo QR dẫn tới đúng trang vé điện tử công khai, đồng thời chỉ phục vụ cho vé đã thanh toán thành công.

### 3.2 Nên chèn vào những mục nào trong mục lục

| Mục trong báo cáo | Nên chèn nội dung gì | Lý do nên đặt ở đây |
| --- | --- | --- |
| 3.1.2 ReactJS | Nêu frontend dùng React để hiển thị lịch sử vé, modal QR và trang vé điện tử. | Đây là phần giao diện mà người dùng tương tác trực tiếp khi mở QR trong tài khoản. |
| 3.4.2 Nodemailer trong hệ thống gửi email thông báo và xác thực | Nên đổi cách viết nội dung thành dịch vụ email giao dịch, đồng thời ghi rõ luồng hiện tại đang dùng SendGrid để gửi email vé. | Chức năng QR trong email phụ thuộc trực tiếp vào hạ tầng gửi mail. Nếu giữ tên tiểu mục hiện tại, bạn vẫn có thể giải thích đây là nhóm công nghệ email và nêu rõ SDK thực tế đang chạy là SendGrid. |
| 3.4.3 PayOS & Webhooks | Nêu QR/email chỉ được kích hoạt sau khi webhook xác nhận giao dịch thành công. | Đây là mắt xích bảo đảm tính đúng đắn của thời điểm phát hành vé điện tử. |
| 4.1.1 Đối với tất cả người dùng | Thêm yêu cầu chức năng kiểu: người dùng xem được vé đã thanh toán, mở QR check-in và nhận email xác nhận có kèm đường dẫn vé điện tử. | Đây là yêu cầu nghiệp vụ ở góc nhìn người dùng cuối. |
| 4.2.1.a Xác thực và Phân quyền | Nêu API tải QR riêng tư yêu cầu token hợp lệ; chỉ chủ vé hoặc admin mới truy cập được. | Phần này làm rõ vì sao QR không bị phát tán tùy tiện qua API nội bộ. |
| 4.2.9 Tích hợp Bên thứ ba | Nêu sự phối hợp giữa hệ thống MyTicket với PayOS và dịch vụ email. | Chức năng này không chỉ là UI mà còn phụ thuộc vào dịch vụ ngoài. |
| 5.1.1.b Mua vé | Chèn use case phụ: sau thanh toán thành công, hệ thống phát hành vé điện tử và gửi email xác nhận có mã QR. | QR/email phát sinh từ quy trình mua vé, không phải chức năng tách rời hoàn toàn. |
| 5.1.1.c Xem lịch sử mua vé | Chèn use case phụ: người dùng mở mục `Vé của tôi`, xem QR check-in và tải ảnh QR. | Đây là điểm chạm giao diện rõ nhất để minh họa giá trị của QR đối với người dùng. |
| 5.2.1.a Activity Diagram cho Người dùng - Mua vé sự kiện | Bổ sung các bước: thanh toán thành công, webhook cập nhật đơn hàng, hệ thống tạo vé, sinh QR, gửi email. | Đây là nơi phù hợp để mô tả logic xử lý end-to-end. |
| 5.3.1 Chức năng mua vé dành cho người dùng | Trong sequence diagram, thêm các lifeline: FE, Payment API, PayOS, Purchase Service, Ticket Service, Email Service. | Đây là phần quan trọng nhất nếu bạn muốn thể hiện chiều sâu kỹ thuật của chức năng QR/email. |
| 6.1 Kiến trúc hệ thống | Đặt chức năng này vào khối `Ứng dụng khách`, `Dịch vụ mua vé`, `Dịch vụ thanh toán`, `Dịch vụ thông báo`, `Dữ liệu vé`. | Chức năng trải qua nhiều lớp hệ thống, rất phù hợp để giải thích kiến trúc. |
| 6.2 Thiết kế Database | Minh họa quan hệ `Purchase - Ticket - TicketClass - Event - User`. | QR chỉ có ý nghĩa khi gắn đúng với bản ghi vé và đơn hàng đã thanh toán. |
| 8.1.7 Tiến hành thanh toán | Mô tả điều kiện phát sinh email vé sau thanh toán thành công. | Phần này cho thấy QR không được tạo tùy tiện trước khi thanh toán hoàn tất. |
| 8.1.8 Trang Lịch sử mua vé | Đây là mục chính để chèn ảnh giao diện modal QR, nút tải QR và mô tả thao tác của người dùng. | Phần hiện thực nhìn thấy rõ nhất nằm ở đây. |

### 3.3 Quy trình xử lý nên viết trong báo cáo

Bạn có thể mô tả theo chuỗi logic ngắn nhưng chặt như sau:

1. Người dùng hoàn tất thanh toán cho đơn mua vé.
2. PayOS gửi webhook về backend để xác nhận giao dịch thành công.
3. Backend cập nhật `paymentStatus = paid`, bảo đảm đơn hàng ở trạng thái hợp lệ để phát hành vé điện tử.
4. Hệ thống rà soát hoặc tạo đủ bản ghi `Ticket` tương ứng với số lượng vé đã mua.
5. Với từng vé, backend tạo đường dẫn công khai tới trang thông tin vé điện tử và sinh ảnh QR bằng thư viện `qrcode`.
6. Email xác nhận vé được gửi tới người mua, trong đó mỗi vé có thể đi kèm QR và liên kết truy cập nhanh.
7. Ở mục `Vé của tôi`, frontend tiếp tục render QR preview để người dùng xem nhanh và gọi API backend khi cần tải file QR về máy.
8. Khi người dùng quét QR, hệ thống mở trang vé điện tử công khai để hiển thị thông tin vé đã thanh toán.

### 3.4 Tầm quan trọng nên nhấn mạnh

| Góc nhìn | Ý chính nên viết |
| --- | --- |
| Nghiệp vụ | Chức năng này biến một giao dịch thanh toán thành vé điện tử có thể sử dụng ngay, rút ngắn khoảng cách giữa mua vé và check-in. |
| Trải nghiệm người dùng | Người mua không cần tìm lại email cũ hoặc ghi nhớ mã vé thủ công, vì có thể truy cập từ cả email lẫn lịch sử vé. |
| Độ tin cậy | Chỉ khi đơn hàng được xác nhận `paid` thì QR mới có giá trị sử dụng, giúp hạn chế tình trạng phát hành vé sai thời điểm. |
| Khả năng mở rộng | Kiến trúc hiện tại đủ nền để phát triển tiếp thành luồng quét check-in tại cổng hoặc xác minh trạng thái vé theo thời gian thực. |

### 3.5 Nên đặt ở khối nào trong kiến trúc hệ thống

Trong sơ đồ kiến trúc hệ thống ở mục 6.1, tôi đề xuất biểu diễn chức năng này qua các khối sau:

1. Khối giao diện người dùng: hiển thị lịch sử vé, modal QR và trang vé điện tử.
2. Khối dịch vụ nghiệp vụ vé: quản lý purchase, ticket, ticket class và logic cấp vé sau thanh toán.
3. Khối tích hợp thanh toán: tiếp nhận webhook từ PayOS để xác nhận giao dịch.
4. Khối thông báo: tạo và gửi email vé có kèm QR.
5. Khối dữ liệu: MongoDB lưu purchase, ticket, event, user để truy xuất đúng vé tương ứng.

Nếu vẽ sơ đồ kiến trúc, bạn nên nối chức năng QR/email qua cả luồng nội bộ lẫn luồng tích hợp bên thứ ba, vì đây là điểm thể hiện rõ nhất đặc trưng hệ thống client-server nhiều dịch vụ phối hợp.

## 4. Chức năng 2: Organizer xuất file CSV/PDF danh sách khách hàng mua vé theo sự kiện

### 4.1 Bản chất chức năng

Đây là chức năng hỗ trợ tác nghiệp cho ban tổ chức. Hệ thống không chỉ hiển thị danh sách người mua vé của một sự kiện mà còn gom dữ liệu từ nhiều collection, chuẩn hóa lại thành bảng nghiệp vụ và cho phép xuất nhanh ra hai định dạng phổ biến là CSV và PDF.

### 4.2 Nên chèn vào những mục nào trong mục lục

| Mục trong báo cáo | Nên chèn nội dung gì | Lý do nên đặt ở đây |
| --- | --- | --- |
| 3.1.2 ReactJS | Nêu organizer portal được xây dựng bằng React và có modal danh sách khách hàng theo sự kiện. | Đây là nơi hiện thực trực tiếp thao tác mở danh sách và export file. |
| 3.2.1 Hệ quản trị cơ sở dữ liệu MongoDB | Nêu dữ liệu attendee được tổng hợp từ nhiều document như purchase, ticket, user, ticket class, event. | Chức năng này phản ánh rõ lợi ích của mô hình document và liên kết dữ liệu nghiệp vụ. |
| 3.4 Các dịch vụ tích hợp và tiện ích hỗ trợ | Bổ sung mô tả ngắn về `jsPDF`, `jspdf-autotable` và xử lý Blob/CSV ở frontend. | Đây là nhóm thư viện trực tiếp phục vụ export tài liệu, rất nên nêu ở phần công nghệ dùng trong bài. |
| 4.1.2 Đối với tất cả Ban tổ chức sự kiện | Thêm yêu cầu chức năng kiểu: organizer xem danh sách khách hàng đã thanh toán và xuất dữ liệu phục vụ đối soát, chăm sóc khách hàng và chuẩn bị sự kiện. | Chức năng này đúng bản chất là yêu cầu nghiệp vụ cho vai trò organizer. |
| 4.2.5 Khả năng Bảo trì | Nêu dữ liệu export được chuẩn hóa từ cùng một endpoint, tránh tách logic rời rạc giữa xem bảng và tải file. | Đây là một điểm cộng khi trình bày thiết kế gọn, dễ bảo trì. |
| 4.2.7 Khả năng Sử dụng và Trải nghiệm Người dùng | Nêu organizer có thể xem trước dữ liệu trong modal rồi mới chọn export định dạng phù hợp. | Chức năng này mạnh ở tính tiện dụng cho người vận hành. |
| 5.1.2.b Theo dõi thông tin sự kiện | Chèn use case phụ: organizer xem khách mua vé của từng sự kiện và xuất danh sách khách hàng. | Trong mục lục hiện tại chưa có use case riêng cho attendee/export, nên gắn vào nhóm theo dõi thông tin sự kiện là hợp lý nhất. |
| 5.2.2.b Theo dõi thông tin sự kiện | Trong activity diagram, thêm nhánh thao tác: mở danh sách khách, tải dữ liệu, xuất CSV hoặc PDF. | Đây là nơi phù hợp để mô tả hành vi nghiệp vụ của organizer. |
| 6.1 Kiến trúc hệ thống | Đặt chức năng vào khối `Organizer Portal`, `Organizer API`, `Data Aggregation`, `Export Document`. | Chức năng này thể hiện rõ cách frontend và backend phối hợp để tổng hợp dữ liệu và sinh tài liệu. |
| 6.2 Thiết kế Database | Minh họa các quan hệ `Organizer - Event - Purchase - Ticket - User - TicketClass`. | Đây là chức năng gần như không thể giải thích trọn vẹn nếu bỏ qua mô hình dữ liệu. |
| 8.2.2 Trang thông tin sự kiện | Đây là mục chính để chèn hình giao diện modal attendee, bảng dữ liệu, nút export CSV/PDF. | Toàn bộ phần hiện thực người dùng organizer nhìn thấy đều nằm ở màn hình này. |

### 4.3 Quy trình xử lý nên viết trong báo cáo

Bạn có thể trình bày theo luồng sau:

1. Organizer truy cập màn hình quản lý thông tin sự kiện của mình.
2. Khi chọn một sự kiện cụ thể, frontend gọi API lấy `organizerId` của tài khoản đang đăng nhập.
3. Frontend gửi request tới endpoint lấy danh sách khách mua vé theo `eventId`.
4. Backend kiểm tra token, vai trò người dùng và quyền sở hữu dữ liệu của organizer.
5. Hệ thống truy vấn các đơn hàng đã thanh toán thành công của sự kiện, đồng thời populate thông tin người mua và hạng vé.
6. Backend tiếp tục truy vấn danh sách `Ticket`, gom vé theo từng purchase rồi làm phẳng dữ liệu thành `attendees[]`, trong đó mỗi vé tương ứng một dòng dữ liệu dễ đọc đối với organizer.
7. Frontend hiển thị bảng attendee trong modal để người dùng kiểm tra ngay trên màn hình.
8. Nếu organizer chọn export, frontend dùng cùng dataset đó để sinh file CSV hoặc PDF mà không phải gọi thêm một luồng nghiệp vụ khác.

### 4.4 Tầm quan trọng nên nhấn mạnh

| Góc nhìn | Ý chính nên viết |
| --- | --- |
| Nghiệp vụ vận hành | Organizer có ngay danh sách khách hàng đã thanh toán để chuẩn bị check-in, chăm sóc khách VIP hoặc đối soát sau sự kiện. |
| Quản trị dữ liệu | Chức năng này cho thấy hệ thống không chỉ phục vụ người mua vé mà còn hỗ trợ phía nhà tổ chức khai thác dữ liệu một cách có kiểm soát. |
| Kỹ thuật | Điểm đáng nói nhất là backend phải tổng hợp dữ liệu từ nhiều nguồn rồi chuẩn hóa thành một tập dữ liệu chung đủ dùng cho cả hiển thị và export. |
| Tính thực tiễn | CSV thuận tiện để nhập lại vào Excel/Google Sheets, còn PDF phù hợp cho lưu trữ, in ấn hoặc gửi nội bộ nhanh. |

### 4.5 Nên đặt ở khối nào trong kiến trúc hệ thống

Trong sơ đồ kiến trúc hệ thống, chức năng này nên nằm chủ yếu ở bốn khối sau:

1. Khối Organizer Portal: nơi người dùng organizer xem bảng dữ liệu và chọn export.
2. Khối Organizer Service/API: nơi xác thực quyền, nhận request theo event và trả dữ liệu attendees.
3. Khối Data Aggregation: nơi backend ghép dữ liệu từ `Purchase`, `Ticket`, `User`, `TicketClass`, `Event` thành một cấu trúc export-ready.
4. Khối Export tài liệu phía client: nơi frontend chuyển dataset sang CSV hoặc PDF bằng `Blob`, `jsPDF`, `jspdf-autotable`.

Nếu muốn vẽ đẹp và dễ hiểu, bạn có thể xem đây là một chức năng nằm giữa lớp dữ liệu nghiệp vụ và lớp báo cáo vận hành của organizer.

## 5. Gợi ý cách phân bổ độ dài trong bài báo cáo

Để không viết lan man, bạn có thể phân bổ như sau:

1. Chương 3: mỗi chức năng chỉ cần 4 đến 7 dòng về công nghệ liên quan.
2. Chương 5: tập trung sơ đồ và luồng xử lý, tránh kể lại dài dòng phần thư viện.
3. Chương 6: đây là nơi nên viết kỹ nhất về trách nhiệm từng khối, dữ liệu vào ra và lý do thiết kế.
4. Chương 8: dùng ảnh giao diện thật, mô tả thao tác thực tế và kết quả người dùng nhận được.

## 6. Kết luận ngắn để bạn có thể dùng lại

Nếu cần chọn hai chức năng tiêu biểu để thể hiện chiều sâu của đồ án, đây là hai lựa chọn hợp lý vì chúng đại diện cho hai mặt khác nhau của hệ thống:

1. Chức năng QR/email đại diện cho luồng giao dịch và trải nghiệm người dùng sau thanh toán.
2. Chức năng export attendee đại diện cho năng lực quản trị vận hành và khai thác dữ liệu phía ban tổ chức.

Nói ngắn gọn, một chức năng cho thấy MyTicket xử lý tốt vòng đời vé điện tử, còn chức năng còn lại cho thấy hệ thống có giá trị thực tế đối với bên tổ chức sự kiện chứ không chỉ với người mua vé.