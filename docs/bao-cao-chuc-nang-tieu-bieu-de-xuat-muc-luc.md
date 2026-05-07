# Nội dung 2 chức năng tiêu biểu theo đúng mục lục báo cáo

## 1. Cách sử dụng tài liệu này

File này được viết theo đúng tinh thần “mỗi nội dung thuộc mục nào trong mục lục báo cáo thì đặt ngay dưới tên mục đó”. Khi đưa vào bài báo cáo, có thể sao chép từng đoạn theo đúng mã mục tương ứng, không cần tự tách lại nội dung như bản trước.

Hai chức năng được trình bày gồm:

1. Mã QR code trong lịch sử vé và email xác nhận vé.
2. Ban tổ chức xuất file CSV/PDF danh sách khách hàng mua vé của một sự kiện cụ thể.

## 2. Chức năng 1: Mã QR code trong lịch sử vé và email xác nhận vé

### Thuộc mục 3.1.2 ReactJS

Trong chức năng mã QR code, ReactJS giữ vai trò xây dựng toàn bộ lớp giao diện mà người dùng trực tiếp thao tác sau khi thanh toán thành công. Cụ thể, React được dùng để hiện thực trang `Vé của tôi`, cửa sổ modal hiển thị QR và trang vé điện tử công khai khi người dùng quét mã hoặc bấm vào đường dẫn từ email. Việc sử dụng React giúp giao diện được tách thành các thành phần rõ ràng, dễ quản lý trạng thái và thuận tiện khi mở rộng thêm các hành vi như xem QR, tải QR hoặc chuyển sang trang chi tiết vé.

### Thuộc mục 3.4.2 Hệ thống gửi email thông báo và xác thực

Chức năng này sử dụng dịch vụ gửi email giao dịch để phát hành thông tin vé điện tử tới người mua ngay sau khi thanh toán hoàn tất. Trong hiện thực hiện tại, backend sử dụng SendGrid để gửi email HTML, trong đó mỗi vé có thể đi kèm đường dẫn truy cập nhanh và ảnh QR được nhúng trực tiếp vào nội dung thư. Cách làm này giúp email không chỉ mang tính thông báo mà còn trở thành một kênh truy cập vé điện tử thuận tiện cho người dùng trong thực tế.

### Thuộc mục 3.4.3 PayOS & Webhooks

PayOS giữ vai trò xác nhận tính hợp lệ của giao dịch trước khi hệ thống phát hành vé điện tử. Sau khi người dùng hoàn tất thanh toán, webhook từ PayOS được gửi về backend để thông báo rằng giao dịch đã thành công. Chỉ khi backend nhận được tín hiệu này và cập nhật đơn hàng sang trạng thái `paid`, hệ thống mới tiếp tục sinh mã QR, tạo đường dẫn vé điện tử và gửi email xác nhận. Cơ chế này giúp đồng bộ trạng thái thanh toán với trạng thái phát hành vé, hạn chế rủi ro cấp vé khi giao dịch chưa được xác nhận chính thức.

### Thuộc mục 4.1.1 Đối với tất cả người dùng

Đối với người dùng cuối, hệ thống cần đáp ứng yêu cầu cho phép truy cập lại vé điện tử một cách nhanh chóng sau khi thanh toán. Cụ thể, người dùng phải có khả năng nhận email xác nhận kèm đường dẫn và mã QR của vé, đồng thời xem lại mã QR tương ứng trong mục `Vé của tôi`. Đây là yêu cầu chức năng quan trọng vì nó ảnh hưởng trực tiếp tới trải nghiệm sử dụng vé và mức độ thuận tiện khi tham gia sự kiện.

### Thuộc mục 4.2.1.a Xác thực và Phân quyền

Mặc dù trang vé điện tử có thể được mở thông qua đường dẫn công khai, hệ thống vẫn phải kiểm soát chặt quyền truy cập đối với các API nội bộ liên quan đến quản lý vé. Ví dụ, API tải ảnh QR từ lịch sử vé yêu cầu người dùng phải đăng nhập hợp lệ và chỉ chủ sở hữu vé hoặc quản trị viên mới có quyền thao tác. Cách thiết kế này giúp cân bằng giữa tính thuận tiện trong sử dụng và yêu cầu bảo mật đối với dữ liệu vé điện tử.

### Thuộc mục 4.2.9 Tích hợp Bên thứ ba

Chức năng mã QR và email xác nhận vé là ví dụ rõ ràng cho việc hệ thống phụ thuộc vào các dịch vụ bên thứ ba trong quá trình vận hành. PayOS được sử dụng để xác nhận giao dịch, còn dịch vụ email giao dịch được dùng để phát hành thông tin vé tới người mua. Việc tích hợp này cho thấy hệ thống không hoạt động tách biệt, mà được thiết kế để phối hợp với các nền tảng ngoài nhằm hoàn thiện quy trình mua vé điện tử.

