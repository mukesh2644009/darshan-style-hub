import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { normalizeIndianPhone } from '@/lib/otpAuth';

export const dynamic = 'force-dynamic';

function guestEmailForPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `guest.${digits}@darshan.local`;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { name, phone, addressLine1, addressLine2, city, state, pincode } = payload ?? {};

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required.' },
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

    let user = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
      orderBy: { updatedAt: 'desc' },
    });

    let isNewUser = false;
    if (!user) {
      // New user — name is required
      if (!name?.trim()) {
        return NextResponse.json(
          { success: false, error: 'new_user', newUser: true },
          { status: 200 }
        );
      }
      const generatedEmail = guestEmailForPhone(normalizedPhone);
      const randomPassword = await hashPassword(crypto.randomUUID());
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          phone: normalizedPhone,
          email: generatedEmail,
          password: randomPassword,
          role: 'CUSTOMER',
        },
      });
      isNewUser = true;
    } else if (!user.name && name?.trim()) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim() },
      });
    }

    // Save address if provided
    if (addressLine1?.trim() && city?.trim() && state?.trim() && pincode?.trim()) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
      await prisma.address.create({
        data: {
          userId: user.id,
          name: name.trim(),
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

    // Create session
    await prisma.session.deleteMany({ where: { userId: user.id } });
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({ data: { userId: user.id, token, expiresAt } });

    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    if (isNewUser) {
      try {
        const { notifyOwnerNewMember } = await import('@/lib/otpAuth');
        notifyOwnerNewMember({
          customerName: name.trim(),
          customerPhone: normalizedPhone,
          city,
          state,
          pincode,
        }).catch(() => {});
      } catch {}
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
    console.error('Guest login error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to login. Please try again.' },
      { status: 500 }
    );
  }
}
