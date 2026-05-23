/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization for external URLs (Cloudinary, Discord, etc.)
  images: {
    unoptimized: true, // Allow all external image hosts without config
  },
  // Performance: enable React strict mode
  reactStrictMode: true,
  // Bundle optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  // Let Next.js handle the body parser (enabled by default, disabled per-route)
  // Disable x-powered-by header for security
  poweredByHeader: false,
  // Next.js 15 built-in turbopack is default, no special config needed
};

module.exports = nextConfig;
