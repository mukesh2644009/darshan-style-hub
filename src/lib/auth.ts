import { cookies } from 'next/headers';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

// Password hashing
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Handle legacy plain text passwords (for migration)
  if (!hashedPassword.startsWith('$2')) {
    // This is a plain text password, compare directly and flag for update
    return password === hashedPassword;
  }
  return bcrypt.compare(password, hashedPassword);
}

export async function isLegacyPassword(hashedPassword: string): Promise<boolean> {
  return !hashedPassword.startsWith('$2');
}

// Get current user from session
export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      // Session expired or not found
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Check if user is authenticated
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { user };
}

// Check if user is admin
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }
  if (user.role !== 'ADMIN') {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }
  return { user };
}

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxAttempts: number = 5, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    const entries = Array.from(rateLimitStore.entries());
    for (const [key, value] of entries) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // First attempt or window expired
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remainingAttempts: maxAttempts - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remainingAttempts: maxAttempts - record.count, resetTime: record.resetTime };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

// Validate file upload
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImageUpload(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}` 
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
    };
  }

  // Check file extension matches type
  const extension = file.name.toLowerCase().split('.').pop();
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  if (!extension || !validExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: 'Invalid file extension' 
    };
  }

  return { valid: true };
}
