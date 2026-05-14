import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = cookies().get('auth_token')?.value;

    if (!token) {
      const response = NextResponse.json({ success: false, user: null });
      // Prevent caching
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    // Find session
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      // Session expired or not found - clear the cookie
      const response = NextResponse.json({ success: false, user: null });
      response.cookies.set('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        path: '/',
        maxAge: 0,
      });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      const response = NextResponse.json({ success: false, user: null });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    }

    // Sliding-window session extension:
    //   Admin   → extend by 8 hours on every active request
    //   Customer → extend by 30 days only when < 15 days remain (saves unnecessary writes)
    const adminMs   = 8  * 60 * 60 * 1000;
    const customerMs = 30 * 24 * 60 * 60 * 1000;
    const isAdmin = user.role === 'ADMIN';
    const now = Date.now();
    const timeLeft = session.expiresAt.getTime() - now;
    const shouldExtend = isAdmin
      ? true                                  // always slide for admins
      : timeLeft < 15 * 24 * 60 * 60 * 1000; // only refresh when < 15 days left for customers

    if (shouldExtend) {
      const newExpiry = new Date(now + (isAdmin ? adminMs : customerMs));
      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: newExpiry },
      }).catch(() => {}); // non-critical — don't break the auth check if DB write fails
    }

    const response = NextResponse.json({ success: true, user });
    // Prevent caching of auth status
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('Auth check error:', error);
    const response = NextResponse.json({ success: false, user: null });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }
}
