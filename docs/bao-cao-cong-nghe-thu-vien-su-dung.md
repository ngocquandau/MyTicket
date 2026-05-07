# Tài liệu tổng hợp công nghệ, ngôn ngữ và thư viện sử dụng trong MyTicket

## 1. Ghi chú phạm vi

Tài liệu này được tổng hợp từ mã nguồn hiện có trong hai phần `FE` và `BE` của dự án MyTicket. Cách viết ưu tiên ngắn gọn ở phần giới thiệu, nhưng làm rõ vai trò thực tế của từng công nghệ trong bài để có thể dùng trực tiếp khi viết Chương 3.

Nếu nhóm có một repository Machine Learning riêng cho phần huấn luyện mô hình mà chưa đưa vào workspace này, bạn có thể bổ sung thêm ở cuối Chương 3.3. Trong mã nguồn đang nhìn thấy, phần thể hiện rõ nhất của nhánh ML là tích hợp Hugging Face, API recommendation và chatbot Gemini.

## 2. Ngôn ngữ lập trình và nền tảng chính

| Công nghệ / ngôn ngữ | Giới thiệu ngắn gọn | Tính ứng dụng trong bài |
| --- | --- | --- |
| TypeScript | TypeScript là ngôn ngữ mở rộng từ JavaScript, bổ sung kiểu dữ liệu tĩnh để kiểm soát lỗi tốt hơn khi phát triển giao diện lớn. | Trong MyTicket, TypeScript được dùng ở frontend React để định nghĩa kiểu dữ liệu cho sự kiện, vé, người dùng và response API. Điều này giúp giảm lỗi khi render giao diện, nhất là ở các màn hình nhiều trạng thái như lịch sử vé, trang sự kiện và khu vực organizer. |
| JavaScript (ES Modules) | JavaScript là ngôn ngữ xử lý chính ở phía server, phù hợp với ứng dụng web thời gian thực và hệ sinh thái npm phong phú. | Backend của MyTicket dùng JavaScript theo chuẩn ES Modules để tổ chức controller, route, model và service. Cách này phù hợp với kiến trúc RESTful API, dễ tách chức năng theo nghiệp vụ như user, event, purchase, payment và review. |
| ReactJS | ReactJS là thư viện xây dựng giao diện theo mô hình component, thuận lợi cho việc tái sử dụng và quản lý trạng thái giao diện. | MyTicket dùng ReactJS để xây dựng ba nhóm giao diện chính: người dùng, ban tổ chức và quản trị viên. Các trang như HomePage, Event Detail, My Tickets, Organizer Event Information đều được tách thành component, giúp mở rộng chức năng mà không làm rối toàn bộ giao diện. |
| Node.js | Node.js là môi trường chạy JavaScript phía server, mạnh về xử lý I/O bất đồng bộ và phù hợp cho API web. | Trong đồ án, Node.js là nền tảng chạy backend MyTicket. Nó đảm nhiệm việc nhận request từ frontend, xử lý logic mua vé, tạo QR, gửi email, tích hợp thanh toán và truy xuất cơ sở dữ liệu. |
| Express.js | Express là framework backend gọn, phổ biến trong Node.js, phù hợp để xây dựng REST API theo từng route. | Express được dùng để tổ chức các nhóm API như `/api/user`, `/api/event`, `/api/purchases`, `/api/payment`, `/api/organizer`. Nhờ đó backend tách rõ lớp điều hướng và lớp xử lý nghiệp vụ, thuận tiện cho phân tích kiến trúc client-server trong báo cáo. |

## 3. Lưu trữ dữ liệu và xử lý dữ liệu nghiệp vụ

