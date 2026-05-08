import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Returns the shipping details from the user's most recent order for checkout pre-fill. */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user;

    const lastOrder = await prisma.order.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        shippingName: true,
        shippingPhone: true,
        shippingAddress: true,
        shippingCity: true,
        shippingState: true,
        shippingPincode: true,
      },
    });

    if (!lastOrder) {
      return NextResponse.json({ success: true, address: null });
    }

    return NextResponse.json({ success: true, address: lastOrder });
  } catch (error) {
    console.error('Error fetching last address:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch address' },
      { status: 500 }
    );
  }
}
