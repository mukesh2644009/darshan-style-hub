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
    // Custom loader offloads resizing/format-conversion to Cloudinary (which
    // already optimizes uploaded images) instead of Vercel's Image
    // Optimization, which has a hard monthly transformation quota on the
    // Hobby plan.
    loader: 'custom',
    loaderFile: './src/lib/cloudinaryImageLoader.ts',
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