| Công nghệ / thư viện | Giới thiệu ngắn gọn | Tính ứng dụng trong bài |
| --- | --- | --- |
| MongoDB | MongoDB là hệ quản trị cơ sở dữ liệu NoSQL lưu dữ liệu dạng document JSON linh hoạt, phù hợp với bài toán có nhiều cấu trúc dữ liệu thay đổi theo nghiệp vụ. | MyTicket dùng MongoDB để lưu user, organizer, event, ticket class, purchase, ticket, review, voucher, interaction và statistic. Kiểu dữ liệu document giúp hệ thống biểu diễn tốt quan hệ giữa sự kiện, hạng vé, đơn mua và vé điện tử mà không phải bó cứng vào bảng quan hệ cố định. |
| Mongoose | Mongoose là thư viện ODM cho MongoDB, hỗ trợ schema, validation và thao tác dữ liệu có cấu trúc ngay trong Node.js. | Trong dự án, Mongoose được dùng để định nghĩa schema như `Event`, `Purchase`, `Ticket`, `User`, `Organizer`. Nó giúp kiểm soát dữ liệu đầu vào, khai báo index, populate quan hệ tham chiếu và hỗ trợ transaction khi xử lý mua vé. |
| Multer | Multer là middleware xử lý upload file trong Express, thường dùng cho ảnh và tài liệu gửi từ form. | MyTicket dùng Multer trong API upload ảnh để nhận file từ frontend dưới dạng memory buffer, sau đó chuyển tiếp sang dịch vụ lưu trữ ảnh. Điều này phục vụ cho avatar người dùng hoặc hình ảnh liên quan đến hồ sơ/tài nguyên hiển thị. |
| Cloudinary | Cloudinary là dịch vụ lưu trữ và phân phối ảnh trên nền tảng đám mây. | Sau khi Multer nhận file upload, backend đẩy ảnh lên Cloudinary để lưu trữ ổn định và lấy URL dùng lại trong giao diện. Cách làm này giảm tải lưu file trực tiếp trên server và giúp ảnh dễ hiển thị ở môi trường triển khai thật. |
| Axios | Axios là thư viện gửi HTTP request, hỗ trợ promise và cấu hình request/response thuận tiện. | Frontend MyTicket dùng Axios để gọi backend API, còn backend cũng dùng Axios ở một số luồng tích hợp bên ngoài. Việc chuẩn hóa qua `axiosClient` giúp quản lý token, base URL, lỗi xác thực và response format đồng nhất giữa các module. |
| json2csv | json2csv là thư viện chuyển dữ liệu JSON sang định dạng CSV. | Trong mã nguồn hiện tại, json2csv được dùng cho pipeline xuất bộ dữ liệu huấn luyện recommendation lên Hugging Face. Đây là mắt nối giữa dữ liệu nghiệp vụ và phần xử lý Machine Learning. |

## 4. Công nghệ giao diện và trải nghiệm người dùng

| Công nghệ / thư viện | Giới thiệu ngắn gọn | Tính ứng dụng trong bài |
| --- | --- | --- |
| Ant Design | Ant Design là thư viện UI component cho React, cung cấp sẵn nhiều thành phần như bảng, modal, form, thông báo và phân trang. | Dự án dùng Ant Design rộng rãi ở cả client, organizer và admin. Các màn hình quản trị dữ liệu, modal mã QR, bảng danh sách khách hàng và thông báo thao tác đều dựa trên thư viện này để tăng tốc độ hoàn thiện giao diện. |
| Ant Design Icons | Đây là bộ icon đi kèm Ant Design, giúp giao diện thống nhất về ngôn ngữ trực quan. | Hệ thống dùng icon cho điều hướng, trạng thái, thao tác tải QR, xem khách hàng, chat, đánh giá và thống kê. Nhờ đó giao diện dễ đọc hơn mà không cần mô tả dài dòng. |
| Tailwind CSS | Tailwind CSS là framework utility-first giúp xây giao diện nhanh bằng các class nhỏ, dễ kiểm soát layout và responsive. | MyTicket dùng Tailwind để xử lý bố cục, spacing, màu sắc và responsive cho nhiều trang phía người dùng. Cách này giúp tinh chỉnh UI nhanh mà không cần viết quá nhiều CSS thủ công. |
| React Router DOM | React Router DOM là thư viện điều hướng cho ứng dụng React dạng SPA. | Hệ thống dùng React Router để quản lý route cho ba nhóm vai trò và các trang public như chi tiết sự kiện, kết quả thanh toán, lịch sử vé và trang thông tin vé điện tử mở từ QR. |
| DOMPurify | DOMPurify là thư viện làm sạch nội dung HTML để giảm rủi ro XSS khi render rich text. | Trong MyTicket, DOMPurify được dùng để làm sạch mô tả sự kiện trước khi hiển thị. Điều này đặc biệt quan trọng khi ban tổ chức hoặc admin nhập nội dung có định dạng HTML. |
| React Quill / Quill | Quill là trình soạn thảo rich text, React Quill là lớp tích hợp Quill vào React. | Dự án dùng React Quill để nhập mô tả sự kiện có định dạng. Nhờ đó phần quản trị sự kiện trực quan hơn, đồng thời cho phép nội dung hiển thị đẹp ở trang chi tiết sự kiện. |
| jsPDF | jsPDF là thư viện tạo file PDF trực tiếp từ frontend. | Ở khu vực organizer, jsPDF được dùng để xuất danh sách khách hàng mua vé theo từng sự kiện ra file PDF. Đây là chức năng hữu ích cho khâu đối soát, chăm sóc khách hàng và tác nghiệp trước giờ diễn ra sự kiện. |
| jspdf-autotable | jspdf-autotable là plugin mở rộng cho jsPDF, hỗ trợ xuất bảng dữ liệu nhiều cột dễ đọc hơn. | MyTicket dùng thư viện này để biến danh sách attendee đang hiển thị trên modal thành file PDF có bảng tiêu đề, dữ liệu theo hàng và định dạng phù hợp để lưu trữ hoặc in ấn. |
| react-barcode | react-barcode là thư viện hiển thị barcode trong React. | Sau khi người dùng mở trang thông tin vé điện tử, hệ thống hiển thị barcode như một lớp nhận diện bổ sung bên cạnh thông tin mua vé và dữ liệu sự kiện. Nó giúp vé điện tử trực quan và chuyên nghiệp hơn khi trình bày. |

