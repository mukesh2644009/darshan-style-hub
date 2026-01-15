# 🔐 Security Configuration Guide

This document outlines the security measures implemented and steps for production deployment.

## ✅ Security Features Implemented

### 1. Password Security
- **bcrypt hashing** with 12 salt rounds
- Automatic migration from legacy plain-text passwords
- Minimum 8 character password requirement

### 2. Authentication
- **Session-based authentication** with secure tokens
- **HttpOnly cookies** to prevent XSS attacks
- **Secure flag** enabled in production (HTTPS only)
- **SameSite=Lax** to prevent CSRF attacks
- Session expiry after 7 days

### 3. Rate Limiting
- **Login**: 5 attempts per 15 minutes per email/IP
- **Registration**: 5 attempts per hour per IP
- Automatic lockout with clear wait time messages

### 4. Authorization
- **Admin-only routes** protected with role checks
- Users can only access their own orders
- File uploads restricted to admins only

### 5. Input Validation
- Email format validation
- Phone number format validation (Indian: 10 digits starting with 6-9)
- Pincode validation (6 digits)
- File type and size validation (images only, max 5MB)

### 6. File Upload Security
- Allowed types: JPEG, PNG, WebP, GIF only
- Max file size: 5MB
- Secure random filenames (prevents path traversal)
- Admin authentication required

---

## 🚀 Production Deployment Checklist

### Environment Variables Required

```env
# Database (PostgreSQL recommended)
DATABASE_URL="postgresql://user:password@host:5432/darshan_stylehub"

# Email (choose one)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
# OR
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"

# Site URL
NEXT_PUBLIC_SITE_URL="https://darshanstylehub.com"

# Optional: Set to 'production' for secure cookies
NODE_ENV="production"
```

### Database Setup (PostgreSQL)

1. **Create a PostgreSQL database** (recommended: [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Railway](https://railway.app) - all have free tiers)

2. **Replace schema.prisma** with production version:
   ```bash
   cp prisma/schema.production.prisma prisma/schema.prisma
   ```

3. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

### Create Admin User

After deploying, create an admin user:

```sql
-- Run this in your PostgreSQL database
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-admin-email@example.com';
```

Or use the Prisma Studio:
```bash
npx prisma studio
```

---

## 🔒 HTTPS Configuration

**Always use HTTPS in production!** 

If deploying to Vercel, Netlify, or Railway, HTTPS is automatic.

For custom servers, use Let's Encrypt:
```bash
sudo certbot --nginx -d darshanstylehub.com
```

---

## 🛡️ Additional Security Headers

Add to `next.config.js`:

```javascript
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
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 📋 Quick Security Audit

| Check | Status |
|-------|--------|
| Passwords hashed with bcrypt | ✅ |
| Admin routes protected | ✅ |
| User data isolated | ✅ |
| Rate limiting on auth | ✅ |
| Secure cookies | ✅ |
| File upload validation | ✅ |
| Input validation | ✅ |
| HTTPS enforcement | ⚠️ Configure on hosting |
| Security headers | ⚠️ Add to next.config.js |
| PostgreSQL database | ⚠️ Switch from SQLite |

---

## 🆘 Reporting Security Issues

If you discover a security vulnerability, please contact immediately and do not disclose publicly.
