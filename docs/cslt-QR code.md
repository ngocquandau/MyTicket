# Cơ sở lý thuyết cho chức năng QR mã vé trong lịch sử vé và email

## 1. Tổng quan chức năng

Chức năng QR mã vé trong hệ thống MyTicket được xây dựng để giải quyết hai bài toán nghiệp vụ quan trọng sau khi người dùng thanh toán thành công. Thứ nhất, hệ thống phải cho phép người mua xem lại mã vé trong màn hình `Vé của tôi`, từ đó có thể mở nhanh thông tin vé điện tử hoặc tải ảnh QR về máy. Thứ hai, hệ thống phải tự động gửi email xác nhận đặt vé, trong đó mỗi vé có đường dẫn truy cập và ảnh QR tương ứng để người dùng có thể sử dụng ngay cả khi không mở ứng dụng web. Vì vậy, chức năng này không chỉ là một thành phần giao diện, mà là một luồng tích hợp xuyên suốt giữa frontend, backend, cơ sở dữ liệu và dịch vụ gửi email.

Về bản chất, mã QR trong hệ thống không lưu toàn bộ thông tin vé ở dạng văn bản hiển thị cho người dùng, mà mã hóa một URL công khai dẫn đến trang thông tin vé điện tử. Khi người dùng quét mã bằng điện thoại hoặc bấm vào link trong email, hệ thống sẽ mở route frontend dạng `/ticket-info/:ticketToken`. Từ trang này, frontend tiếp tục gọi public API của backend để lấy về dữ liệu vé, thông tin sự kiện, thông tin thanh toán và trạng thái hợp lệ của vé. Cách thiết kế này giúp mã QR gọn nhẹ, dễ quét, đồng thời dễ dàng thay đổi giao diện hiển thị ở phía web mà không cần thay đổi cấu trúc mã QR đã phát hành.

Trong implementation hiện tại, hệ thống sử dụng hai cách sinh QR khác nhau nhưng cùng dẫn về một đích nghiệp vụ. Ở frontend, component `QRCode` của Ant Design được dùng để preview nhanh mã QR ngay trong modal lịch sử vé. Ở backend, thư viện `qrcode` được dùng để sinh ảnh PNG thật cho hai trường hợp quan trọng hơn: gửi email xác nhận đặt vé và cung cấp API tải file QR về máy. Cách tách này giúp frontend hiển thị nhanh, trong khi backend vẫn đảm bảo tạo ra tệp ảnh QR ổn định, có thể gửi qua email và lưu tạm trong quá trình phản hồi request.

## 2. Ngôn ngữ lập trình sử dụng

### 2.1 JavaScript ở phía backend

Phần backend của MyTicket được xây dựng bằng JavaScript theo chuẩn ES Modules. JavaScript phù hợp với các hệ thống web cần xử lý nhiều tác vụ I/O bất đồng bộ như nhận request HTTP, truy vấn dữ liệu, tạo mã QR, đọc file logo và gửi email qua dịch vụ bên thứ ba. Trong chức năng QR mã vé, JavaScript được dùng để tổ chức controller, route, service và helper, đặc biệt ở các xử lý sau:

- xây dựng token công khai của vé để đưa vào URL QR;
- tạo QR PNG bằng `QRCode.toBuffer(...)`;
- kiểm tra quyền truy cập trước khi cho phép tải QR;
- tạo nội dung email xác nhận đặt vé;
- đính kèm QR vào email dưới dạng inline attachment.

JavaScript ở backend còn có ưu điểm là đồng bộ với hệ sinh thái Node.js và npm, nhờ đó việc tích hợp thư viện `qrcode`, `@sendgrid/mail`, `mongoose` và `express` trở nên dễ dàng, thống nhất và ít chi phí chuyển đổi giữa các lớp trong hệ thống.

### 2.2 TypeScript ở phía frontend

