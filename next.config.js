/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  // Brotli/Gzip compress all text responses
  compress: true,

  experimental: {
    outputFileTracingExcludes: {
      '*': ['./public/**/*'],
    },
    serverComponentsExternalPackages: [
      '@prisma/client',
      'prisma',
      'pdfkit',
      'sharp',
      'jspdf',
      'nodemailer',
    ],
    // Optimise package imports — tree-shakes icon libraries so only used icons
    // are bundled. Reduces JS payload by ~80–120 KB for react-icons.
    optimizePackageImports: ['react-icons', 'framer-motion'],
  },

  images: {
    // AVIF = ~50% smaller than WebP; WebP = ~30% smaller than JPEG.
    // Next.js tries AVIF first (via Accept header), falls back to WebP.
    formats: ['image/avif', 'image/webp'],
    // Trimmed to actual responsive breakpoints used in sizes="" attributes.
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimised images on Vercel CDN for 30 days.
    minimumCacheTTL: 2592000,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Content-hashed JS/CSS chunks — safe to cache forever
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Next.js optimised images are already cached by Vercel CDN;
      // this adds a browser-level cache on top.
      {
        source: '/_next/image*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      // Public images: 7-day browser cache, serve stale for 1 day while revalidating
      {
        source: '/Banners/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/products/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
    ];
  },

  poweredByHeader: false,
};

module.exports = nextConfig;
