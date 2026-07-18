import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { confirmRazorpayPayment } from '@/lib/order-payment';

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Guest checkout is allowed — payment is tied to the order, not a login session.
    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If the order was placed while logged in, only that account may confirm payment for it.
    const user = await getCurrentUser();
    if (existingOrder.userId && existingOrder.userId !== user?.id) {
      return NextResponse.json({ error: 'Not authorized for this order' }, { status: 403 });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Payment confirmation is shared with the Razorpay webhook (api/webhooks/razorpay)
    // and is idempotent — whichever of the two fires first wins, the other is a no-op.
    const result = await confirmRazorpayPayment(orderId, razorpay_payment_id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      loyaltyPointsEarned: result.loyaltyPointsEarned,
    });
  } catch (error) {
    console.error('Razorpay verify error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