Phần frontend của MyTicket được phát triển bằng TypeScript kết hợp React. TypeScript là phần mở rộng của JavaScript có bổ sung hệ thống kiểu dữ liệu tĩnh, giúp kiểm soát lỗi sớm khi phát triển giao diện có nhiều trạng thái và dữ liệu lồng nhau. Đối với chức năng QR mã vé, TypeScript giúp mô tả rõ các cấu trúc dữ liệu như `PurchaseItem`, `ticketList`, `event`, `ticketClass`, qua đó hạn chế lỗi khi render lịch sử vé, mở modal QR, tạo URL thông tin vé và gọi API tải QR.

Sử dụng TypeScript ở frontend đặc biệt hữu ích trong bối cảnh màn hình `My Tickets` phải xử lý nhiều tình huống: vé tự do, vé có ghế, sự kiện sắp diễn ra, sự kiện đã kết thúc, tìm kiếm, sắp xếp và mở QR cho từng vé. Các khai báo kiểu giúp lập trình viên duy trì tính đồng nhất giữa dữ liệu nhận từ backend và giao diện hiển thị cho người dùng.

## 3. Framework và nền tảng phát triển

### 3.1 Node.js

Node.js là môi trường chạy JavaScript phía server và là nền tảng của toàn bộ backend MyTicket. Điểm mạnh của Node.js là cơ chế event-driven và non-blocking I/O, rất phù hợp với các hệ thống web có nhiều request truy cập đồng thời. Trong luồng QR mã vé, Node.js đảm nhận các công việc như nhận request tải QR, tạo buffer ảnh PNG, đọc file logo từ hệ thống tệp, truy vấn MongoDB và gửi email qua SendGrid.

Khi hệ thống cần gửi email xác nhận đặt vé cho nhiều người dùng, Node.js cho phép thực hiện hiệu quả qua các thao tác bất đồng bộ. Điều này giúp chức năng QR/email vẫn duy trì tốc độ phản hồi tốt, đồng thời dễ mở rộng khi số lượng đơn hàng tăng lên.

### 3.2 Express.js

Express.js là framework backend được xây dựng trên Node.js, cung cấp cơ chế route, middleware và tổ chức REST API đơn giản nhưng mạnh mẽ. Trong MyTicket, Express được dùng để phân chia rõ các route mua vé, thanh toán, thông tin vé công khai và tải QR. Riêng với chức năng QR mã vé, Express giúp định nghĩa các endpoint tiêu biểu sau:

- `GET /api/purchases/my-tickets`: lấy danh sách vé đã thanh toán của người dùng;
- `GET /api/purchases/tickets/:ticketId/qr-image`: trả file PNG của QR để người dùng tải về;
- `GET /api/purchases/tickets/:ticketId/public`: trả về thông tin công khai của vé để trang QR hiển thị;
- các route thanh toán sẽ kích hoạt gửi email vé sau khi xác nhận thanh toán thành công.

Express còn hỗ trợ middleware xác thực như `verifyToken`, giúp đảm bảo chỉ chủ sở hữu vé hoặc quản trị viên mới được phép tải ảnh QR. Đây là một điểm quan trọng về bảo mật, vì QR không chỉ là hình ảnh mà còn là cửa ngõ để truy cập thông tin vé điện tử.

### 3.3 ReactJS

ReactJS là thư viện xây dựng giao diện được sử dụng ở frontend MyTicket. React áp dụng mô hình component, cho phép chia màn hình thành các khối giao diện nhỏ, dễ tái sử dụng và dễ quản lý trạng thái. Trong chức năng QR mã vé, React được dùng để hiển thị lịch sử vé, mở modal QR, hiển thị trang thông tin vé điện tử và xử lý các sự kiện người dùng như bấm nút xem QR hoặc tải QR.

Lợi ích của React trong bài toán này nằm ở khả năng cập nhật giao diện theo trạng thái. Khi danh sách vé được tải về từ API, component lịch sử vé có thể lọc, sắp xếp và render lại ngay lập tức. Khi người dùng chọn một đơn hàng, modal QR được mở và các mã QR sẽ được render tự động theo danh sách vé của đơn hàng đó.

