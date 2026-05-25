/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // ✅ เพิ่มการตั้งค่าสำหรับไฟล์ใหญ่
  api: {
    bodyParser: {
      sizeLimit: '2gb',  // 2GB
    },
    responseLimit: false,
  },
  
  // ✅ เพิ่ม timeout สำหรับ server
  staticPageGenerationTimeout: 600,
  
  // ✅ เพิ่ม experimental
  experimental: {
    serverComponentsExternalPackages: ['formidable'],
  },
  
  // ✅ เพิ่ม poweredByHeader: false (optional)
  poweredByHeader: false,
};

module.exports = nextConfig;