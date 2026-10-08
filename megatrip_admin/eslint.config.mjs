/** @type {import('next').NextConfig} */
const nextConfig = {
  // Thêm dòng này để tất cả các tuyến đường của Admin tự động nhận tiền tố /admin
  basePath: '/admin',

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;