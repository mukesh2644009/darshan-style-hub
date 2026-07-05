import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please login to continue' }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Verify the order belongs to this user and is still pending payment
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
        paymentStatus: 'PENDING',
        paymentMethod: { contains: 'Razorpay' },
      },
      select: { id: true, total: true, shippingName: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or already paid' },
        { status: 404 }
      );
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100),
      currency: 'INR',
      receipt: `retry_${order.id.slice(-8)}`,
      notes: { userId: user.id, orderId: order.id },
    });

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order.id,
      total: order.total,
      customerName: order.shippingName,
    });
  } catch (error) {
    console.error('Razorpay retry payment error:', error);
    return NextResponse.json({ error: 'Failed to initiate payment retry' }, { status: 500 });
  }
}
