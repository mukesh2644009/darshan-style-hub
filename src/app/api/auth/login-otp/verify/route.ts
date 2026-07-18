import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/auth';
import { normalizeIndianPhone, verifyLoginOtp } from '@/lib/otpAuth';

export const dynamic = 'force-dynamic';

/** Verify the email OTP for phone login and create a session. */
export async function POST(request: Request) {
  try {
    const { phone, otp, addressLine1, addressLine2, city, state, pincode } = (await request.json()) ?? {};
    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone and code are required.' }, { status: 400 });
    }

    const normalizedPhone = normalizeIndianPhone(String(phone));
    if (!normalizedPhone) {
      return NextResponse.json({ success: false, error: 'Invalid phone number.' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`login-otp-verify:${normalizedPhone}:${ip}`, 8, 30 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please request the code again.' },
        { status: 429 }
      );
    }

    const verified = await verifyLoginOtp(normalizedPhone, String(otp).trim());
    if (!verified.ok) {
      return NextResponse.json({ success: false, error: verified.reason || 'Verification failed.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
      orderBy: { updatedAt: 'desc' },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 });
    }

    // Update delivery address if provided — verified, so safe to trust.
    if (addressLine1?.trim() && city?.trim() && state?.trim() && pincode?.trim()) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
      await prisma.address.create({
        data: {
          userId: user.id,
          name: user.name || 'Customer',
          phone: normalizedPhone,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2?.trim() || null,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          isDefault: true,
        },
      });
    }

    await prisma.session.deleteMany({ where: { userId: user.id } });
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.session.create({ data: { userId: user.id, token, expiresAt } });

    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (error) {
    console.error('Login OTP verify error:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify the code.' }, { status: 500 });
  }
}
