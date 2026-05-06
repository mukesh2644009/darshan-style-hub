import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/auth';
import { createOtpCode, normalizeIndianPhone, saveOtp, sendOtpCode } from '@/lib/otpAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { name, phone, pincode, addressLine1, addressLine2, city, state } = payload ?? {};

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone is required.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeIndianPhone(String(phone));
    if (!normalizedPhone) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid Indian mobile number.' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`otp-request:${normalizedPhone}:${ip}`, 5, 30 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please try again in some time.' },
        { status: 429 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
      orderBy: { updatedAt: 'desc' },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });

    const fallbackAddress = existingUser?.addresses?.[0];
    const resolvedName = String(name || existingUser?.name || '').trim();
    const resolvedAddressLine1 = String(addressLine1 || fallbackAddress?.addressLine1 || '').trim();
    const resolvedCity = String(city || fallbackAddress?.city || '').trim();
    const resolvedState = String(state || fallbackAddress?.state || '').trim();
    const resolvedPincode = String(pincode || fallbackAddress?.pincode || '').trim();
    const resolvedAddressLine2 = String(addressLine2 || fallbackAddress?.addressLine2 || '').trim();

    if (!resolvedName || !resolvedAddressLine1 || !resolvedCity || !resolvedState || !resolvedPincode) {
      return NextResponse.json(
        { success: false, error: 'Please provide name and complete delivery details.' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(resolvedPincode)) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid 6-digit pincode.' },
        { status: 400 }
      );
    }

    const otp = createOtpCode();
    saveOtp(normalizedPhone, otp, {
      name: resolvedName,
      phone: normalizedPhone,
      pincode: resolvedPincode,
      addressLine1: resolvedAddressLine1,
      addressLine2: resolvedAddressLine2,
      city: resolvedCity,
      state: resolvedState,
    });

    const delivery = await sendOtpCode(normalizedPhone, otp);
    if (!delivery.sent) {
      return NextResponse.json(
        { success: false, error: 'Unable to send OTP right now. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your mobile number.',
      channel: delivery.channel,
      devOtp: delivery.debugMessage,
    });
  } catch (error) {
    console.error('OTP request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP.' },
      { status: 500 }
    );
  }
}
