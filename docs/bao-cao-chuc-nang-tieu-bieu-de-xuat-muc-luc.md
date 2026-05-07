# Nội dung trình bày 2 chức năng tiêu biểu trong báo cáo đồ án

## 1. Giới thiệu chung

Trong quá trình hiện thực hệ thống MyTicket, hai chức năng được xem là tiêu biểu nhất cho định hướng của đề tài là chức năng mã QR code trong lịch sử vé và email xác nhận vé, cùng với chức năng ban tổ chức xuất danh sách khách hàng mua vé theo từng sự kiện ra định dạng CSV hoặc PDF. Hai chức năng này được lựa chọn vì chúng thể hiện rõ hai khía cạnh quan trọng của hệ thống. Thứ nhất là khả năng phục vụ người dùng cuối bằng một quy trình mua vé điện tử liền mạch, thuận tiện và có độ tin cậy cao. Thứ hai là khả năng hỗ trợ vận hành cho phía ban tổ chức thông qua việc tổng hợp, chuẩn hóa và khai thác dữ liệu sau giao dịch.

Về mặt học thuật, đây không phải là hai chức năng quá nặng về thuật toán, nhưng lại thể hiện rõ tư duy thiết kế hệ thống theo hướng thực tiễn. Mỗi chức năng đều có sự kết hợp giữa giao diện người dùng, API backend, cơ sở dữ liệu, phân quyền truy cập và dịch vụ tích hợp bên ngoài. Vì vậy, khi trình bày trong báo cáo, hai chức năng này giúp làm nổi bật cách hệ thống được xây dựng một cách logic, có tổ chức và bám sát nhu cầu sử dụng thực tế.

## 2. Chức năng mã QR code trong lịch sử vé và email xác nhận vé

### 2.1. Mục tiêu của chức năng

Chức năng này được xây dựng nhằm giải quyết nhu cầu truy cập vé điện tử nhanh chóng sau khi người dùng hoàn tất thanh toán. Thay vì chỉ dừng lại ở việc ghi nhận giao dịch thành công, hệ thống tiếp tục phát hành vé điện tử theo từng vé cụ thể, tạo mã QR tương ứng, đồng thời phân phối thông tin đó qua hai kênh chính là email xác nhận và màn hình `Vé của tôi` trong giao diện người dùng. Nhờ vậy, người mua có thể truy cập lại vé bất cứ lúc nào mà không cần thao tác phức tạp hoặc liên hệ thủ công với ban tổ chức.

Ý nghĩa quan trọng của chức năng này nằm ở chỗ nó biến một giao dịch thanh toán thành một tài nguyên số có thể sử dụng ngay trong thực tế. Mã QR không chỉ mang ý nghĩa hiển thị, mà còn đóng vai trò là điểm truy cập nhanh tới trang thông tin vé điện tử tương ứng. Từ góc nhìn hệ thống, đây là bước nối giữa khối thanh toán, khối quản lý vé và khối thông báo tự động.

### 2.2. Cơ sở lý thuyết tóm tắt

Mã QR là một dạng mã hai chiều cho phép lưu trữ thông tin dưới dạng ký tự và được giải mã nhanh bằng camera của điện thoại hoặc thiết bị quét chuyên dụng. Trong các hệ thống vé điện tử, mã QR thường không lưu toàn bộ dữ liệu nghiệp vụ của vé, mà chỉ đóng vai trò như một khóa hoặc một đường dẫn để truy xuất thông tin vé từ hệ thống trung tâm. Cách làm này giúp kiểm soát dữ liệu tốt hơn, đồng thời tránh việc làm lộ trực tiếp quá nhiều thông tin nhạy cảm trên mã hiển thị.

Bên cạnh đó, chức năng này còn liên quan tới cơ chế webhook trong thanh toán trực tuyến. Thay vì để frontend tự kết luận rằng giao dịch đã thành công, hệ thống sử dụng webhook từ cổng thanh toán để backend nhận được tín hiệu xác thực chính thức. Chỉ sau khi webhook xác nhận giao dịch hợp lệ, backend mới cập nhật trạng thái đơn mua vé sang `paid`, phát sinh vé điện tử và gửi email chứa thông tin truy cập vé. Về bản chất, đây là cách đảm bảo tính nhất quán giữa trạng thái thanh toán và trạng thái phát hành vé.