### 3.4 React Router DOM

React Router DOM là thư viện điều hướng cho ứng dụng React dạng SPA. Thư viện này đóng vai trò rất quan trọng trong chức năng QR mã vé vì nó định nghĩa đích đến của mã QR. Cụ thể, mã QR và link trong email đều trỏ đến route frontend dạng `/ticket-info/:ticketId`. Sau khi route này được mở, component `TicketInfoPage` sẽ đọc `ticketId` từ URL, sau đó gọi public API của backend để lấy thông tin vé hợp lệ.

Cách điều hướng bằng React Router DOM giúp hệ thống đạt được hai mục tiêu. Thứ nhất, người dùng quét mã QR sẽ nhìn thấy giao diện web được thiết kế đồng bộ với thương hiệu MyTicket thay vì chỉ nhận dữ liệu thuần từ API. Thứ hai, backend và frontend được tách rõ: backend phụ trách cung cấp dữ liệu, frontend phụ trách trình bày và trải nghiệm người dùng.

## 4. Thư viện và công nghệ trực tiếp phục vụ chức năng QR mã vé

### 4.1 Thư viện `qrcode`

`qrcode` là thư viện quan trọng nhất ở phía backend đối với chức năng này. Thư viện này cho phép mã hóa một chuỗi ký tự hoặc URL thành hình QR dưới nhiều định dạng, trong đó MyTicket đang sử dụng chủ yếu phương thức `QRCode.toBuffer(...)` để tạo ảnh PNG. Trong hệ thống hiện tại, `qrcode` được dùng ở backend cho hai mục đích chính:

- tạo ảnh QR để đính kèm vào email xác nhận đặt vé;
- tạo ảnh QR để người dùng tải về máy từ màn hình `Vé của tôi`.

Khi backend tạo QR, dữ liệu đầu vào không phải là nội dung sự kiện hay thông tin người mua, mà là URL công khai dạng `/ticket-info/:ticketToken`. Cách làm này giúp mã QR ngắn gọn, khả năng quét tốt hơn và cho phép backend kiểm soát dữ liệu thật sự thông qua API public. Ngoài ra, do `qrcode` trả về `Buffer`, backend có thể tái sử dụng ngay cho nhiều mục đích khác nhau như gửi email hoặc trả file download mà không cần lưu tệp tạm trên ổ đĩa.

### 4.2 QRCode component của Ant Design

Ở phía frontend, MyTicket sử dụng component `QRCode` của Ant Design để render QR preview trong modal lịch sử vé. Đây là giải pháp phù hợp cho trường hợp cần hiển thị nhanh mã QR ngay trong giao diện web mà không cần yêu cầu backend sinh tệp ảnh mới mỗi lần mở modal. Khi người dùng bấm vào nút xem mã QR trong trang `My Tickets`, frontend sẽ tự tạo URL thông tin vé và đưa vào component `QRCode` để vẽ mã ngay trên client.

Ưu điểm của cách làm này là:

- phản hồi nhanh, không phải chờ request tạo ảnh từ server;
- giảm tải cho backend trong trường hợp người dùng chỉ cần xem QR để check nhanh;
- dễ kết hợp với modal và các thành phần giao diện sẵn có của Ant Design.

Cần lưu ý rằng mã QR preview ở frontend chỉ phục vụ hiển thị trực quan. Khi cần một file QR có thể tải về hoặc nhúng vào email, hệ thống vẫn chuyển sang backend để sinh PNG thật bằng thư viện `qrcode`.

### 4.3 Ant Design

Ant Design không chỉ đóng góp component QRCode mà còn là thư viện UI chính được dùng để xây dựng modal, card, button, tag, pagination, input và thông báo trong màn hình lịch sử vé. Trong chức năng QR mã vé, Ant Design giúp tạo một giao diện nhất quán cho các thao tác sau:

- hiển thị danh sách đơn mua và danh sách vé;
- mở modal xem mã QR của từng vé;
- thông báo lỗi và thông báo thành công khi tải QR;
- kết hợp icon và trạng thái để giúp người dùng thao tác nhanh.

