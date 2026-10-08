/** @type {import('next').NextConfig} */
const nextConfig = {
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