Ngoài ra, mô hình vé điện tử trong chức năng này cũng thể hiện đặc trưng của kiến trúc client-server. Frontend chịu trách nhiệm hiển thị và dẫn hướng người dùng, còn backend chịu trách nhiệm xác minh dữ liệu, tạo QR, kiểm tra quyền truy cập và cung cấp thông tin vé chuẩn xác từ cơ sở dữ liệu. Chính sự phân vai này giúp hệ thống dễ bảo trì và dễ mở rộng hơn về sau.

### 2.3. Công nghệ và thư viện sử dụng

Chức năng mã QR code trong lịch sử vé và email xác nhận vé được xây dựng trên sự phối hợp của nhiều công nghệ khác nhau.

- Ở phía frontend, ReactJS được sử dụng để xây dựng giao diện trang `Vé của tôi`, modal hiển thị QR và trang thông tin vé điện tử.
- Ant Design được dùng để dựng các thành phần giao diện như `Modal`, `Button`, `Tag` và đặc biệt là component `QRCode` để hiển thị QR trực tiếp trên trình duyệt.
- React Router DOM được sử dụng để định nghĩa route công khai tới trang thông tin vé điện tử, giúp người dùng mở đúng vé tương ứng sau khi quét QR.
- Ở phía backend, Node.js kết hợp với Express đảm nhiệm việc xử lý API, tạo dữ liệu vé, xác thực người dùng và kết nối tới các dịch vụ ngoài.
- MongoDB và Mongoose được sử dụng để lưu trữ và liên kết dữ liệu giữa `Purchase`, `Ticket`, `TicketClass`, `Event` và `User`.
- Thư viện `qrcode` được dùng để sinh ảnh QR ở backend, phục vụ cho email xác nhận vé và API tải QR về máy.
- Dịch vụ SendGrid được dùng để gửi email xác nhận với nội dung HTML và ảnh QR được nhúng trực tiếp trong email.
- PayOS và cơ chế webhook được sử dụng để xác nhận giao dịch thành công trước khi hệ thống phát hành vé điện tử.

Điểm đáng chú ý là hệ thống hiện sử dụng hai cách hiển thị QR khác nhau nhưng cùng phục vụ một đích. Frontend render QR trực tiếp để người dùng xem nhanh trong modal, còn backend tạo file PNG thật để nhúng vào email hoặc phục vụ tải xuống. Tuy khác nhau về cách hiện thực, cả hai đều trỏ tới cùng một luồng tra cứu vé điện tử.

### 2.4. Quy trình hoạt động của chức năng

Luồng hoạt động của chức năng được tổ chức theo thứ tự chặt chẽ nhằm đảm bảo rằng vé điện tử chỉ được phát hành sau khi thanh toán thành công và dữ liệu vé đã sẵn sàng.

Bước đầu tiên, người dùng chọn hạng vé, số lượng vé và tiến hành tạo đơn hàng trên hệ thống. Backend ghi nhận đơn mua vé với các thông tin như người mua, sự kiện, hạng vé, số lượng, tổng tiền và trạng thái thanh toán ban đầu. Với các giao dịch cần thanh toán trực tuyến, hệ thống tạo liên kết thanh toán thông qua PayOS để người dùng hoàn tất giao dịch.

Bước thứ hai, khi người dùng thanh toán xong, PayOS gửi webhook về backend. Đây là tín hiệu quan trọng để hệ thống xác nhận rằng giao dịch đã được xử lý thành công từ phía cổng thanh toán, không chỉ từ phía giao diện người dùng. Backend sau đó cập nhật `paymentStatus` của bản ghi `Purchase` sang trạng thái `paid`. Chỉ tại thời điểm này, hệ thống mới xem giao dịch là hợp lệ để phát hành vé điện tử.

