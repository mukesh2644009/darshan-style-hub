import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const returns = await prisma.returnRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            paymentMethod: true,
            paymentStatus: true,
            razorpayPaymentId: true,
            razorpayRefundId: true,
            shippingName: true,
            shippingPhone: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, returns });
  } catch (error) {
    console.error('Admin returns list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load return requests' },
      { status: 500 }
    );
  }
}
