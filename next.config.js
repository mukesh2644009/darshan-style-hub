/** @type {import('next').NextConfig} */

// Security headers for production
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

const nextConfig = {
  // Keep serverless traces small: `join(process.cwd(), 'public', …)` in API routes otherwise
  // pulls the entire `public/` tree (~hundreds of MB) into the function zip (Vercel 250 MB cap).
  // Static assets under `public/` are still deployed and served by the CDN; they are not removed from the site.
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
    // Wider defaults help full-bleed hero banners stay sharp on large / high-DPR screens
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  
  // Add security headers to all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  // Disable x-powered-by header
  poweredByHeader: false,
}

module.exports = nextConfig
