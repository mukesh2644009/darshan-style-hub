import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/auth';
import { createOtpCode, normalizeIndianPhone, saveLoginOtp, maskEmail } from '@/lib/otpAuth';
import { sendLoginOtpEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Returning-user login via phone: sends a verification OTP to the account's
 * registered email (free), instead of paid SMS.
 *
 * Responses:
 *  - { success: true, maskedEmail }            → OTP emailed, proceed to verify
 *  - { success: false, error: 'no_account' }   → phone not registered
 *  - { success: false, error: 'no_email' }     → account has no real email on file
 */
export async function POST(request: Request) {
  try {
    const { phone } = (await request.json()) ?? {};
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required.' }, { status: 400 });
    }

    const normalizedPhone = normalizeIndianPhone(String(phone));
    if (!normalizedPhone) {
      return NextResponse.json({ success: false, error: 'Enter a valid Indian mobile number.' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`login-otp-request:${normalizedPhone}:${ip}`, 5, 30 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please try again in some time.' },
        { status: 429 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
      orderBy: { updatedAt: 'desc' },
      select: { email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'no_account' }, { status: 200 });
    }

    const hasRealEmail = user.email && !user.email.endsWith('@darshan.local');
    if (!hasRealEmail) {
      return NextResponse.json({ success: false, error: 'no_email' }, { status: 200 });
    }

    const otp = createOtpCode();
    await saveLoginOtp(normalizedPhone, otp);

    const delivery = await sendLoginOtpEmail({ to: user.email, customerName: user.name, otp });
    if (!delivery.success) {
      return NextResponse.json(
        { success: false, error: 'Unable to send the code right now. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      maskedEmail: maskEmail(user.email),
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error) {
    console.error('Login OTP request error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send the code.' }, { status: 500 });
  }
}