## 5. Bảo mật, xác thực và xử lý tài khoản

| Công nghệ / thư viện | Giới thiệu ngắn gọn | Tính ứng dụng trong bài |
| --- | --- | --- |
| JSON Web Token (jsonwebtoken) | JWT là cơ chế tạo token xác thực, cho phép server xác minh người dùng ở các request tiếp theo mà không phải lưu session truyền thống. | Backend MyTicket dùng JWT cho đăng nhập, xác thực route bảo vệ và phân quyền theo vai trò `user`, `organizer`, `admin`. Đây là nền tảng của các API nhạy cảm như mua vé, xem lịch sử vé, quản lý sự kiện và truy cập dữ liệu organizer. |
| bcryptjs | bcryptjs là thư viện băm mật khẩu một chiều trước khi lưu vào cơ sở dữ liệu. | Mật khẩu người dùng trong MyTicket không được lưu thô mà được mã hóa bằng bcryptjs. Điều này giúp tăng mức an toàn dữ liệu tài khoản nếu cơ sở dữ liệu bị lộ. |
| CORS | CORS là cơ chế kiểm soát nguồn truy cập giữa frontend và backend khác domain. | Backend cấu hình CORS để chỉ cho phép frontend hợp lệ như bản deploy và môi trường local truy cập API. Đây là cấu hình quan trọng khi hệ thống triển khai tách FE và BE. |

## 6. Tích hợp dịch vụ và tiện ích nghiệp vụ

| Công nghệ / thư viện | Giới thiệu ngắn gọn | Tính ứng dụng trong bài |
| --- | --- | --- |
| qrcode | qrcode là thư viện tạo mã QR dưới dạng ảnh hoặc buffer ở phía backend. | Đây là thư viện cốt lõi cho chức năng vé điện tử. Backend dùng nó để tạo file PNG QR cho email xác nhận vé và API tải QR về máy từ màn hình `Vé của tôi`. Mỗi QR dẫn tới trang thông tin vé điện tử công khai của đúng vé đã thanh toán. |
| QRCode của Ant Design | Thành phần QRCode của Ant Design cho phép render mã QR trực tiếp ở frontend. | Trong trang `My Tickets`, frontend dùng component này để preview QR ngay trong modal, giúp người dùng xem nhanh mà không phải đợi tải file ảnh từ server. |
| SendGrid (`@sendgrid/mail`) | SendGrid là dịch vụ gửi email giao dịch, phù hợp cho email xác nhận, nhắc lịch và thông báo tự động. | Luồng email trong MyTicket hiện tại sử dụng SendGrid để gửi email xác nhận đặt vé, đính kèm QR inline bằng `cid`, đồng thời gửi các email nhắc sự kiện. Đây là một phần rất quan trọng của trải nghiệm sau thanh toán. |
| PayOS (`@payos/node`) | PayOS là cổng thanh toán trực tuyến hỗ trợ tạo link thanh toán và nhận webhook xác nhận giao dịch. | Hệ thống dùng SDK PayOS để tạo URL thanh toán cho người mua. Khi giao dịch thành công, webhook của PayOS kích hoạt bước cập nhật đơn hàng sang trạng thái `paid`, từ đó mới phát sinh gửi email vé và các xử lý liên quan. |
| node-cron | node-cron là thư viện lập lịch tác vụ theo thời gian trên Node.js. | MyTicket dùng node-cron để chạy job kiểm tra và cập nhật trạng thái vé/sự kiện theo thời gian. Điều này hỗ trợ phần tự động hóa, giảm phụ thuộc vào thao tác thủ công của quản trị viên. |
| Gemini API (`@google/generative-ai`) | Đây là SDK tích hợp mô hình ngôn ngữ lớn của Google để tạo phản hồi hội thoại thông minh. | Trong đồ án, Gemini được dùng cho chatbot AI tư vấn sự kiện. Backend lấy dữ liệu sự kiện đang mở bán, xây dựng context và gửi cho mô hình để tạo câu trả lời ngắn gọn, đúng ngữ cảnh hệ thống MyTicket. |