Sử dụng một bộ UI component thống nhất giúp giảm thời gian phát triển, đồng thời đảm bảo trải nghiệm người dùng nhất quán trên toàn bộ hệ thống.

### 4.4 Axios

Axios là thư viện HTTP được frontend sử dụng để giao tiếp với backend thông qua `axiosClient`. Đối với chức năng QR mã vé, Axios đóng vai trò cầu nối giữa giao diện và API, cụ thể:

- lấy danh sách vé đã thanh toán của người dùng;
- gọi API tải file QR về dạng `blob`;
- gọi public API để lấy thông tin vé khi người dùng mở link từ email hoặc quét mã QR.

Việc chuẩn hóa request qua service riêng giúp frontend dễ bảo trì hơn, vì logic gọi API được tách khỏi component giao diện. Điều này phù hợp với kiến trúc hiện đại, trong đó UI tập trung vào hiển thị, còn lớp service tập trung vào giao tiếp dữ liệu.

### 4.5 `@sendgrid/mail`

`@sendgrid/mail` là thư viện được sử dụng để gửi email giao dịch trong hệ thống MyTicket. Sau khi thanh toán thành công, backend gọi hàm gửi email xác nhận đặt vé và truyền vào danh sách `ticketEntries`, mỗi phần tử chứa link vé và QR tương ứng. SendGrid nhận HTML email hoàn chỉnh cùng danh sách attachment để gửi đến người mua.

Một điểm kỹ thuật quan trọng là email hiện tại không đưa QR vào nội dung theo kiểu `data:image/...` mà nhúng ảnh QR bằng cơ chế inline attachment thông qua `cid`. Cách làm này giúp email tương thích tốt hơn với các dịch vụ thư như Gmail, giảm nguy cơ ảnh không hiển thị. Do đó, `@sendgrid/mail` không chỉ là thư viện gửi thư đơn thuần, mà là một mắt xích quan trọng để đưa QR mã vé đến tay người dùng ở giai đoạn sau thanh toán.

### 4.6 MongoDB và Mongoose

Thông tin phục vụ QR mã vé được lưu trong MongoDB và truy xuất thông qua Mongoose. MongoDB phù hợp với bài toán quản lý vé sự kiện do dữ liệu có nhiều thành phần lồng nhau và có thể thay đổi linh hoạt theo nghiệp vụ. Trong luồng QR, hệ thống cần liên kết giữa các thực thể `Ticket`, `Purchase`, `TicketClass`, `Event` và `User`. Mongoose giúp định nghĩa schema, thực hiện populate và truy vấn có cấu trúc.

Khi backend cần xác định QR của một vé có hợp lệ hay không, hệ thống phải:

- tìm đúng vé theo `ticketId` hoặc `_id` công khai;
- kiểm tra đơn mua liên quan đã có `paymentStatus = paid` hay chưa;
- xác minh người yêu cầu tải QR có phải chủ sở hữu vé hay là quản trị viên hay không;
- lấy thêm thông tin sự kiện và thanh toán để hiển thị ở trang vé điện tử.

Những yêu cầu này chỉ có thể thực hiện tốt khi tầng dữ liệu được tổ chức rõ ràng và hỗ trợ truy vấn quan hệ tham chiếu hiệu quả, do đó MongoDB và Mongoose là nền tảng dữ liệu quan trọng của chức năng.

### 4.7 Các module `node:fs`, `node:path`, `node:url`

Ngoài các framework và thư viện lớn, hệ thống còn sử dụng các module có sẵn của Node.js như `fs`, `path` và `url`. Vai trò của chúng trong chức năng QR mã vé là đọc ảnh logo MyTicket từ frontend asset, sau đó nhúng vào email xác nhận đặt vé hoặc vào trang vé điện tử công khai. Dù không sinh QR trực tiếp, nhóm module này giúp hoàn thiện hình ảnh thương hiệu và tăng tính chuyên nghiệp cho sản phẩm.