### Thuộc mục 5.1.1.b Mua vé

Trong use case mua vé, sau khi người dùng chọn hạng vé, số lượng vé và thanh toán thành công, hệ thống tiếp tục thực hiện bước phát hành vé điện tử. Ở bước này, mỗi vé hợp lệ được gán một đường dẫn truy cập riêng và được sinh mã QR tương ứng. Đồng thời, hệ thống gửi email xác nhận để người mua có thể sử dụng vé ngay mà không cần chờ xử lý thủ công từ phía ban tổ chức.

### Thuộc mục 5.1.1.c Xem lịch sử mua vé

Trong use case xem lịch sử mua vé, người dùng có thể truy cập mục `Vé của tôi` để kiểm tra các đơn hàng đã thanh toán và xem danh sách vé tương ứng. Tại đây, mỗi vé có thể được hiển thị cùng mã QR preview, giúp người dùng sử dụng nhanh cho mục đích check-in hoặc tra cứu lại thông tin vé. Ngoài ra, hệ thống cũng hỗ trợ tải ảnh QR về thiết bị khi người dùng có nhu cầu lưu trữ riêng.

### Thuộc mục 5.2.1.a Activity Diagram cho Người dùng - Mua vé sự kiện

Trong sơ đồ hoạt động của chức năng mua vé, nên bổ sung rõ chuỗi xử lý sau thanh toán. Sau khi người dùng hoàn tất giao dịch, cổng thanh toán gửi webhook về backend. Backend cập nhật trạng thái đơn hàng sang `paid`, bảo đảm đủ danh sách vé tương ứng, sinh liên kết vé điện tử cho từng vé, tạo QR từ liên kết đó và cuối cùng gửi email xác nhận tới người mua. Phần hoạt động này cho thấy việc phát hành vé điện tử là kết quả của một chuỗi xử lý liên tục, không phải một thao tác giao diện đơn lẻ.

### Thuộc mục 5.3.1 Chức năng mua vé dành cho người dùng

Trong sơ đồ tuần tự, chức năng này nên được mô tả qua các thành phần chính gồm frontend, payment API, PayOS, purchase service, ticket service và email service. Trình tự thực hiện có thể mô tả như sau: frontend gửi yêu cầu mua vé, backend tạo purchase và liên kết thanh toán, người dùng thanh toán qua PayOS, PayOS gọi webhook về backend, backend cập nhật purchase thành `paid`, ticket service chuẩn hóa danh sách vé, sau đó email service gửi thư xác nhận kèm đường dẫn và QR tương ứng. Cách mô tả này phản ánh rõ sự phối hợp giữa nhiều lớp hệ thống trong cùng một chức năng.

### Thuộc mục 6.1 Kiến trúc hệ thống

Xét trong kiến trúc hệ thống, chức năng mã QR code và email xác nhận vé trải qua nhiều khối xử lý. Ở lớp giao diện, chức năng này thuộc về khối ứng dụng khách, nơi người dùng thao tác với trang lịch sử vé, modal QR và trang vé điện tử. Ở lớp nghiệp vụ, nó thuộc về khối quản lý purchase và ticket, nơi hệ thống xác minh trạng thái giao dịch và phát hành vé. Tiếp theo, chức năng còn liên quan tới khối tích hợp thanh toán thông qua webhook PayOS và khối thông báo thông qua dịch vụ gửi email. Toàn bộ dữ liệu nền được lưu trong MongoDB, tạo thành khối dữ liệu trung tâm phục vụ tra cứu và xác thực vé điện tử.

### Thuộc mục 6.2 Thiết kế Database

Về dữ liệu, chức năng này dựa trên mối liên kết chặt chẽ giữa các thực thể `Purchase`, `Ticket`, `TicketClass`, `Event` và `User`. `Purchase` lưu thông tin giao dịch, số lượng vé, phương thức thanh toán và trạng thái thanh toán. `Ticket` đại diện cho từng vé cụ thể và là đơn vị được dùng để sinh QR. `TicketClass` cho biết loại vé, giá vé và kiểu ghế. `Event` cung cấp thông tin sự kiện, còn `User` là chủ thể sở hữu đơn mua vé. Cấu trúc này cho phép hệ thống quản lý vé ở mức chi tiết, từ đó tạo ra mã QR chính xác cho từng vé thay vì chỉ ở cấp độ đơn hàng.

### Thuộc mục 8.1.7 Tiến hành thanh toán

Trong phần hiện thực thanh toán, cần nhấn mạnh rằng việc gửi email vé và tạo mã QR không diễn ra trước khi giao dịch được xác nhận. Chỉ sau khi webhook từ PayOS trả về trạng thái thành công, backend mới cập nhật purchase sang `paid` và thực hiện các bước phát hành vé điện tử. Điều này cho thấy luồng thanh toán và luồng phát hành vé được tách biệt nhưng liên kết chặt chẽ với nhau, giúp tăng độ an toàn cho hệ thống.

