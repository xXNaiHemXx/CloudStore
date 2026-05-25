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
  
  // ✅ ให้ Next.js serve static files
  output: 'standalone',
  
  experimental: {
    serverComponentsExternalPackages: ['formidable'],
  },
  
  poweredByHeader: false,
};

module.exports = nextConfig;