### 4.8 `react-barcode`

Sau khi người dùng mở link từ mã QR, trang `TicketInfoPage` còn hiển thị thêm barcode bằng thư viện `react-barcode`. Barcode không thay thế QR mà đóng vai trò bổ sung, giúp nhân viên check-in có thêm một cách nhận diện vé. Về mặt công nghệ, đây là lớp hiển thị phía client, phục vụ mục tiêu thực tế là tăng khả năng nhận diện và xác thực vé ở điểm soát vé.

## 5. Cơ chế hoạt động của chức năng QR mã vé trong hệ thống

### 5.1 Tạo URL công khai cho từng vé

Trung tâm của chức năng là hàm tạo URL công khai cho vé. Backend xây dựng đường dẫn theo dạng:

```txt
${FRONTEND_URL}/ticket-info/${publicToken}
```

Trong đó `publicToken` ưu tiên là `_id` của document `Ticket`, nếu có, để giảm rủi ro trùng mã giữa nhiều đơn mua. Cách chọn token này giúp liên kết giữa mã QR và một vé cụ thể trở nên chính xác hơn. Frontend cũng áp dụng cùng một quy tắc khi tự preview QR trong modal lịch sử vé, nhằm đảm bảo link hiển thị ở client và link backend nhúng vào QR PNG là thống nhất.

### 5.2 Hiển thị QR trong màn hình lịch sử vé

Tại trang `My Tickets`, sau khi frontend gọi API lấy danh sách đơn mua thành công, người dùng có thể bấm xem mã QR của từng đơn. Lúc này, frontend lấy danh sách `ticketList`, tạo URL công khai cho từng vé, rồi render bằng component `QRCode` của Ant Design. Vì QR được vẽ trực tiếp trên client, thao tác này rất nhanh và phù hợp với mục tiêu xem thông tin tại chỗ.

Nếu người dùng muốn lưu mã QR thành tệp ảnh, frontend sẽ gọi API `downloadTicketQrImageAPI(...)`. Khi nhận về dữ liệu dạng `blob`, trình duyệt sẽ tạo object URL và kích hoạt tải tệp PNG về máy. Như vậy, giao diện lịch sử vé gồm hai lớp: một lớp preview nhanh bằng client-side QR và một lớp tải tệp thật bằng server-side QR.

### 5.3 Tạo QR PNG để tải xuống

Khi API `GET /api/purchases/tickets/:ticketId/qr-image` được gọi, backend thực hiện nhiều bước xác minh trước khi sinh ảnh:

1. nhận `ticketId` từ path và `ref` từ query nếu có;
2. tìm vé theo nhiều khả năng, bao gồm `_id` và `ticketId`;
3. kiểm tra trạng thái thanh toán của đơn mua;
4. kiểm tra người gọi API có quyền truy cập hay không;
5. tạo `qrValue` là URL công khai của vé;
6. gọi `QRCode.toBuffer(...)` để sinh ảnh PNG;
7. trả về file PNG với header `Content-Type: image/png`.

Đây là một luồng quan trọng về kỹ thuật vì nó cho thấy backend không lưu sẵn mã QR trong cơ sở dữ liệu, mà sinh động theo yêu cầu. Cách sinh động giúp dữ liệu linh hoạt và tránh dư thừa lưu trữ, đồng thời vẫn đảm bảo mọi QR phản hồi đúng với tình trạng hiện tại của hệ thống.

### 5.4 Tạo QR và nhúng vào email xác nhận đặt vé

Sau khi đơn hàng thanh toán thành công, backend kích hoạt hàm gửi email vé. Trong giai đoạn này, hệ thống gọi helper tạo QR attachment cho từng vé. Mỗi attachment bao gồm:

- tên tệp ảnh QR;
- `cid` để nhúng inline vào HTML email;
- `content` là buffer PNG được sinh từ `qrcode`.

Service email sau đó lập HTML email theo danh sách `ticketEntries`. Mỗi vé trong email đều có:

