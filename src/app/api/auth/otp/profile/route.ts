import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeIndianPhone } from '@/lib/otpAuth';

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
