import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please login to continue' }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = await request.json();

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    if (orderId) {
      // Update order payment status
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'UPI (Razorpay)',
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      // Send payment confirmation emails
      try {
        const { sendPaymentConfirmationEmail } = await import('@/lib/email');
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'darshanstylehub@gmail.com';

        // Send to customer
        const customerEmail = user.email || updatedOrder.user?.email;
        if (customerEmail) {
          sendPaymentConfirmationEmail({
            to: customerEmail,
            customerName: updatedOrder.shippingName,
            orderId: orderId,
            total: updatedOrder.total,
            paymentId: razorpay_payment_id,
          }).catch((err) => {
            console.error('Failed to send customer payment confirmation:', err);
          });
        }

        // Send to admin
        sendPaymentConfirmationEmail({
          to: adminEmail,
          customerName: updatedOrder.shippingName,
          orderId: orderId,
          total: updatedOrder.total,
          paymentId: razorpay_payment_id,
          isAdminCopy: true,
        }).catch((err) => {
          console.error('Failed to send admin payment confirmation:', err);
        });
      } catch (emailError) {
        console.error('Email service not available:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Razorpay verify error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
