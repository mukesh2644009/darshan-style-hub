import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashPassword, checkRateLimit } from '@/lib/auth';
import { normalizeIndianPhone, notifyOwnerNewMember, verifyOtp } from '@/lib/otpAuth';

export const dynamic = 'force-dynamic';

function guestEmailForPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `guest.${digits}@darshan.local`;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { phone, otp } = payload ?? {};

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone and OTP are required.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeIndianPhone(String(phone));
    if (!normalizedPhone) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number.' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`otp-verify:${normalizedPhone}:${ip}`, 8, 30 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please request OTP again.' },
        { status: 429 }
      );
    }

    const verified = verifyOtp(normalizedPhone, String(otp).trim());
    if (!verified.ok || !verified.profile) {
      return NextResponse.json(
        { success: false, error: verified.reason || 'OTP verification failed.' },
        { status: 400 }
      );
    }

    const profile = verified.profile;

    let user = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
      orderBy: { updatedAt: 'desc' },
    });

    let isNewUser = false;
    if (!user) {
      const generatedEmail = guestEmailForPhone(normalizedPhone);
      const randomPassword = await hashPassword(crypto.randomUUID());

      user = await prisma.user.create({
        data: {
          name: profile.name,
          phone: normalizedPhone,
          email: generatedEmail,
          password: randomPassword,
          role: 'CUSTOMER',
        },
      });
      isNewUser = true;
    } else if (!user.name && profile.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: profile.name },
      });
    }

    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });

    await prisma.address.create({
      data: {
        userId: user.id,
        name: profile.name,
        phone: normalizedPhone,
        addressLine1: profile.addressLine1,
        addressLine2: profile.addressLine2 || null,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
        isDefault: true,
      },
    });

    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    if (isNewUser) {
      notifyOwnerNewMember({
        customerName: profile.name,
        customerPhone: normalizedPhone,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
      }).catch((err) => {
        console.error('Owner notification failed:', err);
      });

      try {
        const { sendNewSignupNotification } = await import('@/lib/email');
        sendNewSignupNotification({
          customerName: profile.name,
          customerEmail: user.email,
          customerPhone: normalizedPhone,
        }).catch((err) => {
          console.error('Email signup notification failed:', err);
        });
      } catch (emailError) {
        console.log('Email service unavailable for signup notification');
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP.' },
      { status: 500 }
    );
  }
}
