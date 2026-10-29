# MegaTrip – Đánh giá điểm đồ án (góc nhìn giảng viên CNTT)

> **Lưu ý trước khi đọc:** đây là bản chấm **mô phỏng** do Claude đóng vai giảng viên CNTT, không phải điểm chính thức của Trường ĐH Tài nguyên và Môi trường TP.HCM. Mình không biết thang điểm và tỷ trọng chính thức của khoa/hội đồng, nên dùng **một rubric đồ án CNTT phổ biến (thang 10)** do mình giả định. Nếu khoa bạn có phiếu chấm riêng, hãy thay trọng số ở Mục 2, cách tính vẫn giữ nguyên.

## 1. Căn cứ chấm (những gì mình đã thấy)

| Nguồn | Nội dung đã xem |
|---|---|
| Mã nguồn | Backend 9 model, 83 endpoint, ~4.100 dòng; client ~39.000 dòng; admin ~28.500 dòng (đếm file `.js/.ts/.tsx` trong `src`) |
| Báo cáo | `megatrip-pha-DATN.docx`: ~10.000 từ, 3 chương + mở đầu + kết luận + tài liệu tham khảo, ~52 hình, nhiều bảng |
| Triển khai | Render (backend), 2 dự án Vercel (client, admin), MongoDB Atlas |
| Rà soát bảo mật | Đọc `auth.js`, các file `routes`, `orderController`, `paymentController` |

**Chưa làm được / chưa có căn cứ:**

- Không chạy thử ứng dụng, không xem demo, không xem lịch sử git (bản zip không có `.git`).
- Không kiểm chứng số liệu Lighthouse (92/96/95/98) hay "phản hồi AI dưới 2 giây" trong báo cáo.
- Không biết đóng góp cá nhân, hay câu trả lời khi bảo vệ.

## 2. Cách tính điểm

**Công thức:** `Điểm tổng = Σ (Trọng số × Điểm tiêu chí)`, trong đó điểm mỗi tiêu chí chấm trên thang 10.

| # | Tiêu chí | Trọng số | Điểm (0–10) | Quy đổi (= trọng số × điểm) |
|---|---|---|---|---|
| A | Cơ sở lý thuyết, tổng quan | 10% | 8,0 | 0,800 |
| B | Phân tích và thiết kế hệ thống | 20% | 7,5 | 1,500 |
| C | Cài đặt, khối lượng và mức hoàn thiện sản phẩm | 25% | 8,5 | 2,125 |
| D | Chất lượng kỹ thuật và bảo mật | 15% | 4,5 | 0,675 |
| E | Kiểm thử và đánh giá kết quả | 10% | 5,0 | 0,500 |
| F | Báo cáo và trình bày | 10% | 8,0 | 0,800 |
| G | Tính ứng dụng, mức độ mới | 10% | 7,5 | 0,750 |
| | **Tổng** | **100%** | | **7,150** |

**Điểm đề xuất: 7,2 / 10 (loại Khá, B).** Khoảng dao động hợp lý: **6,8 – 7,6**, tùy hội đồng, phần demo và câu trả lời khi bảo vệ.

## 3. Giải thích từng tiêu chí

### A. Cơ sở lý thuyết – 8,0
- **Điểm cộng:** Chương 1 có đủ các mảng: hệ thống đặt vé/tour, monorepo, Next.js + TypeScript, Tailwind/Shadcn, Express + MongoDB, cổng thanh toán, Gemini, Amadeus.
- **Điểm trừ:** Mình chỉ đọc mục lục nên chưa đánh giá được độ sâu và chất lượng trích dẫn.

### B. Phân tích và thiết kế – 7,5
- **Điểm cộng:**
  - Có yêu cầu chức năng và phi chức năng, tác nhân, use case.
  - Có kiến trúc 3 thành phần (client, admin, backend), thiết kế 9 schema và danh mục API.
  - Có luồng thanh toán, và các bảng đặc tả chức năng (file "Bảng Chương 2").
- **Điểm trừ:** Chưa thấy phân tích rủi ro và mô hình phân quyền (ai được làm gì với đơn hàng) – đây chính là chỗ code đang sai (xem D).

### C. Cài đặt và mức hoàn thiện – 8,5 (tiêu chí điểm cao nhất)
- **Điểm cộng:**
  - Quy mô lớn so với một đồ án tốt nghiệp thông thường: 3 ứng dụng, khoảng 72.000 dòng, 83 endpoint.
  - Tích hợp 3 cổng thanh toán, OTP email, Cloudinary, Swagger, chatbot Gemini, tra cứu Amadeus.
  - Đã deploy chạy online và có script seed.
- **Điểm trừ:**
  - Chưa tạo vé sau thanh toán nên "vé điện tử" thiếu dữ liệu thật.
  - Một phần chuyến bay dùng dữ liệu mẫu và giảm giá cứng.
  - Chưa có giữ chỗ chống bán trùng (báo cáo đã tự thừa nhận).