### Thuộc mục 8.1.8 Trang Lịch sử mua vé

Trong phần hiện thực giao diện lịch sử vé, cần mô tả rằng mỗi đơn hàng đã thanh toán sẽ hiển thị danh sách vé tương ứng kèm các thao tác liên quan. Người dùng có thể mở modal để xem QR của từng vé, kiểm tra nhanh thông tin nhận diện vé và tải ảnh QR về máy nếu cần. Giao diện này đóng vai trò là điểm truy cập trung tâm cho người dùng sau thanh toán, giúp việc sử dụng vé điện tử trở nên trực quan và thuận tiện hơn.

## 3. Chức năng 2: Ban tổ chức xuất file CSV/PDF danh sách khách hàng mua vé theo sự kiện

### Thuộc mục 3.1.2 ReactJS

Trong khu vực dành cho ban tổ chức, ReactJS được sử dụng để xây dựng trang quản lý thông tin sự kiện và cửa sổ hiển thị danh sách khách hàng đã mua vé. Nhờ mô hình component, hệ thống có thể tổ chức riêng phần bảng attendee, phần nút export và phần modal dữ liệu theo từng sự kiện. Điều này giúp giao diện vận hành ổn định hơn, đồng thời thuận tiện khi cần mở rộng thêm các thao tác lọc, sắp xếp hoặc tìm kiếm trong tương lai.

### Thuộc mục 3.2.1 Hệ quản trị cơ sở dữ liệu MongoDB

Chức năng export danh sách khách hàng phản ánh khá rõ ưu điểm của mô hình dữ liệu document trong MongoDB. Dữ liệu phục vụ cho bảng attendee không nằm gọn trong một collection đơn lẻ mà phải được tổng hợp từ nhiều nguồn như `Event`, `Purchase`, `Ticket`, `User` và `TicketClass`. Nhờ cấu trúc lưu trữ linh hoạt và khả năng liên kết thông qua Mongoose, hệ thống có thể truy vấn, populate và chuẩn hóa dữ liệu thành một danh sách nghiệp vụ đủ dùng cho cả hiển thị và xuất file.

### Thuộc mục 3.4 Các dịch vụ tích hợp và tiện ích hỗ trợ

Ở phía giao diện organizer, hệ thống sử dụng `jsPDF` và `jspdf-autotable` để xuất dữ liệu attendee sang định dạng PDF, đồng thời dùng `Blob` để sinh file CSV trực tiếp từ trình duyệt. Nhóm thư viện này không làm thay đổi logic nghiệp vụ cốt lõi, nhưng đóng vai trò quan trọng trong việc chuyển dữ liệu đang hiển thị thành tài liệu có thể lưu trữ, in ấn hoặc gửi nội bộ. Đây là thành phần tiện ích hỗ trợ nhưng có giá trị thực tế cao trong vận hành sự kiện.

### Thuộc mục 4.1.2 Đối với tất cả Ban tổ chức sự kiện

Đối với vai trò ban tổ chức, hệ thống cần đáp ứng yêu cầu cho phép xem danh sách khách hàng đã thanh toán theo từng sự kiện và xuất dữ liệu đó ra file phục vụ quản lý. Đây là yêu cầu chức năng quan trọng vì organizer không chỉ cần tạo và bán vé, mà còn cần nắm được dữ liệu người tham dự để chuẩn bị check-in, chăm sóc khách hàng hoặc đối soát sau sự kiện.

### Thuộc mục 4.2.5 Khả năng Bảo trì

Chức năng này được thiết kế theo hướng dễ bảo trì nhờ sử dụng một nguồn dữ liệu thống nhất cho cả hiển thị và export. Backend chỉ chịu trách nhiệm trả về danh sách attendee đã được chuẩn hóa, còn frontend tái sử dụng chính dataset đó để hiển thị bảng và sinh file CSV hoặc PDF. Cách tổ chức này giúp giảm lặp logic, dễ kiểm soát thay đổi và thuận tiện khi cần mở rộng thêm định dạng đầu ra trong tương lai.

### Thuộc mục 4.2.7 Khả năng Sử dụng và Trải nghiệm Người dùng

Từ góc nhìn trải nghiệm, chức năng này giúp organizer thao tác nhanh và trực quan hơn trên cùng một giao diện. Người dùng có thể mở danh sách khách hàng của một sự kiện, xem trước toàn bộ dữ liệu trên bảng rồi mới quyết định export sang định dạng mong muốn. Nhờ đó, hệ thống tránh được tình trạng tải file mù mà không kiểm tra trước dữ liệu, đồng thời tăng tính tiện dụng cho người vận hành.

