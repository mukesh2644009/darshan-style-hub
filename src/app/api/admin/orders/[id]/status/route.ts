import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendOrderShippedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Require admin authentication
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { status, paymentStatus } = await request.json();

    const validStatuses = [
      'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED',
      'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED',
      'EXCHANGE_REQUESTED', 'EXCHANGE_APPROVED', 'EXCHANGED',
    ];
    const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
    
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid order status' },
        { status: 400 }
      );
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      );
    }

    // Prevent modifying cancelled orders
    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      select: { status: true, shippingName: true, total: true, user: { select: { email: true, name: true } } },
    });
    if (existing?.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cancelled orders cannot be modified' },
        { status: 400 }
      );
    }

    const updateData: Record<string, string | Date> = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (status === 'SHIPPED') updateData.shippedAt = new Date();
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    });

    // Send shipped email to customer
    if (status === 'SHIPPED' && existing?.user?.email) {
      sendOrderShippedEmail({
        to: existing.user.email,
        customerName: existing.shippingName || existing.user.name || 'Customer',
        orderId: params.id,
        total: existing.total,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