- mã vé;
- thông tin chỗ ngồi hoặc loại vé;
- nút bấm xem vé điện tử;
- ảnh QR được nhúng qua `cid`.

Cơ chế nhúng inline bằng `cid` có ý nghĩa thực tế lớn hơn so với việc hiển thị QR bằng dữ liệu base64 trực tiếp, vì nó tương thích tốt hơn với các dịch vụ email phổ biến và giữ cho email ổn định hơn khi hiển thị trên nhiều thiết bị.

### 5.5 Hiển thị trang thông tin vé điện tử sau khi quét QR

Khi người dùng quét mã QR hoặc bấm link trong email, trình duyệt mở route `/ticket-info/:ticketId`. Component `TicketInfoPage` sẽ lấy `ticketId` từ URL, đọc thêm `ref` nếu có, rồi gọi public API để lấy thông tin chi tiết của vé. Sau khi có dữ liệu, trang hiển thị:

- mã vé;
- loại vé;
- vị trí ghế hoặc khu vực;
- thông tin sự kiện;
- ngày mua vé;
- tổng thanh toán;
- barcode check-in.

Thiết kế này cho thấy mã QR không phải điểm kết thúc, mà là điểm bắt đầu của một quy trình truy xuất thông tin vé điện tử trên web. Điều đó giúp hệ thống dễ nâng cấp giao diện, bổ sung thương hiệu và kiểm soát logic xác thực ở phía server.

## 6. Luồng thực thi và logic xử lý

### 6.1 Luồng xem QR trong lịch sử vé

Luồng này bắt đầu từ màn hình `My Tickets` ở frontend. Khi trang được mở, frontend gọi API lấy danh sách đơn mua thành công của người dùng. Backend trả về danh sách purchase, trong đó mỗi purchase được bổ sung `ticketList` đầy đủ thông qua helper xử lý vé. Sau khi người dùng bấm vào nút xem QR, frontend mở modal và duyệt qua từng phần tử trong `ticketList` để tạo URL thông tin vé công khai. URL này được đưa trực tiếp vào component `QRCode` của Ant Design để render mã QR trên client.

Về logic xử lý, đây là luồng preview nhanh nên frontend không yêu cầu backend sinh ảnh QR. Backend chỉ đóng vai trò cung cấp dữ liệu purchase và ticket, còn quá trình vẽ mã QR diễn ra ngay trên trình duyệt. Cách tổ chức này giúp thao tác mở QR rất nhanh, giảm độ trễ và phù hợp với tình huống người dùng chỉ cần xem mã để check thông tin ngay trên điện thoại.

Trình tự xử lý có thể tóm tắt như sau:

1. frontend gọi `getMyPurchasesAPI()`;
2. backend route `GET /api/purchases/my-tickets` xử lý và trả `ticketList`;
3. người dùng bấm mở modal QR;
4. frontend gọi `buildTicketInfoUrl(ticketId, ticketRef)` cho từng vé;
5. component `QRCode` render QR preview từ URL vừa tạo.

### 6.2 Luồng tải QR PNG từ lịch sử vé

Khác với luồng preview, luồng tải QR cần backend sinh ra tệp PNG thật để người dùng lưu về máy. Khi người dùng bấm `Tải QR`, frontend gọi hàm `handleDownloadQr(ticketId, ticketRef)`, sau đó request API `downloadTicketQrImageAPI(...)`. Request được gửi tới endpoint `GET /api/purchases/tickets/:ticketId/qr-image` kèm theo `ref` nếu có.

Tại backend, controller `downloadTicketQrImage` thực hiện logic nghiệp vụ theo thứ tự: tìm đúng vé bằng `ticketId` hoặc `_id`, kiểm tra vé đã thanh toán hay chưa, kiểm tra người gọi API có phải chủ sở hữu vé hay admin hay không, sau đó mới tạo URL công khai và sinh ảnh PNG bằng `QRCode.toBuffer(...)`. Ảnh được trả về với header file download, frontend nhận dữ liệu `blob`, tạo object URL và kích hoạt cơ chế tải tệp của trình duyệt.

