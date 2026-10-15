/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Bắt buộc phải có basePath để khi gọi https://megatrip-pha-ra2g.vercel.app/admin không bị 404 ở phía Admin
  basePath: '/admin',

  // Địa chỉ backend: build production (Vercel) tự dùng backend Render; chạy `npm run dev` thì dùng localhost.
  // Muốn đổi, đặt biến môi trường NEXT_PUBLIC_API_BASE trên Vercel.
  env: {
    NEXT_PUBLIC_API_BASE:
      process.env.NEXT_PUBLIC_API_BASE ||
      (isProd ? 'https://megatrip-pha-backend.onrender.com' : 'http://localhost:8080'),
    NEXT_PUBLIC_CLIENT_URL:
      process.env.NEXT_PUBLIC_CLIENT_URL ||
      (isProd ? 'https://megatrip-pha-megatrip-client.vercel.app' : 'http://localhost:3000'),
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