Bước thứ ba, sau khi trạng thái đơn mua vé được cập nhật, backend thực hiện bước bảo đảm đủ danh sách vé tương ứng với số lượng người dùng đã mua. Với vé có chỗ ngồi cố định, hệ thống sử dụng các bản ghi `Ticket` đã được gắn với từng ghế. Với vé tự do, hệ thống có thể tạo bổ sung các bản ghi vé động nếu cần để mỗi vé đều có một định danh riêng. Đây là bước quan trọng vì hệ thống cần quản lý ở mức từng vé, không chỉ ở mức đơn hàng.

Bước thứ tư, với mỗi vé hợp lệ, backend xây dựng một liên kết công khai dẫn tới trang thông tin vé điện tử. Liên kết này không dùng trực tiếp mã đơn hàng mà ưu tiên định danh riêng của từng vé để giảm rủi ro trùng lặp. Sau đó, backend sử dụng thư viện `qrcode` để tạo ảnh QR từ đường dẫn vừa dựng. Nội dung QR vì vậy không phải là toàn bộ dữ liệu vé, mà là một cách truy cập nhanh tới dữ liệu vé được kiểm soát bởi hệ thống.

Bước thứ năm, sau khi danh sách vé và QR đã được tạo, backend gửi email xác nhận tới người mua. Email này chứa thông tin sự kiện, đường dẫn truy cập vé điện tử và ảnh QR tương ứng với từng vé. Việc nhúng QR trực tiếp vào email giúp người dùng có thể lưu lại vé ngay trong hộp thư mà không cần đăng nhập lại hệ thống trong mọi trường hợp.

Bước thứ sáu, ở phía giao diện người dùng, trang `Vé của tôi` tiếp tục lấy danh sách các đơn hàng đã thanh toán từ backend. Dựa trên danh sách vé con của từng purchase, frontend hiển thị QR preview trực tiếp bằng component `QRCode` của Ant Design. Nếu người dùng muốn lưu ảnh QR về máy, frontend sẽ gọi một API backend riêng để lấy file PNG đã được sinh sẵn theo đúng vé tương ứng.

Bước cuối cùng, khi người dùng quét QR từ email hoặc từ màn hình lịch sử vé, thiết bị sẽ được dẫn tới trang thông tin vé điện tử công khai. Trang này gọi API public từ backend để truy xuất dữ liệu vé đã thanh toán, bao gồm thông tin sự kiện, loại vé, vị trí ghế nếu có, tình trạng thanh toán và người sở hữu vé. Nhờ đó, một mã QR duy nhất có thể trở thành điểm kết nối giữa nhiều thao tác khác nhau trong vòng đời sử dụng vé.

### 2.5. Vai trò và tầm quan trọng của chức năng

Xét về mặt nghiệp vụ, đây là chức năng giúp hệ thống hoàn thiện trọn vẹn chu trình mua vé điện tử. Nếu một hệ thống chỉ dừng ở bước thanh toán thành công nhưng không hỗ trợ truy cập vé nhanh, trải nghiệm người dùng vẫn bị gián đoạn. Chức năng QR và email xác nhận vé giải quyết đúng khoảng trống đó bằng cách đưa vé đến gần người dùng hơn, ở cả hai kênh quen thuộc là email và giao diện cá nhân.

Xét về mặt trải nghiệm sử dụng, chức năng này giúp người dùng giảm phụ thuộc vào thao tác thủ công. Người mua không cần nhớ mã vé, không cần tìm lại lịch sử giao dịch phức tạp, cũng không cần liên hệ ban tổ chức để xác nhận vé sau khi thanh toán. Chỉ cần mở email hoặc truy cập `Vé của tôi`, người dùng đã có thể sử dụng QR tương ứng với từng vé đã mua.

Xét về mặt độ tin cậy dữ liệu, chức năng này cho thấy sự liên kết chặt giữa thanh toán và phát hành vé. QR chỉ có giá trị khi purchase đã ở trạng thái `paid`, nhờ đó hệ thống hạn chế được tình trạng phát hành nhầm vé cho đơn hàng chưa thanh toán hoàn tất. Đây là một yêu cầu rất quan trọng trong các hệ thống bán vé trực tuyến.