Trình tự xử lý:

1. người dùng bấm `Tải QR` trong modal;
2. frontend gọi `downloadTicketQrImageAPI(ticketId, ticketRef)`;
3. backend route `GET /api/purchases/tickets/:ticketId/qr-image` được kích hoạt;
4. controller `downloadTicketQrImage` tìm vé bằng `resolveTicketCandidates(...)`;
5. backend kiểm tra quyền truy cập và `paymentStatus = paid`;
6. backend tạo `qrValue = buildTicketInfoUrl(...)`;
7. backend gọi `QRCode.toBuffer(qrValue, ...)` để sinh PNG;
8. frontend nhận `blob` và tải tệp xuống máy người dùng.

### 6.3 Luồng gửi QR qua email sau thanh toán thành công

Luồng này là luồng quan trọng nhất vì nó kết nối thanh toán, tạo vé và gửi email giao dịch. Sau khi người dùng thanh toán thành công, backend cập nhật purchase sang trạng thái `paid`. Từ điểm này, hệ thống gọi `triggerTicketEmail(purchaseId)` để khởi động quá trình gửi email vé. Hàm này lấy thông tin purchase, user, ticketClass và event; sau đó gọi `ensurePurchaseTickets(...)` để bảo đảm mỗi purchase đều có danh sách vé đầy đủ.

Với mỗi ticket, backend tạo một `ticketEntry` gồm mã vé, vị trí ghế, link vé công khai và attachment QR. Attachment này được sinh bởi `buildTicketQrAttachment(...)`, bên trong sử dụng `QRCode.toBuffer(...)` để tạo ảnh PNG và sinh thêm `cid` để nhúng vào email. Cuối cùng, service `sendBookingConfirmation(...)` nhận danh sách `ticketEntries`, dựng HTML email và danh sách attachments, rồi gửi thư bằng `sgMail.send(...)` của SendGrid.

Trình tự xử lý:

1. người dùng thanh toán thành công;
2. backend cập nhật purchase thành `paid`;
3. backend gọi `triggerTicketEmail(purchaseId)`;
4. controller lấy purchase, user, event và ticket list;
5. mỗi ticket được xử lý qua `buildTicketQrAttachment(...)`;
6. backend tạo `ticketEntries` gồm link và QR inline;
7. `sendBookingConfirmation(...)` dựng HTML email;
8. SendGrid gửi email chứa QR và link vé điện tử.

### 6.4 Luồng xử lý với đơn hàng 0 đồng

Ngoài luồng thanh toán qua cổng thanh toán, hệ thống còn có trường hợp đơn hàng `0 đồng`. Trong trường hợp này, backend không cần chờ webhook thanh toán mà có thể đánh dấu purchase là `paid` ngay sau khi tạo đơn. Sau khi transaction hoàn tất, backend chủ động gọi `triggerTicketEmail(...)` để chạy lại toàn bộ logic gửi email vé giống với đơn hàng thanh toán thông thường.

Ý nghĩa của logic này là đảm bảo trải nghiệm người dùng được thống nhất: dù là vé miễn phí hay vé trả phí, nếu đơn hàng hợp lệ thì người mua vẫn nhận được email vé, link vé và QR tương ứng.

### 6.5 Luồng mở trang vé điện tử sau khi quét QR

Khi người dùng quét QR hoặc bấm vào link trong email, trình duyệt không đi thẳng đến một tệp dữ liệu mà mở route frontend `/ticket-info/:ticketId`. React Router DOM match route này tới `TicketInfoPage`. Component này đọc `ticketId` từ path, nhận thêm `ref` từ query string nếu có, rồi gọi public API để lấy dữ liệu vé hợp lệ.

Tại backend, endpoint `GET /api/purchases/tickets/:ticketId/public` thực hiện việc tìm vé, kiểm tra purchase đã thanh toán hay chưa, populate thông tin event, payment, buyer và ticketClass, sau đó trả JSON công khai cho frontend. Frontend nhận JSON này và hiển thị giao diện vé điện tử hoàn chỉnh, bao gồm mã vé, thông tin sự kiện, thông tin mua hàng và barcode check-in.

