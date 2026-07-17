import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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

    let loyaltyPointsEarned = 0;

    {
      // Update order: mark as CONFIRMED + PAID
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: 'UPI (Razorpay)',
          razorpayPaymentId: razorpay_payment_id,
        },
        include: {
          items: {
            include: { product: { select: { name: true } } },
          },
          user: {
            select: { id: true, email: true, loyaltyPoints: true },
          },
        },
      });

      const customerEmail = user?.email || updatedOrder.user?.email;
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'darshanstylehub.business@gmail.com';
      const fullAddress = `${updatedOrder.shippingAddress}, ${updatedOrder.shippingCity}, ${updatedOrder.shippingState} - ${updatedOrder.shippingPincode}`;
      const emailItems = updatedOrder.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
      }));

      // Send full order confirmation emails now that payment is confirmed
      try {
        const { sendOrderConfirmationEmail } = await import('@/lib/email');
        const { sendOrderWhatsAppNotification } = await import('@/lib/whatsapp');

        const emailPromises: Promise<unknown>[] = [];

        if (customerEmail && !customerEmail.endsWith('@darshan.local')) {
          emailPromises.push(
            sendOrderConfirmationEmail({
              to: customerEmail,
              customerName: updatedOrder.shippingName,
              orderId: orderId,
              total: updatedOrder.total,
              subtotal: updatedOrder.subtotal,
              shipping: updatedOrder.shipping,
              discount: updatedOrder.discount,
              items: emailItems,
              shippingAddress: fullAddress,
              shippingPhone: updatedOrder.shippingPhone,
              paymentMethod: 'UPI (Razorpay)',
              paymentStatus: 'PAID',
              orderDate: updatedOrder.createdAt,
            }).catch((err: unknown) => {
              console.error('Failed to send customer order confirmation:', err);
            })
          );
        }

        emailPromises.push(
          sendOrderConfirmationEmail({
            to: adminEmail,
            customerName: updatedOrder.shippingName,
            orderId: orderId,
            total: updatedOrder.total,
            subtotal: updatedOrder.subtotal,
            shipping: updatedOrder.shipping,
            discount: updatedOrder.discount,
            items: emailItems,
            shippingAddress: fullAddress,
            shippingPhone: updatedOrder.shippingPhone,
            shippingEmail: (customerEmail && !customerEmail.endsWith('@darshan.local')) ? customerEmail : undefined,
            paymentMethod: 'UPI (Razorpay)',
            paymentStatus: 'PAID',
            isAdminCopy: true,
            orderDate: updatedOrder.createdAt,
          }).catch((err: unknown) => {
            console.error('Failed to send admin order notification:', err);
          })
        );

        emailPromises.push(
          sendOrderWhatsAppNotification({
            orderId: orderId,
            customerName: updatedOrder.shippingName,
            customerPhone: updatedOrder.shippingPhone,
            customerEmail: (customerEmail && !customerEmail.endsWith('@darshan.local')) ? customerEmail : undefined,
            items: emailItems,
            total: updatedOrder.total,
            paymentMethod: 'UPI (Razorpay)',
            shippingAddress: fullAddress,
          }).catch((err: unknown) => {
            console.error('Failed to send WhatsApp notification:', err);
          })
        );

        await Promise.allSettled(emailPromises);
      } catch (emailError) {
        console.error('Email/WhatsApp service error:', emailError);
      }

      // Loyalty points for UPI orders are awarded at delivery (not at payment)
      // to ensure the order is fulfilled before rewarding the customer.
      loyaltyPointsEarned = 0;
    }

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      loyaltyPointsEarned,
    });
  } catch (error) {
    console.error('Razorpay verify error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
