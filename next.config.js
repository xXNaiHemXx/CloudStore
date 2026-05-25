// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // ✅ เพิ่มการตั้งค่า bodyParser size limit
  experimental: {
    serverComponentsExternalPackages: ['formidable'],
  },
  
  // ✅ สำหรับ API routes
  api: {
    bodyParser: {
      sizeLimit: '2gb',
    },
    responseLimit: false,
  },
};

module.exports = nextConfig;