# MegaTrip Backend

Backend Node.js + Express + MongoDB cho 2 app frontend `megatrip-client` và `megatrip_admin`, thay thế cho `https://megatripserver.onrender.com`.

## Các module đã có
- **Auth**: đăng ký (kèm OTP qua email), đăng nhập (JWT), quên/đặt lại mật khẩu, đổi mật khẩu, cập nhật hồ sơ, quản lý user (admin)
- **Tours**: CRUD, tra cứu theo slug, slot ngày khởi hành
- **Buses**: CRUD, bus-slots (sơ đồ ghế theo ngày)
- **Orders**: CRUD, đơn theo khách hàng, đổi lịch, thống kê theo khách hàng
- **Promotions**: CRUD, validate mã giảm giá
- **Reviews**: CRUD, đánh giá theo sản phẩm
- **Support / Tickets**: CRUD ticket hỗ trợ, phản hồi ticket
- **News (admin)**: CRUD tin tức
- **Payments**: VNPay, MoMo, ZaloPay (tạo link thanh toán + xử lý callback/IPN)

## Cài đặt

```bash
npm install
cp .env.example .env   # rồi điền các giá trị thật (Mongo URI, JWT secret, SMTP, merchant key VNPay/Momo/ZaloPay...)
npm run seed            # tạo tài khoản admin mặc định (email/mật khẩu trong .env: ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev              # chạy ở chế độ dev (nodemon), mặc định cổng 8080
```

MongoDB: có thể dùng MongoDB local (`mongod`) hoặc MongoDB Atlas (đổi `MONGO_URI` trong `.env`).

## Nối 2 frontend vào backend này

Trong `.env.local` của **megatrip-client** và **megatrip_admin**, set:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_API_BASE=http://localhost:8080
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_PAYMENT_BASE=http://localhost:8080
```

> Lưu ý: file `megatrip-client/src/app/thanh-toan/page.tsx` có 2 chỗ đang **hardcode** thẳng URL
> `https://demo-payment-nc15.onrender.com` cho VNPay/Momo/Zalo (không đi qua biến môi trường) —
> bạn cần sửa tay 2 dòng đó thành `${PAYMENT_BASE}/...` nếu muốn chúng gọi về backend này.
> Tương tự, `megatrip-client/src/apis/auth.ts` (hàm `updateProfile`) đang hardcode
> `https://megatripserver.onrender.com/api/auth/me` — cũng cần sửa thành biến môi trường.

## Cấu trúc thư mục

```
src/
  config/db.js          # kết nối MongoDB
  models/                # Mongoose schema: User, Tour, Bus, Order, Promotion, Review, Ticket, News
  controllers/            # logic xử lý từng module
  routes/                  # định nghĩa endpoint (khớp path frontend đang gọi)
  middleware/              # auth (JWT) + xử lý lỗi
  utils/                   # JWT helper, gửi mail OTP, seed admin
  app.js / server.js
```

## Danh sách endpoint chính

| Method | Path | Ghi chú |
|---|---|---|
| POST | /api/auth/register | Đăng ký + gửi OTP |
| POST | /api/auth/verify-otp | Xác thực OTP |
| POST | /api/auth/login | Đăng nhập, trả JWT |
| GET/PUT | /api/auth/me | Xem/sửa hồ sơ (cần Bearer token) |
| GET | /api/tours , /api/tours/slug/:slug | Danh sách / chi tiết tour |
| GET | /api/buses , /api/buses/bus-slots/:id | Danh sách / ghế xe |
| POST | /api/orders | Tạo đơn hàng |
| POST | /api/promotions/validate | Kiểm tra mã giảm giá |
| POST | /vnpay/create_payment_url | Tạo link thanh toán VNPay |
| POST | /momo/payment , /zalo/payment | Tạo thanh toán MoMo / ZaloPay |

## Lưu ý về thanh toán thật

Các hàm ký chữ ký (HMAC) cho VNPay/MoMo/ZaloPay đã viết đúng theo tài liệu chính thức của từng cổng,
nhưng **cần bạn điền `TMN_CODE`, `HASH_SECRET`, `PARTNER_CODE`, `APP_ID`... thật** trong `.env`
(đăng ký tài khoản merchant sandbox/production tại cổng thanh toán tương ứng) thì mới tạo được link thanh toán thành công.
Sandbox không cần thẻ thật, nhưng vẫn cần đăng ký tài khoản test tại VNPay/MoMo/ZaloPay để lấy key.
