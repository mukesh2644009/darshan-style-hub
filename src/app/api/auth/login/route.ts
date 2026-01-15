import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyPassword, isLegacyPassword, hashPassword, checkRateLimit, resetRateLimit } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Rate limiting by email and IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const identifier = `login:${email?.toLowerCase()}:${ip}`;
    const rateLimit = checkRateLimit(identifier, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes
    
    if (!rateLimit.allowed) {
      const waitMinutes = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
      return NextResponse.json(
        { success: false, error: `Too many login attempts. Please try again in ${waitMinutes} minutes.` },
        { status: 429 }
      );
    }

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password (handles both hashed and legacy plain text)
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // If this was a legacy plain text password, upgrade to hashed
    if (await isLegacyPassword(user.password)) {
      const hashedPassword = await hashPassword(password);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      console.log(`Upgraded password hash for user: ${user.email}`);
    }

    // Reset rate limit on successful login
    resetRateLimit(identifier);

    // Delete old sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Create new session token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Set secure cookie
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to login' },
      { status: 500 }
    );
  }
}
