/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  api: {
    bodyParser: {
      sizeLimit: '2gb',
    },
    responseLimit: false,
  },
  
  staticPageGenerationTimeout: 600,
  
  // ❌ ลบหรือคอมเมนต์ output: 'standalone'
  // output: 'standalone',
  
  // ✅ ใช้ serverExternalPackages แทน
  serverExternalPackages: ['formidable', 'mongoose', 'mongodb'],
  
  poweredByHeader: false,
};

module.exports = nextConfig;