Xét về khả năng mở rộng, kiến trúc hiện tại hoàn toàn có thể phát triển tiếp thành hệ thống check-in tự động tại cổng sự kiện, hoặc kết hợp thêm cơ chế xác minh trạng thái vé theo thời gian thực. Nói cách khác, chức năng hiện tại vừa mang giá trị sử dụng tức thời, vừa đóng vai trò nền tảng cho các cải tiến sau này.

### 2.6. Vị trí của chức năng trong kiến trúc hệ thống

Trong kiến trúc tổng thể của MyTicket, chức năng này không nằm gọn trong một khối duy nhất mà trải qua nhiều lớp xử lý. Ở lớp giao diện, nó thuộc về khối người dùng cuối, nơi người mua tương tác với trang lịch sử vé, modal QR và trang vé điện tử. Ở lớp xử lý nghiệp vụ, nó thuộc về khối quản lý đơn mua vé và quản lý vé, nơi hệ thống xác định vé nào hợp lệ, vé nào đã thanh toán và vé nào được phép truy xuất.

Tiếp theo, chức năng này gắn trực tiếp với khối tích hợp thanh toán thông qua webhook PayOS. Không có bước xác nhận này, backend không thể kết luận chính xác rằng vé đã được phép phát hành. Đồng thời, chức năng cũng đi qua khối thông báo, nơi email xác nhận được dựng và gửi tới người dùng. Cuối cùng, toàn bộ dữ liệu đều dựa trên cơ sở dữ liệu trung tâm MongoDB, nơi lưu thông tin purchase, ticket, event, user và các mối liên kết giữa chúng.

Vì vậy, khi trình bày trong báo cáo, có thể xem chức năng QR code trong lịch sử vé và email xác nhận vé là một ví dụ rõ ràng cho mô hình phối hợp nhiều tầng trong kiến trúc client-server. Nó vừa liên quan đến UI, vừa phụ thuộc vào backend logic, vừa cần tới dịch vụ ngoài và cơ sở dữ liệu để hoạt động đúng.

## 3. Chức năng ban tổ chức xuất file CSV/PDF danh sách khách hàng mua vé theo sự kiện

### 3.1. Mục tiêu của chức năng

Nếu chức năng QR tập trung vào phía người mua vé, thì chức năng xuất danh sách khách hàng lại đại diện cho giá trị vận hành mà hệ thống mang lại cho ban tổ chức. Mục tiêu của chức năng này là giúp organizer dễ dàng theo dõi danh sách người đã mua vé cho từng sự kiện, kiểm tra thông tin khách hàng ngay trên giao diện, đồng thời xuất dữ liệu ra các định dạng phổ biến để phục vụ đối soát, chuẩn bị check-in hoặc chăm sóc khách hàng sau bán.

Về bản chất, đây là chức năng tổng hợp dữ liệu nghiệp vụ sau giao dịch. Hệ thống không chỉ hiển thị danh sách mua vé ở mức đơn hàng, mà còn làm phẳng dữ liệu theo từng vé và chuẩn hóa thành một bảng dễ đọc, dễ kiểm tra và dễ xuất ra tài liệu. Chính điểm này làm cho chức năng mang tính thực tiễn cao, vì organizer thường cần dữ liệu ở dạng có thể thao tác ngay thay vì chỉ xem trên màn hình.

### 3.2. Cơ sở lý thuyết tóm tắt

Hai khái niệm lý thuyết ngắn gọn liên quan trực tiếp đến chức năng này là tổng hợp dữ liệu nghiệp vụ và xuất báo cáo số. Trong các hệ thống thông tin quản lý, dữ liệu hiển thị cho người vận hành hiếm khi đến từ một bảng hoặc một collection đơn lẻ. Thay vào đó, hệ thống cần ghép nhiều nguồn dữ liệu khác nhau để tạo thành một tập thông tin có ý nghĩa nghiệp vụ hoàn chỉnh. Với MyTicket, danh sách khách hàng mua vé phải được tạo từ quan hệ giữa người mua, đơn hàng, vé, hạng vé và sự kiện.