### D. Chất lượng kỹ thuật và bảo mật – 4,5 (tiêu chí kéo điểm xuống nhiều nhất)
Đây là phần giảng viên có kinh nghiệm sẽ trừ nặng:
- Người dùng đã đăng nhập xem/sửa được đơn của người khác (IDOR).
- Route hoàn tiền MoMo/ZaloPay công khai.
- MoMo IPN chưa thấy xác minh chữ ký.
- Một số API công khai: thống kê, upload, vé.
- Auth chưa có rate limit.
- Khóa API từng bị đưa ra phía trình duyệt (`NEXT_PUBLIC_*`), vẫn còn ở pricing/seatmap/đổi lịch.
- Thư mục `megatrip/` có file `.bson` trong repo.
- Chuỗi kết nối MongoDB có mật khẩu bị dán vào chat.

**Điểm cộng nhỏ để không xuống thấp hơn:** mật khẩu băm bcrypt, JWT, phân quyền admin/staff cho phần quản trị, CORS theo danh sách domain, VNPay và ZaloPay có kiểm tra chữ ký.

### E. Kiểm thử và đánh giá – 5,0
- **Điểm cộng:** Có bảng kiểm thử hộp đen 7 kịch bản (đều PASS) và đo Lighthouse.
- **Điểm trừ:**
  - Chỉ 7 kịch bản, toàn happy path, không có kịch bản lỗi hay phân quyền.
  - Không có kiểm thử tự động ở backend, chỉ có 2 file `utils.spec.ts`; không có CI.
  - Các con số Lighthouse và "<2 giây" cần có ảnh chụp hoặc báo cáo kèm theo để chứng minh khi bảo vệ.

### F. Báo cáo và trình bày – 8,0
- **Điểm cộng:** Cấu trúc đúng chuẩn, nhiều hình và bảng, có mục hạn chế và hướng phát triển trung thực.
- **Điểm trừ:**
  - Mục 3.3.1 mô tả "công khai API key phía client", mâu thuẫn với kiến trúc an toàn (key AI/Amadeus nên ở backend). Sau bản vá ở lượt trước, báo cáo cần cập nhật lại.
  - Mục hạn chế chưa nhắc các điểm bảo mật ở Mục D.

### G. Tính ứng dụng và mức độ mới – 7,5
- **Điểm cộng:** Kết hợp AI tư vấn, dữ liệu chuyến bay thời gian thực và nhiều cổng thanh toán nội địa, bài toán thực tế rõ.
- **Điểm trừ:** Phần mới phụ thuộc môi trường sandbox, nên giá trị "chạy thật" chưa được chứng minh.

## 4. Điểm có thể đạt nếu cải thiện

Nếu làm các việc dưới đây trước ngày bảo vệ, điểm dự kiến tăng như sau (ước lượng):

| Việc làm | Tiêu chí | Điểm mới | Cộng thêm vào tổng |
|---|---|---|---|
| Vá phân quyền đơn, khóa refund, kiểm tra chữ ký MoMo, rate limit auth, đổi toàn bộ khóa, dọn `.bson`, proxy Amadeus pricing/seatmap | D: 4,5 → 7,0 | 7,0 | +0,375 |
| Viết test API (Jest + Supertest) cho auth/order/payment + CI + thêm kịch bản lỗi/phân quyền vào Bảng 3.1 | E: 5,0 → 6,5 | 6,5 | +0,150 |
| Tạo vé + mã QR + email sau thanh toán | C: 8,5 → 9,0 | 9,0 | +0,125 |
| Cập nhật báo cáo cho khớp kiến trúc mới, thêm bảo mật vào hạn chế | F: 8,0 → 8,5 | 8,5 | +0,050 |
| **Tổng dự kiến** | | | **7,15 + 0,70 ≈ 7,85 (khoảng 7,8 – 8,0)** |

**Gợi ý khi bảo vệ:** hội đồng thường hỏi về bảo mật, luồng thanh toán và cách chống bán trùng. Hãy chuẩn bị sẵn câu trả lời cho ba câu này, và nói thẳng các hạn chế bạn đã biết, vì điều đó thường được đánh giá tốt hơn việc để hội đồng tự phát hiện.

## 5. Danh sách việc cần sửa gấp (tóm tắt)

| Ưu tiên | Việc cần làm |
|---|---|
| Ngay lập tức | Đổi mật khẩu MongoDB; tạo lại khóa Amadeus/Gemini; kiểm tra và xóa `.bson` khỏi repo (và lịch sử git nếu là dữ liệu thật) |
| 1–2 ngày | Kiểm tra chủ sở hữu đơn hàng; `protect, adminOnly` cho refund, stats, upload; xác minh chữ ký MoMo IPN; rate limit và `helmet` cho `/api/auth/*` |
| Tiếp theo | Proxy `/api/flights/pricing` và `/api/flights/seatmaps`; tạo vé sau thanh toán; system prompt cố định cho chatbot; tách dữ liệu mẫu khỏi dữ liệu thật |
| Song song | Test API tự động và GitHub Actions; cập nhật báo cáo |
