import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Get current user's profile including default address */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
          take: 1,
          select: {
            id: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const displayEmail = user.email?.endsWith('@darshan.local') ? '' : user.email;
    const address = user.addresses[0] ?? null;

    return NextResponse.json({ success: true, user: { ...user, email: displayEmail, addresses: undefined }, address });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load profile' }, { status: 500 });
  }
}

/** Update current user's profile and default address */
export async function PATCH(request: Request) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : null;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
    const phone = typeof body.phone === 'string' ? body.phone.trim() : null;

    // Address fields
    const addressLine1 = typeof body.addressLine1 === 'string' ? body.addressLine1.trim() : null;
    const addressLine2 = typeof body.addressLine2 === 'string' ? body.addressLine2.trim() : null;
    const city = typeof body.city === 'string' ? body.city.trim() : null;
    const state = typeof body.state === 'string' ? body.state.trim() : null;
    const pincode = typeof body.pincode === 'string' ? body.pincode.trim() : null;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email && !emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address' }, { status: 400 });
    }

    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: authResult.user.id } },
      });
      if (existing) {
        return NextResponse.json({ success: false, error: 'This email is already used by another account' }, { status: 400 });
      }
    }

    const updateData: Record<string, string> = { name };
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    const updated = await prisma.user.update({
      where: { id: authResult.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true },
    });

    // Save address if provided
    if (addressLine1 && city && state && pincode) {
      const existing = await prisma.address.findFirst({
        where: { userId: authResult.user.id },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      });

      if (existing) {
        await prisma.address.update({
          where: { id: existing.id },
          data: { addressLine1, addressLine2: addressLine2 || null, city, state, pincode, name, phone: phone || existing.phone, isDefault: true },
        });
      } else {
        await prisma.address.create({
          data: { userId: authResult.user.id, name, phone: phone || '', addressLine1, addressLine2: addressLine2 || null, city, state, pincode, isDefault: true },
        });
      }
    }

    const displayEmail = updated.email?.endsWith('@darshan.local') ? '' : updated.email;

    return NextResponse.json({ success: true, user: { ...updated, email: displayEmail } });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
