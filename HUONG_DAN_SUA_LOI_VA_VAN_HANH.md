# MegaTrip — Sửa lỗi đăng nhập admin + Hướng dẫn vận hành

## PHẦN A. NGUYÊN NHÂN LỖI (đã đối chiếu với repo thật của bạn)

Triệu chứng: đăng nhập admin báo **Network Error**, F12 thấy gọi `POST http://localhost:8080/api/auth/login`.

| # | Nguyên nhân | Hậu quả |
|---|---|---|
| 1 | Mỗi app có **cả `next.config.mjs` lẫn `next.config.ts`**. Next.js ưu tiên file `.mjs`, nên file `.ts` (chứa địa chỉ backend) **bị bỏ qua**. | Code lấy địa chỉ dự phòng `localhost:8080` |
| 2 | Bản sửa trước chưa được đưa vào repo (chỉ có thư mục `megatrip-complete` là bản cũ, nằm lồng trong repo — Vercel không dùng thư mục đó). Nhấn *Redeploy* chỉ build lại commit cũ. | Vercel vẫn chạy code cũ |
| 3 | Admin có `basePath: '/admin'` nên đường dẫn đúng là `/admin/admin/login` (2 chữ admin). Vào `/admin/login` sẽ 404. | Gây nhầm lẫn khi thử |
| 4 | Nhiều trang admin dùng `fetch()` không gửi token, backend lại yêu cầu đăng nhập. | Trang trống/401 sau khi đăng nhập |

## PHẦN B. CÁCH ÁP DỤNG BẢN VÁ (làm đúng thứ tự)

Giải nén file này, bên trong có: `megatrip-backend/`, `megatrip-client/`, `megatrip_admin/`, `render.yaml`.

1. **Chép đè vào repo** (thư mục `megatrip-pha` trên máy bạn), chọn *Replace*:
   - `megatrip-backend/src`, `package.json`, `.env.example`
   - `megatrip-client/src`, `next.config.mjs`, `.env.example`
   - `megatrip_admin/src`, `next.config.mjs`, `.env.example`
   - `render.yaml` (ở gốc repo)
2. **Xoá 2 file thừa** (bị `.mjs` che, dễ gây nhầm):
   - `megatrip_admin/next.config.ts`
   - `megatrip-client/next.config.ts`
3. **Xoá thư mục `megatrip-complete`** trong repo (bản cũ, không dùng đến).
4. Đẩy lên GitHub:
   ```
   git add -A
   git commit -m "Dung backend Render, sua next.config, gan token tu dong"
   git push
   ```
   > Phải thấy trên Vercel xuất hiện một deployment mới **mang đúng tên commit trên** (không phải dòng "Redeploy of ...").
5. Trên **Render** (service `megatrip-pha-backend`) → **Environment**, kiểm tra:
   - `MONGO_URI` = chuỗi MongoDB Atlas (bắt buộc)
   - `CORS_ORIGIN` = `https://megatrip-pha-megatrip-client.vercel.app,https://megatrip-pha-ra2g.vercel.app` (không có dấu `/` cuối)
   - `CLIENT_URL` = `https://megatrip-pha-megatrip-client.vercel.app`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, và các key khác nếu dùng (SMTP, Cloudinary, thanh toán)
6. **Tạo tài khoản admin + dữ liệu mẫu trên Atlas** (1 lần, chạy trên máy bạn):
   ```
   cd megatrip-backend
   copy .env.example .env      (Windows)   # rồi mở .env sửa MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD
   npm install
   npm run seed
   npm run seed:data
   ```

## PHẦN C. ĐỊA CHỈ TRUY CẬP

| Trang | Link |
|---|---|
| Website khách hàng | https://megatrip-pha-megatrip-client.vercel.app |
| **Admin (qua domain client)** | https://megatrip-pha-megatrip-client.vercel.app/admin → tự chuyển tới `/admin/admin/dashboard` |
| Admin (trực tiếp) | https://megatrip-pha-ra2g.vercel.app/admin/admin/login |
| Kiểm tra backend sống | https://megatrip-pha-backend.onrender.com/health |
| Tài liệu API (Swagger) | https://megatrip-pha-backend.onrender.com/api-docs |

> Render gói free "ngủ" sau ~15 phút không có truy cập: lần mở đầu có thể chờ 30–60 giây. Bình thường.

## PHẦN D. HỆ THỐNG HOẠT ĐỘNG NHƯ THẾ NÀO

