import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { name, email, phone, password } = await request.json();

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create user (in production, hash the password!)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password, // Note: In production, use bcrypt to hash passwords!
        role: 'CUSTOMER',
      },
    });

    // Create session token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Set cookie
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    });

    // Send welcome email (non-blocking, import dynamically)
    try {
      const { sendWelcomeEmail } = await import('@/lib/email');
      sendWelcomeEmail({
        to: user.email,
        customerName: user.name || 'Valued Customer',
      }).catch((err) => {
        console.error('Failed to send welcome email:', err);
      });
    } catch (emailError) {
      console.log('Email service not available, skipping welcome email');
    }

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
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register' },
      { status: 500 }
    );
  }
}

