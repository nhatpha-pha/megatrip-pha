# MegaTrip – Danh sách việc chưa làm được và cần sửa gấp

Đánh giá dựa trên đọc code tĩnh repo `megatrip-pha` (ngày 29/10/2026). Chưa chạy thử ứng dụng; mức độ nghiêm trọng là nhận định của người đánh giá.

## Tóm tắt

Có 11 hạng mục. Bốn hạng mục đầu (phân quyền đơn hàng, hoàn tiền công khai, MoMo IPN, dữ liệu `.bson` trong repo) cần xử lý trước khi nhận thanh toán thật hoặc dữ liệu khách thật.

## 1. Phân quyền đơn hàng chưa kiểm tra chủ sở hữu (Nghiêm trọng)

**Vấn đề:** `GET /api/orders/customer/:customerId`, `GET /api/orders/:id` và `PUT /api/orders/:id` chỉ dùng `protect` (đã đăng nhập), không kiểm tra đơn có thuộc về người gọi hay không.

**Rủi ro:** người dùng đã đăng nhập có thể xem hoặc sửa đơn của người khác (lỗi IDOR).

**Cách sửa:** so sánh `req.user._id` với `customerId` của đơn; chỉ cho phép khi trùng khớp hoặc người gọi có role `admin`/`staff`. Giới hạn các trường khách được phép sửa trong `PUT`.

## 2. Route hoàn tiền không yêu cầu đăng nhập (Nghiêm trọng)

**Vấn đề:** `POST /momo/refund` và `POST /zalo/refund` công khai, nhận `orderId` và số tiền từ request.

**Rủi ro:** khi có khóa thật, bất kỳ ai cũng có thể gọi hoàn tiền với giá trị tùy ý.

**Cách sửa:** thêm `protect, adminOnly`; lấy số tiền và mã giao dịch từ đơn trong DB, không tin dữ liệu từ client; ghi log mọi lần hoàn tiền.

## 3. MoMo IPN chưa thấy kiểm tra chữ ký (Nghiêm trọng)

**Vấn đề:** VNPay và ZaloPay có kiểm tra chữ ký ở callback, nhưng `momoIpn` chưa thấy bước xác minh `signature`.

**Rủi ro:** kẻ gian có thể giả IPN để đánh dấu đơn là đã thanh toán.

**Cách sửa:** dựng lại chuỗi `rawSignature` theo tài liệu MoMo, tính HMAC-SHA256 bằng secret key, so sánh với `signature` nhận được; ngoài ra đối chiếu `amount` và `orderId` với đơn trong DB trước khi cập nhật trạng thái.

## 4. Thư mục `megatrip/` chứa file `.bson` trong repo (Nghiêm trọng)

**Vấn đề:** repo có `users.bson`, `orders.bson`... (bản dump MongoDB).

**Rủi ro:** nếu là dữ liệu thật, thông tin khách hàng và mã băm mật khẩu bị công khai trên GitHub.

**Cách sửa:** kiểm tra nội dung; xóa khỏi repo, thêm vào `.gitignore`; nếu từng chứa dữ liệu thật thì xóa khỏi lịch sử git (git filter-repo hoặc BFG) và buộc người dùng đổi mật khẩu.

## 5. Lộ khóa và chuỗi kết nối (Nghiêm trọng)

**Vấn đề:**

- `NEXT_PUBLIC_AMADEUS_CLIENT_ID/SECRET` vẫn còn được dùng ở pricing, seatmap (`ve-may-bay/page.tsx`, `FlightResults.tsx`) và đổi lịch (`tai-khoan/doi-lich/[id]/page.tsx`).
- Chuỗi kết nối MongoDB (gồm mật khẩu) đã bị dán vào chat.

**Cách sửa:**

- Đổi mật khẩu người dùng MongoDB trong Atlas và cập nhật `MONGO_URI` trên Render.
- Thêm route proxy `/api/flights/pricing` và `/api/flights/seatmaps`, sửa 3 file trên để gọi backend.
- Sau đó xóa các biến `NEXT_PUBLIC_AMADEUS_*` và `NEXT_PUBLIC_GEMINI_API_KEY` trên Vercel, tạo khóa mới cho Amadeus và Gemini.

