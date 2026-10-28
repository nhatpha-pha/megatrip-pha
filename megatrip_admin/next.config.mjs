/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE:
      process.env.NEXT_PUBLIC_API_BASE ||
      (isProd ? 'https://megatrip-pha-backend.onrender.com' : 'http://localhost:8080'),
    NEXT_PUBLIC_CLIENT_URL:
      process.env.NEXT_PUBLIC_CLIENT_URL ||
      (isProd ? 'https://megatrip-pha-megatrip-client.vercel.app' : 'http://localhost:3000'),
  },

  // Vì có basePath '/admin', trang gốc "/" của domain admin không có nội dung (Vercel báo 404 NOT_FOUND).
  // Chuyển "/" sang trang quản trị để mở link gốc cũng vào được.
  async redirects() {
    return [{ source: '/', destination: '/admin', basePath: false, permanent: false }];
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