### Thuộc mục 5.1.2.b Theo dõi thông tin sự kiện

Trong use case theo dõi thông tin sự kiện, ngoài các dữ liệu mô tả sự kiện, ban tổ chức còn cần xem được danh sách khách hàng đã mua vé cho sự kiện đó. Chức năng export danh sách attendee được xem là phần mở rộng trực tiếp của use case này, vì nó giúp organizer không chỉ theo dõi số liệu trên hệ thống mà còn chuyển dữ liệu thành tài liệu phục vụ công việc thực tế.

### Thuộc mục 5.2.2.b Theo dõi thông tin sự kiện

Trong sơ đồ hoạt động, nên mô tả luồng theo trình tự sau: organizer mở màn hình thông tin sự kiện, chọn một sự kiện cụ thể, hệ thống gửi request lấy danh sách khách hàng, backend kiểm tra quyền truy cập, tổng hợp dữ liệu attendee và trả kết quả về frontend. Sau khi dữ liệu được hiển thị trên modal, organizer có thể chọn xuất ra CSV hoặc PDF. Chuỗi xử lý này phản ánh đúng cách chức năng vận hành trong hệ thống hiện tại.

### Thuộc mục 6.1 Kiến trúc hệ thống

Trong kiến trúc hệ thống, chức năng này nằm ở giao điểm giữa khối organizer portal, organizer API, khối tổng hợp dữ liệu và khối xuất tài liệu. Frontend giữ vai trò hiển thị bảng dữ liệu và điều khiển thao tác export. Backend giữ vai trò xác thực người dùng, kiểm tra quyền sở hữu sự kiện và tổng hợp dữ liệu attendee từ nhiều collection. Sau khi dữ liệu được chuẩn hóa, frontend tiếp nhận và chuyển thành file CSV hoặc PDF. Đây là ví dụ rõ ràng cho cách hệ thống phối hợp giữa lớp giao diện và lớp nghiệp vụ để phục vụ nhu cầu quản trị vận hành.

### Thuộc mục 6.2 Thiết kế Database

Về thiết kế dữ liệu, chức năng này dựa trên mối liên kết giữa `Organizer`, `Event`, `Purchase`, `Ticket`, `User` và `TicketClass`. `Event` xác định phạm vi sự kiện cần lấy dữ liệu. `Purchase` lưu giao dịch đã thanh toán thành công. `Ticket` đại diện cho từng vé cụ thể để hệ thống có thể làm phẳng dữ liệu theo từng dòng attendee. `User` cung cấp thông tin khách hàng, còn `TicketClass` bổ sung ngữ cảnh về loại vé và giá vé. Sự kết hợp của các thực thể này tạo thành một tập dữ liệu hoàn chỉnh phục vụ cho cả hiển thị và xuất báo cáo.

### Thuộc mục 8.2.2 Trang thông tin sự kiện

Trong phần hiện thực giao diện cho ban tổ chức, cần mô tả rằng tại trang thông tin sự kiện, người dùng có thể mở danh sách khách hàng đã mua vé cho từng sự kiện cụ thể. Dữ liệu được hiển thị dưới dạng bảng, bao gồm các trường quan trọng như tên khách hàng, email, số điện thoại, mã vé, loại vé, vị trí ghế, phương thức thanh toán và thời điểm mua. Từ bảng dữ liệu này, organizer có thể xuất danh sách sang CSV hoặc PDF để sử dụng trong các hoạt động vận hành tiếp theo.

## 4. Đoạn kết dùng cho phần tổng kết hai chức năng tiêu biểu

Hai chức năng được lựa chọn làm điểm nhấn trong báo cáo đại diện cho hai hướng giá trị khác nhau nhưng bổ trợ lẫn nhau trong MyTicket. Chức năng mã QR code trong lịch sử vé và email xác nhận vé thể hiện khả năng hoàn thiện chu trình mua vé điện tử từ thanh toán đến sử dụng thực tế. Trong khi đó, chức năng export danh sách khách hàng mua vé theo sự kiện thể hiện khả năng hỗ trợ quản trị vận hành và khai thác dữ liệu dành cho ban tổ chức.

Điểm chung của cả hai chức năng là đều yêu cầu sự phối hợp giữa nhiều lớp trong hệ thống, bao gồm giao diện, backend, cơ sở dữ liệu, phân quyền truy cập và dịch vụ tích hợp bên ngoài. Chính vì vậy, đây là hai ví dụ phù hợp để trình bày trong báo cáo đồ án tốt nghiệp, vì chúng cho thấy đề tài không chỉ dừng lại ở mức xây dựng giao diện hay xử lý CRUD cơ bản, mà đã giải quyết các tình huống sử dụng thực tế, có giá trị rõ ràng đối với cả người mua vé lẫn đơn vị tổ chức sự kiện.