## 7. Thành phần liên quan Machine Learning và recommendation

| Công nghệ / thư viện | Giới thiệu ngắn gọn | Tính ứng dụng trong bài |
| --- | --- | --- |
| Hugging Face Hub (`@huggingface/hub`) | Hugging Face Hub là nền tảng lưu trữ dữ liệu, mô hình và artifact cho quy trình Machine Learning. | Trong mã nguồn backend hiện tại, hệ thống có luồng export dataset recommendation sang CSV rồi upload lên Hugging Face. Điều này cho thấy phần recommendation không chỉ dừng ở hiển thị kết quả mà còn có bước chuẩn bị dữ liệu phục vụ pipeline mô hình. |
| API recommendation nội bộ | Đây là lớp API trung gian trả danh sách sự kiện được xếp hạng cho người dùng đã đăng nhập. | Frontend gọi `/api/model/recommended-list`, sau đó ghép kết quả xếp hạng với dữ liệu sự kiện tổng quát để hiển thị khu vực `Sự kiện dành cho bạn`. Vai trò của lớp này là nối giữa web app và nhánh gợi ý cá nhân hóa. |
| Python, LightGBM, ONNX, GitHub Actions | Đây là nhóm công nghệ thường dùng trong pipeline huấn luyện, tối ưu và triển khai mô hình học máy. | Trong workspace hiện tại chưa thấy trực tiếp mã Python hoặc workflow GitHub Actions. Vì vậy, nếu bài báo cáo của bạn có chương riêng về MLOps và LightGBM, nên mô tả chúng như phần hạ tầng recommendation mở rộng của đề tài, đồng thời ghi chú rõ rằng phần web app đang tiêu thụ kết quả recommendation qua API và dữ liệu huấn luyện được đẩy qua Hugging Face. |

## 8. Nhận xét để đưa vào báo cáo

Có thể chốt Chương 3 theo tinh thần sau:

1. Nhóm công nghệ cốt lõi của MyTicket là ReactJS + TypeScript ở frontend, Node.js + Express + MongoDB ở backend.
2. Nhóm thư viện nghiệp vụ nổi bật là Mongoose, JWT, bcryptjs, Ant Design, Tailwind CSS, qrcode, SendGrid, PayOS, jsPDF và jspdf-autotable.
3. Nhóm tích hợp mở rộng của hệ thống gồm chatbot Gemini, recommendation API và quy trình đẩy dữ liệu recommendation lên Hugging Face.
4. Nếu bạn giữ các mục LightGBM, ONNX, GitHub Actions trong mục lục, nên trình bày chúng như phần hạ tầng mô hình học máy của toàn đề tài, không nên mô tả như thể toàn bộ mã nguồn huấn luyện đều nằm trong repository web hiện tại.

## 9. Lưu ý khi viết vào báo cáo chính thức

Một điểm cần đồng bộ trước khi nộp báo cáo là phần chatbot. Trong mục lục bạn đang ghi `Gemini 1.5 Flash`, nhưng mã backend hiện tại đang gọi model `gemini-2.5-flash`. Bạn nên chọn một cách viết thống nhất giữa nội dung báo cáo, hình minh họa và mã nguồn để tránh bị hội đồng hỏi ngược.

Ngoài ra, dependency `nodemailer`, `redis`, `bullmq`, `qrcode.react` có xuất hiện trong `package.json`, nhưng với phạm vi mã đang thấy thì chưa phải là các thư viện nổi bật của luồng nghiệp vụ chính. Nếu cần trình bày ngắn gọn, bạn nên ưu tiên các thư viện thực sự xuất hiện trong chức năng đã hiện thực và demo được.