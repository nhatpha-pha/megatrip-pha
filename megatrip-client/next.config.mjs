/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      // 1. Chuyển hướng khi người dùng gõ ngắn gọn /admin -> tự động sang /admin/login
      {
        source: '/admin',
        destination: 'https://megatrip-pha-ra2g.vercel.app/admin/login',
      },
      // 2. Chuyển hướng toàn bộ các route con /admin/* sang project Admin
      {
        source: '/admin/:path*',
        destination: 'https://megatrip-pha-ra2g.vercel.app/admin/:path*',
      },
    ];
  },
};

export default nextConfig;