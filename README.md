# MegaTrip - Ứng dụng hoàn chỉnh (Full-stack)

Gồm 3 project chạy độc lập, đã nối sẵn với nhau qua `http://localhost:8080`:

| Thư mục | Vai trò | Cổng mặc định |
|---|---|---|
| `megatrip-backend` | API backend (Node.js + Express + MongoDB) | 8080 |
| `megatrip-client` | Website khách hàng (Next.js) | 3000 |
| `megatrip_admin` | Trang quản trị (Next.js) | 3001 (tự đổi nếu 3000 bận) |

## Chạy nhanh (3 terminal)

**1) Backend** — bắt buộc chạy trước tiên:
```bash
cd megatrip-backend
npm install
cp .env.example .env
# Mở .env, điền MONGO_URI (Mongo local hoặc Atlas), JWT secret, SMTP (gửi OTP),
# và merchant key VNPay/MoMo/ZaloPay nếu cần thanh toán thật
npm run seed      # tạo tài khoản admin đầu tiên
npm run dev        # http://localhost:8080
```

**2) Website khách hàng**:
```bash
cd megatrip-client
npm install
npm run dev        # http://localhost:3000 - .env.local đã trỏ sẵn về backend local
```

**3) Trang quản trị**:
```bash
cd megatrip_admin
npm install
npm run dev        # http://localhost:3001 - .env.local đã trỏ sẵn về backend local
```

Đăng nhập admin bằng tài khoản mà `npm run seed` vừa tạo (mặc định trong `.env`:
`ADMIN_EMAIL=admin@megatrip.vn`, `ADMIN_PASSWORD=Admin@123` — nên đổi lại trong `.env` trước khi seed).

## Đã tự động xử lý sẵn

- Toàn bộ URL hardcode `megatripserver.onrender.com` và `demo-payment-nc15.onrender.com`
  trong code của `megatrip-client` và `megatrip_admin` (khoảng 60 chỗ) đã được thay thành
  `http://localhost:8080` — 2 frontend giờ gọi thẳng vào `megatrip-backend` ở trên, không còn
  phụ thuộc server online nữa.
- File `.env.local` đã tạo sẵn ở cả 2 frontend, trỏ đúng các biến `NEXT_PUBLIC_API_URL/API_BASE/API_BASE_URL/PAYMENT_BASE`.

## Muốn deploy lên internet thay vì chạy local?

Đổi các giá trị trong `.env.local` (2 frontend) và `VNPAY_RETURN_URL` / `MOMO_*` / `ZALOPAY_*`
(trong `megatrip-backend/.env`) từ `localhost` sang domain thật, rồi build:

```bash
npm run build && npm start     # cho từng project Next.js
```

## Còn thiếu để chạy thật 100%

- **Merchant key thanh toán thật** (VNPay/MoMo/ZaloPay) — cần bạn đăng ký tài khoản sandbox/production
  ở từng cổng thanh toán rồi điền vào `megatrip-backend/.env`.
- **Gemini API key** (chatbot AI) và **Amadeus key** (tìm chuyến bay) — điền vào `.env.local` của
  `megatrip-client` nếu muốn 2 tính năng này hoạt động, không thì chúng sẽ báo lỗi khi bấm vào.
- Dữ liệu (tours/buses/promotions...) hiện đang **trống** vì là database mới — vào trang admin để
  thêm dữ liệu, hoặc yêu cầu mình viết thêm script seed dữ liệu mẫu.