Bên cạnh đó, việc xuất dữ liệu ra CSV và PDF là một hình thức chuyển đổi dữ liệu từ trạng thái phục vụ xử lý trong hệ thống sang trạng thái phục vụ lưu trữ, chia sẻ và tác nghiệp. CSV phù hợp cho việc nhập lại vào Excel hoặc Google Sheets để lọc, sắp xếp và thống kê. PDF lại phù hợp cho các tình huống cần tài liệu có bố cục ổn định, dễ in ấn hoặc gửi nội bộ mà không làm thay đổi định dạng.

Chức năng này cũng gắn chặt với nguyên tắc phân quyền trong hệ thống. Dữ liệu khách hàng là dữ liệu nhạy cảm, do đó backend phải kiểm tra chặt chẽ vai trò người dùng và quyền sở hữu sự kiện trước khi cho phép truy xuất danh sách attendee. Nói cách khác, export dữ liệu không đơn thuần là thao tác kỹ thuật, mà còn là một bài toán về kiểm soát truy cập.

### 3.3. Công nghệ và thư viện sử dụng

Chức năng xuất danh sách khách hàng theo sự kiện được xây dựng trên sự phối hợp giữa frontend organizer portal và backend API chuyên trách.

- ReactJS được dùng để xây dựng trang quản lý thông tin sự kiện của organizer.
- Ant Design được dùng để hiển thị bảng attendee, modal danh sách khách hàng, nút thao tác và trạng thái tải dữ liệu.
- Axios được dùng để giao tiếp giữa frontend và backend khi lấy danh sách khách hàng theo `eventId`.
- Ở frontend, `Blob` được sử dụng để tạo file CSV và kích hoạt quá trình tải file về máy người dùng.
- Thư viện `jsPDF` và `jspdf-autotable` được dùng để xuất dữ liệu attendee sang file PDF theo bố cục bảng có thể đọc và in ấn.
- Ở backend, Node.js và Express xử lý endpoint lấy danh sách attendee của một sự kiện.
- MongoDB và Mongoose được dùng để truy vấn và nối dữ liệu từ `Organizer`, `Event`, `Purchase`, `Ticket`, `User` và `TicketClass`.
- Middleware xác thực token và phân quyền được dùng để đảm bảo chỉ organizer sở hữu sự kiện hoặc admin mới có quyền truy cập dữ liệu này.

Điểm nổi bật của chức năng là logic tổng hợp dữ liệu được đặt ở backend, còn logic sinh file lại đặt ở frontend. Cách tách này giúp backend tập trung vào tính đúng đắn của dữ liệu, trong khi frontend linh hoạt hơn trong việc chuyển đổi cùng một dataset sang nhiều định dạng đầu ra khác nhau.

### 3.4. Quy trình hoạt động của chức năng

Luồng hoạt động của chức năng bắt đầu từ phía organizer khi người dùng đăng nhập vào khu vực quản lý sự kiện. Tại trang thông tin sự kiện, organizer có thể xem danh sách các sự kiện do mình phụ trách. Mỗi sự kiện đi kèm một thao tác mở danh sách khách hàng đã mua vé.

Khi organizer chọn một sự kiện cụ thể, frontend trước hết xác định `organizerId` tương ứng với tài khoản đang đăng nhập. Sau đó, frontend gửi request tới endpoint lấy danh sách khách hàng mua vé của sự kiện đó. Request này không chỉ mang ý nghĩa truy vấn dữ liệu mà còn là bước khởi đầu cho cơ chế kiểm tra phân quyền ở backend.