## 6. Một số API còn công khai (Cao)

**Vấn đề:** `/api/stats/*` (doanh thu, hoạt động), `POST /api/upload`, `/api/tickets`, `POST /api/orders` không yêu cầu đăng nhập.

**Cách sửa:**

- Stats: `protect, adminOnly`.
- Upload: `protect`, giới hạn loại và dung lượng file.
- Tickets: `protect` và lọc theo chủ vé.
- Tạo đơn: yêu cầu đăng nhập, hoặc nếu cho khách vãng lai thì phải kiểm tra dữ liệu chặt và giới hạn tần suất.

## 7. Đăng nhập, OTP, quên mật khẩu chưa có rate limit (Cao)

**Vấn đề:** chỉ endpoint AI và chuyến bay mới có giới hạn số lần gọi.

**Rủi ro:** dò mật khẩu, đoán OTP 6 số, spam gửi email.

**Cách sửa:** thêm `express-rate-limit` cho `/api/auth/*` (ví dụ 5–10 lần/phút/IP cho login và verify-otp), khóa tạm tài khoản sau nhiều lần sai, đặt giới hạn số lần thử OTP cho mỗi mã, thêm `helmet`.

## 8. Chưa tạo vé sau khi thanh toán thành công (Trung bình)

**Vấn đề:** không có bước tạo bản ghi `Ticket` khi thanh toán xong, nên `/api/tickets` trả rỗng và vé điện tử chưa có nguồn dữ liệu thật.

**Cách sửa:** trong callback thanh toán thành công (và luồng COD được xác nhận), tạo vé với mã đặt chỗ, thông tin hành khách và mã QR; gửi email xác nhận; đảm bảo thao tác idempotent để callback gọi lại không tạo vé trùng.

## 9. Chatbot: link cũ và endpoint nhận prompt tùy ý (Trung bình)

**Vấn đề:** prompt trong `Chatbot.tsx` còn link `mega-trip-eewz.vercel.app`; `/api/ai/chat` nhận toàn bộ prompt từ client nên có thể bị dùng như proxy Gemini miễn phí.

**Cách sửa:** đổi link sang `https://megatrip-pha-megatrip-client.vercel.app`; đưa system prompt và việc dựng ngữ cảnh (tour, xe) về server, client chỉ gửi câu hỏi; giới hạn độ dài và tần suất theo người dùng.

## 10. Dữ liệu chuyến bay mẫu lẫn với dữ liệu thật (Trung bình)

**Vấn đề:** `sampleFlights` và mức giảm giá cứng (15–20%) còn trong trang vé máy bay; Amadeus Test thường trả ít hoặc không có chuyến nội địa Việt Nam.

**Cách sửa:** tách rõ chế độ demo với dữ liệu thật; hiển thị nhãn "dữ liệu mẫu" khi dùng dữ liệu giả; chỉ hiển thị giá gốc và giảm giá khi có nguồn dữ liệu thật; xem xét nguồn dữ liệu chuyến bay nội địa khác hoặc dữ liệu do admin nhập.

## 11. Kiểm thử và CI gần như chưa có (Trung bình)

**Vấn đề:** chỉ có hai file `utils.spec.ts`; không có test API, không có GitHub Actions.

**Cách sửa:** viết test Jest + Supertest cho auth, order, payment (đặc biệt các luật phân quyền ở mục 1, 2, 6); thêm workflow GitHub Actions chạy test và build cho backend, client và admin trên mỗi pull request.

## Thứ tự đề xuất

1. Ngay lập tức: mục 5 (đổi khóa và mật khẩu), mục 4 (dữ liệu `.bson`).
2. Trong 1–2 ngày: mục 1, 2, 3, 6, 7.
3. Tiếp theo: mục 8, 9, 10.
4. Song song: mục 11 để các lỗi phân quyền không tái diễn.
