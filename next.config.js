/** @type {import('next').NextConfig} */

// Security headers for production
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
  // Gzip/Brotli compress all responses
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
  },

  images: {
    // Serve AVIF first (50% smaller than WebP), fallback to WebP — huge LCP win
    formats: ['image/avif', 'image/webp'],
    // Trimmed to actual breakpoints — avoids generating unnecessary sizes
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimised images for 30 days on Vercel CDN
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
      // Next.js JS/CSS chunks are content-hashed — cache forever
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Public images: cache 7 days, serve stale for 1 day while revalidating
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
}

module.exports = nextConfig