Bước tiếp theo, backend kiểm tra token đăng nhập và xác minh vai trò của người gửi request. Nếu tài khoản không phải organizer hoặc admin, hoặc nếu organizer đang cố truy cập dữ liệu của sự kiện không thuộc quyền quản lý của mình, hệ thống sẽ từ chối truy cập. Đây là lớp bảo vệ quan trọng nhằm đảm bảo dữ liệu khách hàng không bị lộ ra ngoài phạm vi được phép sử dụng.

Sau khi xác thực quyền truy cập, backend truy vấn sự kiện tương ứng và lấy toàn bộ các purchase đã thanh toán thành công của sự kiện đó. Đồng thời, hệ thống populate thông tin người mua và hạng vé để có đủ ngữ cảnh nghiệp vụ cho từng bản ghi. Tuy nhiên, dữ liệu ở thời điểm này vẫn chưa phải là dữ liệu cuối cùng để hiển thị hoặc export, vì purchase mới chỉ phản ánh giao dịch ở mức đơn hàng.

Bước tiếp theo, backend truy vấn collection `Ticket` dựa trên danh sách purchase vừa thu được. Các bản ghi vé được gom nhóm theo từng đơn hàng, sau đó hệ thống làm phẳng dữ liệu thành danh sách attendee. Trong danh sách này, mỗi vé tương ứng với một dòng dữ liệu, bao gồm tên khách hàng, email, số điện thoại, mã vé, hạng vé, vị trí ghế nếu có, phương thức thanh toán và thời điểm mua. Chính bước chuẩn hóa này làm cho dữ liệu trở nên phù hợp với nhu cầu sử dụng của organizer hơn là cấu trúc lưu trữ thô trong database.

Sau khi backend trả về `attendees[]`, frontend hiển thị danh sách ngay trong modal để organizer có thể xem trước dữ liệu trên giao diện. Việc cho phép xem trực tiếp trước khi export giúp người dùng kiểm tra nhanh thông tin, xác nhận số lượng bản ghi và tránh tải về những file không cần thiết.

Nếu organizer chọn xuất CSV, frontend sử dụng chính dataset đang hiển thị để chuyển thành chuỗi CSV có cấu trúc theo cột. Nếu organizer chọn xuất PDF, frontend sử dụng `jsPDF` kết hợp với `jspdf-autotable` để dựng bảng dữ liệu theo bố cục trang in. Nhờ vậy, cùng một nguồn dữ liệu được tái sử dụng cho cả phần hiển thị và phần xuất tài liệu, giúp tránh lặp logic và giữ tính nhất quán giữa giao diện với file đầu ra.

### 3.5. Vai trò và tầm quan trọng của chức năng

Về mặt nghiệp vụ vận hành, đây là một chức năng có giá trị rất thực tế đối với ban tổ chức. Một hệ thống bán vé chỉ phục vụ tốt người mua thôi là chưa đủ. Ban tổ chức còn cần biết ai đã mua vé, mua loại vé nào, đã thanh toán hay chưa và cần chuẩn bị danh sách khách tham dự ra sao. Chức năng export attendee đáp ứng trực tiếp nhu cầu đó bằng cách chuyển dữ liệu giao dịch thành dữ liệu vận hành.

Về mặt quản trị dữ liệu, chức năng này cho thấy hệ thống MyTicket không chỉ lưu dữ liệu để tham chiếu, mà còn có khả năng khai thác dữ liệu đúng mục đích sử dụng. Dữ liệu người dùng, purchase và ticket được liên kết lại để tạo thành một bảng nghiệp vụ rõ ràng, dễ đọc và dễ xử lý tiếp. Đây là một điểm mạnh khi đánh giá tính hoàn chỉnh của hệ thống thông tin.

Về mặt kỹ thuật, chức năng này thể hiện rõ tư duy tách lớp xử lý. Backend chịu trách nhiệm xác minh quyền, gom dữ liệu và chuẩn hóa dữ liệu. Frontend chịu trách nhiệm hiển thị và sinh file đầu ra theo nhu cầu cụ thể của người dùng. Cách phân chia này giúp hệ thống linh hoạt hơn, đồng thời tránh việc backend phải gánh thêm trách nhiệm dựng file ở nhiều định dạng khác nhau khi chưa thực sự cần thiết.