Luôn cần nhấn mạnh rằng QR trong hệ thống không chứa sẵn toàn bộ nội dung vé mà chỉ trỏ đến một URL công khai. Toàn bộ phần xác thực và truy xuất dữ liệu thật sự vẫn được đặt ở backend, giúp hệ thống dễ kiểm soát hơn về bảo mật và dễ cập nhật giao diện sau này.

## 7. Lý do lựa chọn tập công nghệ hiện tại

Tập công nghệ được chọn cho chức năng QR mã vé có tính bổ trợ lẫn nhau rất rõ. Node.js và Express phù hợp với backend REST API và xử lý bất đồng bộ. React và TypeScript phù hợp với giao diện tương tác cao, cần cập nhật trạng thái liên tục. Thư viện `qrcode` đáp ứng tốt nhu cầu sinh ảnh QR thật ở phía server, trong khi Ant Design QRCode đáp ứng nhu cầu preview nhanh ở phía client. Axios giúp kết nối frontend và backend rõ ràng, còn SendGrid giải quyết bài toán gửi email giao dịch chuyên nghiệp.

Quan trọng hơn, toàn bộ tập công nghệ này đều có hệ sinh thái phổ biến, tài liệu phong phú, dễ mở rộng và dễ bảo trì. Điều này phù hợp với tính chất của đồ án tốt nghiệp, nơi mà hệ thống cần đủ hiện đại để thể hiện năng lực kỹ thuật, nhưng cũng phải đủ thực dụng để có thể demo, bảo vệ và nâng cấp trong tương lai.

## 8. Đánh giá vai trò của chức năng trong kiến trúc tổng thể

Chức năng QR mã vé trong lịch sử vé và email là một chức năng tiêu biểu vì nó cho thấy khả năng tích hợp đa tầng của hệ thống MyTicket. Chỉ trong một nghiệp vụ nhỏ là “xem và sử dụng mã vé”, hệ thống đã kết hợp đồng bộ các thành phần sau:

- frontend React để hiển thị và tương tác;
- backend Express để xử lý nghiệp vụ và cấp API;
- MongoDB/Mongoose để truy xuất dữ liệu vé và đơn mua;
- thư viện sinh QR để mã hóa URL công khai;
- dịch vụ email để phân phối thông tin vé cho người dùng;
- route public để phục vụ việc mở vé điện tử sau khi quét mã.

Do đó, đây là một ví dụ phù hợp để đưa vào báo cáo đồ án tốt nghiệp khi trình bày năng lực thiết kế hệ thống web full-stack, tích hợp dữ liệu, xử lý nghiệp vụ và trải nghiệm người dùng xoay quanh một chức năng có giá trị sử dụng thực tế cao.

## 9. Kết luận

Từ góc nhìn cơ sở lý thuyết, chức năng QR mã vé của MyTicket được xây dựng trên sự kết hợp hợp lý giữa ngôn ngữ lập trình, framework và thư viện chuyên biệt. JavaScript và TypeScript đảm bảo tính thống nhất giữa hai đầu frontend và backend. Node.js, Express và React tạo nên khung phát triển full-stack phù hợp với mô hình ứng dụng web hiện đại. Các thư viện `qrcode`, Ant Design QRCode, Axios, SendGrid, Mongoose và React Router DOM giải quyết từng bài toán kỹ thuật cụ thể trong luồng nghiệp vụ.

Nhờ sự kết hợp đó, hệ thống có thể vừa cho phép người dùng xem QR nhanh trong lịch sử vé, vừa tạo được QR PNG để tải xuống, đồng thời tự động gửi email xác nhận đặt vé có đính kèm QR inline. Đây là một minh chứng rõ ràng cho việc áp dụng công nghệ web hiện đại vào bài toán quản lý vé điện tử trong thực tế.
