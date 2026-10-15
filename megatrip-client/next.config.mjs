/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Địa chỉ backend: build production (Vercel) tự dùng backend Render; chạy `npm run dev` thì dùng localhost.
  env: {
    NEXT_PUBLIC_API_BASE:
      process.env.NEXT_PUBLIC_API_BASE ||
      (isProd ? 'https://megatrip-pha-backend.onrender.com' : 'http://localhost:8080'),
  },

  // Cấu hình Rewrites ngay trong Next.js Engine của Client
  async rewrites() {
    return [
      {
        source: '/admin',
        destination: 'https://megatrip-pha-ra2g.vercel.app/admin',
      },
      {
        source: '/admin/:path*',
        destination: 'https://megatrip-pha-ra2g.vercel.app/admin/:path*',
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
