/** @type {import('next').NextConfig} */

// Security headers ทุกหน้า
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" }, // กัน clickjacking (เอาเว็บไปซ้อนใน iframe)
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
];

const nextConfig = {
  reactStrictMode: true,
  
  api: {
    bodyParser: {
      sizeLimit: '2gb',
    },
    responseLimit: false,
  },
  
  staticPageGenerationTimeout: 600,
  
  serverExternalPackages: ['formidable', 'mongoose', 'mongodb'],
  
  poweredByHeader: false,

  // ตัวย่อรูปสินค้า (ดู utils/imageUrl.js) อนุญาตเฉพาะโดเมนไฟล์ของร้าน
  images: {
    remotePatterns: [{ protocol: "https", hostname: "files.xcloud-studio.store", pathname: "/**" }],
    formats: ["image/webp"],
    minimumCacheTTL: 86400,
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/adminsudlor",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // ไฟล์ที่ผู้ใช้/แอดมินอัปโหลด ห้ามรันสคริปต์ใดๆ แม้จะเป็นไฟล์ html หลุดเข้ามา
        source: "/(uploads|slip)/:path*",
        headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" }],
      },
    ];
  },
};

module.exports = nextConfig;
