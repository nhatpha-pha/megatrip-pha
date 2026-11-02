MegaTrip – Ứng dụng du lịch trực tuyến Full-stack
MegaTrip được xây dựng theo mô hình Full-stack, bao gồm ba project hoạt động độc lập nhưng có sự liên kết với nhau thông qua hệ thống API. Các thành phần được phát triển bằng những công nghệ phù hợp với từng chức năng, giúp việc quản lý, phát triển và bảo trì hệ thống thuận tiện hơn.
1. Cấu trúc hệ thống
Hệ thống MegaTrip được chia thành ba thành phần chính:
Thư mục	Chức năng	Cổng mặc định
megatrip-backend	Xây dựng API backend bằng Node.js, Express và MongoDB	8080
megatrip-client	Giao diện website dành cho khách hàng, phát triển bằng Next.js	3000
megatrip_admin	Giao diện quản trị hệ thống, phát triển bằng Next.js	3001

Ba project được tổ chức riêng biệt nhằm phân chia rõ nhiệm vụ giữa xử lý dữ liệu, giao diện khách hàng và chức năng quản trị. Trong quá trình hoạt động, hai giao diện frontend gửi yêu cầu đến backend thông qua API tại địa chỉ http://localhost:8080.
2. Hướng dẫn khởi chạy hệ thống
Để hệ thống hoạt động ổn định trên môi trường local, cần khởi chạy lần lượt ba thành phần sau.

Bước 1. Khởi chạy Backend

Mở Terminal tại thư mục megatrip-backend và thực hiện:
npm install
cp .env.example .env
npm run seed
npm run dev


Backend sử dụng MongoDB để lưu trữ dữ liệu và cung cấp API cho hai ứng dụng frontend. Sau khi khởi chạy thành công, server hoạt động tại:

http://localhost:8080

Bước 2. Khởi chạy Website khách hàng

Mở Terminal mới tại thư mục megatrip-client:
npm install
npm run dev


Website khách hàng được truy cập tại:

http://localhost:3000

Giao diện này cung cấp các chức năng phục vụ người dùng trong quá trình tìm kiếm thông tin và sử dụng dịch vụ du lịch.

Bước 3. Khởi chạy Trang quản trị

Mở Terminal mới tại thư mục megatrip_admin:
npm install
npm run dev


Trang quản trị được truy cập tại:

http://localhost:3001

Đây là khu vực dành cho quản trị viên thực hiện các thao tác quản lý và theo dõi hoạt động của hệ thống.
3. Cấu hình kết nối giữa các thành phần
Để đảm bảo hai ứng dụng frontend có thể trao đổi dữ liệu với backend, hệ thống sử dụng các biến môi trường để cấu hình địa chỉ API.

Cụ thể, hai file .env.local trong thư mục megatrip-client và megatrip_admin được thiết lập để trỏ đến backend tại địa chỉ:
http://localhost:8080


Nhờ đó, các yêu cầu từ website khách hàng và trang quản trị đều được gửi đến cùng một hệ thống backend. Backend tiếp nhận yêu cầu, xử lý nghiệp vụ, tương tác với cơ sở dữ liệu MongoDB và trả kết quả về giao diện tương ứng.
4. Quy trình hoạt động tổng thể
Quy trình trao đổi dữ liệu giữa các thành phần được thực hiện như sau:
1. Người dùng truy cập website MegaTrip hoặc trang quản trị thông qua trình duyệt.
2. Frontend tiếp nhận thao tác và gửi yêu cầu đến backend thông qua API.
3. Backend kiểm tra, xử lý yêu cầu và thực hiện các nghiệp vụ tương ứng.
4. Khi cần thiết, backend truy vấn hoặc cập nhật dữ liệu trong MongoDB.
5. Kết quả xử lý được backend trả về frontend để hiển thị cho người dùng.
Cách tổ chức này giúp hệ thống phân tách rõ phần giao diện và phần xử lý nghiệp vụ, đồng thời tạo điều kiện thuận lợi cho việc mở rộng và phát triển các chức năng trong tương lai.
