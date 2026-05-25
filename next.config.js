/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // ✅ เพิ่มการตั้งค่าสำหรับไฟล์ใหญ่
  serverRuntimeConfig: {
    // จะใช้ได้เฉพาะ server-side
  },
  
  // ✅ สำหรับ API routes
  api: {
    bodyParser: {
      sizeLimit: '2gb',
    },
    responseLimit: false,
  },
  
  // ✅ เพิ่ม timeout สำหรับ server
  staticPageGenerationTimeout: 600,
  
  // ✅ เพิ่ม experimental
  experimental: {
    serverComponentsExternalPackages: ['formidable'],
  },
};

module.exports = nextConfig;