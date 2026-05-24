/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // ✅ เพิ่มขนาด body parser
  api: {
    bodyParser: {
      sizeLimit: '500mb', // ✅ 500MB
    },
    responseLimit: false, // ✅ ไม่จำกัด response
  },
  
  // ✅ หรือใช้แบบนี้ (Next.js 13+)
  experimental: {
    // ...
  },
};

module.exports = nextConfig;