```
Trình duyệt ──► Vercel (client)  ─┐
              (/admin/* được rewrite sang)
            ──► Vercel (admin, basePath /admin) ─┤──► Backend Render (Express) ──► MongoDB Atlas
                                                  │            └─► Cloudinary (ảnh), VNPay/MoMo/ZaloPay, Gmail SMTP
```
- **Client & Admin** là 2 ứng dụng Next.js. Cả hai gọi API tới `NEXT_PUBLIC_API_BASE` (mặc định = backend Render khi build production, `localhost:8080` khi chạy `npm run dev`).
- **Đăng nhập:** backend trả `accessToken` (JWT, hạn 7 ngày) lưu trong `localStorage`. Bộ `attachAuthFetch` tự gắn token vào mọi lời gọi API.
  Lưu ý: admin mở qua domain client dùng **chung `localStorage`** với website khách hàng, nên đăng nhập admin sẽ thay phiên đăng nhập của khách trên trình duyệt đó (và ngược lại). Nên dùng cửa sổ ẩn danh/trình duyệt khác để thử 2 vai trò cùng lúc.
- **Phân quyền:** `customer` (khách), `staff`, `admin`. Các thao tác quản trị cần `admin`/`staff`.

### Quy trình nghiệp vụ chính
1. **Admin** thêm Tour / Chuyến xe / Khuyến mãi / Tin tức (ảnh upload lên Cloudinary).
2. **Khách** đăng ký → nhận OTP qua email → xác thực → đăng nhập.
3. Khách chọn tour/xe → thanh toán (COD, VNPay, MoMo hoặc ZaloPay) → hệ thống tạo **đơn hàng** (`MT…`).
4. Với cổng thanh toán: sau khi trả tiền, người dùng được chuyển về `…/thanh-toan-thanh-cong?orderId=…`; backend cập nhật trạng thái thanh toán qua callback/IPN.
5. **Admin** xử lý đơn (xác nhận/hoàn tất/huỷ), trả lời **ticket hỗ trợ**, duyệt **đánh giá**, xem **Dashboard** doanh thu.

### Tài khoản mẫu (sau `npm run seed` và `npm run seed:data`)
- Admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` bạn đặt trong `.env` (mặc định `admin@megatrip.vn` / `Admin@123` — **hãy đổi**).
- Khách mẫu (mật khẩu `123456`): `nguyenvanan@gmail.com`, `tranthibinh@gmail.com`, `lehoangcuong@gmail.com`.
- Mã khuyến mãi mẫu: `MEGA50`, `TOUR10`, `WELCOME20`.

## PHẦN E. KIỂM TRA SAU KHI DEPLOY
1. Mở `/health` của backend → `{"status":"ok"}`.
2. Mở admin → **Ctrl+Shift+R** → F12 → tab **Network** → đăng nhập: request phải đi tới `megatrip-pha-backend.onrender.com`.
3. Vào Tours, Đơn đặt, Đánh giá, Dashboard — có dữ liệu.
4. Mở website khách → xem tour → đặt thử một đơn COD.

## PHẦN F. XỬ LÝ LỖI THƯỜNG GẶP
| Triệu chứng | Cách xử lý |
|---|---|
| Vẫn gọi `localhost:8080` | Chưa push/ build code mới. Kiểm tra tên file JS trong Console có đổi so với lần trước không; kiểm tra file `next.config.ts` đã xoá. |
| `CORS` trong Console | Sửa `CORS_ORIGIN` trên Render (xem B.5). |
| `401` khi đăng nhập | Chưa chạy `npm run seed` trên đúng database Atlas, hoặc sai `ADMIN_EMAIL/PASSWORD`. |
| `/admin/login` 404 | Dùng `/admin/admin/login` (do `basePath`). |
| Chờ rất lâu ở lần đầu | Render đang thức dậy. |
| Không nhận OTP | Chưa điền `SMTP_USER/SMTP_PASS` trên Render; khi thiếu, mã OTP chỉ in trong **Logs** của Render. |
| Upload ảnh lỗi | Chưa điền `CLOUDINARY_*` trên Render. |

## PHẦN G. VIỆC CÒN LẠI TRƯỚC KHI DÙNG THẬT
- Đổi mật khẩu admin, đặt `JWT_*` bí mật mạnh (Render tự sinh nếu dùng `render.yaml`).
- `/api/stats/*` và `/api/upload` đang công khai; có thể bật lại yêu cầu đăng nhập vì token đã được gắn tự động.
- `/api/tickets` (vé máy bay) trả rỗng vì chưa có bước tạo vé sau thanh toán.
- Key Gemini/Amadeus dùng `NEXT_PUBLIC_*` (lộ ra trình duyệt) — chỉ dùng key miễn phí/sandbox.
