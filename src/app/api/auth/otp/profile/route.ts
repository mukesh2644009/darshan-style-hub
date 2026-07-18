import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeIndianPhone, maskEmail } from '@/lib/otpAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneParam = searchParams.get('phone');

    if (!phoneParam) {
      return NextResponse.json({ success: false, error: 'Phone is required.' }, { status: 400 });
    }

    const normalizedPhone = normalizeIndianPhone(phoneParam);
    if (!normalizedPhone) {
      return NextResponse.json({ success: false, error: 'Invalid phone number.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
      orderBy: { updatedAt: 'desc' },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: true, exists: false });
    }

    // Security: a phone number alone doesn't prove identity. Only auto-fill
    // saved details for accounts that have no real email on file (nothing of
    // real value to protect there). For accounts with a real email, don't
    // leak their name/address to whoever typed the phone number — tell the
    // client verification is required instead.
    const hasRealEmail = user.email && !user.email.endsWith('@darshan.local');
    if (hasRealEmail) {
      return NextResponse.json({
        success: true,
        exists: true,
        requiresVerification: true,
        maskedEmail: maskEmail(user.email as string),
      });
    }

    const address = user.addresses[0] || null;
    return NextResponse.json({
      success: true,
      exists: true,
      profile: {
        name: user.name || '',
        phone: normalizedPhone,
        addressLine1: address?.addressLine1 || '',
        addressLine2: address?.addressLine2 || '',
        city: address?.city || '',
        state: address?.state || '',
        pincode: address?.pincode || '',
      },
    });
  } catch (error) {
    console.error('OTP profile lookup error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch profile.' }, { status: 500 });
  }
}