Về mặt thực tiễn, hai định dạng CSV và PDF phục vụ hai nhu cầu khác nhau nhưng bổ trợ tốt cho nhau. CSV thuận tiện khi cần tiếp tục chỉnh sửa, lọc hoặc tính toán trên bảng tính. PDF thuận tiện khi cần lưu trữ, gửi qua email nội bộ hoặc in ra để phục vụ khâu kiểm tra tại sự kiện. Nhờ đó, chức năng này đem lại giá trị trực tiếp cho người sử dụng ở vai trò organizer.

### 3.6. Vị trí của chức năng trong kiến trúc hệ thống

Trong sơ đồ kiến trúc hệ thống, chức năng này có thể được xem là nằm ở giao điểm giữa khối quản trị sự kiện và khối khai thác dữ liệu vận hành. Ở phía frontend, nó thuộc về organizer portal, nơi người dùng quản lý sự kiện của mình, mở danh sách khách hàng và lựa chọn định dạng export. Ở phía backend, nó thuộc về organizer API và lớp xử lý tổng hợp dữ liệu, nơi request được xác thực, kiểm tra quyền và truy vấn các collection liên quan.

Nếu nhìn sâu hơn vào luồng xử lý, có thể tách riêng một khối `Data Aggregation` cho chức năng này. Đây là nơi hệ thống kết hợp dữ liệu từ `Purchase`, `Ticket`, `User`, `TicketClass` và `Event` để tạo thành một cấu trúc dữ liệu đã sẵn sàng cho hiển thị và export. Sau đó, dữ liệu được chuyển tới lớp giao diện, nơi frontend đảm nhận vai trò `Export Document` để sinh ra file CSV hoặc PDF.

Vì vậy, chức năng này là ví dụ điển hình cho cách hệ thống khai thác dữ liệu từ kho dữ liệu nghiệp vụ để phục vụ bài toán báo cáo và tác nghiệp. Nó không chỉ minh họa cho chức năng riêng lẻ, mà còn phản ánh cách dữ liệu trong hệ thống được tái sử dụng một cách có giá trị.

## 4. Đánh giá chung về hai chức năng tiêu biểu

Hai chức năng được lựa chọn trong báo cáo đại diện cho hai hướng giá trị khác nhau nhưng bổ trợ lẫn nhau trong MyTicket. Chức năng mã QR code trong lịch sử vé và email xác nhận vé đại diện cho trải nghiệm người dùng sau thanh toán, nhấn mạnh tính liền mạch, thuận tiện và đáng tin cậy của vé điện tử. Trong khi đó, chức năng organizer xuất file CSV/PDF danh sách khách hàng mua vé theo sự kiện đại diện cho khả năng khai thác dữ liệu và hỗ trợ vận hành phía ban tổ chức.

Điểm chung của cả hai chức năng là đều không hoạt động độc lập ở một lớp duy nhất. Chúng đòi hỏi sự phối hợp giữa frontend, backend, database, phân quyền và một số dịch vụ tích hợp bên ngoài. Chính điều này làm cho hai chức năng trở thành ví dụ phù hợp để trình bày trong báo cáo đồ án tốt nghiệp, vì chúng thể hiện rõ hơn cách một hệ thống phần mềm hoàn chỉnh được tổ chức và vận hành.

Xét trên phương diện học thuật và thực tiễn, việc lựa chọn hai chức năng này làm điểm nhấn cho phần hiện thực hệ thống là hợp lý. Một chức năng cho thấy MyTicket giải quyết tốt vòng đời sử dụng vé điện tử của người mua, còn chức năng kia cho thấy hệ thống có giá trị vận hành rõ ràng đối với ban tổ chức sự kiện. Khi đặt cạnh nhau, chúng giúp chứng minh rằng đề tài không chỉ dừng ở mức xây dựng giao diện hay CRUD dữ liệu, mà đã tiến tới giải quyết những tình huống sử dụng cụ thể, sát với nhu cầu thực tế của một nền tảng bán vé sự kiện.