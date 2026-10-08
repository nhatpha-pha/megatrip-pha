/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bắt buộc phải có basePath để khi gọi https://megatrip-pha-ra2g.vercel.app/admin không bị 404 ở phía Admin
  basePath: '/admin',

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;