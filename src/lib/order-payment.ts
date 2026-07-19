import { prisma } from '@/lib/prisma';

/**
 * Marks an order PAID/CONFIRMED and sends confirmation notifications.
 * Idempotent — safe to call from both the client-side verify route and the
 * Razorpay webhook, since either one may be the first (or only) one to fire.
 */
export async function confirmRazorpayPayment(orderId: string, paymentId: string) {
  const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existingOrder) {
    return { success: false as const, error: 'Order not found' };
  }

  if (existingOrder.paymentStatus === 'PAID') {
    return { success: true as const, alreadyPaid: true, loyaltyPointsEarned: 0 };
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI (Razorpay)',
      razorpayPaymentId: paymentId,
    },
    include: {
      items: {
        include: { product: { select: { name: true, category: true } } },
      },
      user: {
        select: { id: true, email: true, loyaltyPoints: true },
      },
    },
  });

  // Prefer the email typed at checkout — the account's own email may still be
  // a @darshan.local placeholder if it couldn't be promoted (e.g. that real
  // email already belongs to a different account).
  const rawCustomerEmail = updatedOrder.shippingEmail || updatedOrder.user?.email;
  const customerEmail = rawCustomerEmail && !rawCustomerEmail.endsWith('@darshan.local')
    ? rawCustomerEmail
    : undefined;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'darshanstylehub.business@gmail.com';
  const fullAddress = `${updatedOrder.shippingAddress}, ${updatedOrder.shippingCity}, ${updatedOrder.shippingState} - ${updatedOrder.shippingPincode}`;
  const emailItems = updatedOrder.items.map((item) => ({
    name: item.product.name,
    quantity: item.quantity,
    price: item.price,
    size: item.size,
    color: item.color,
    category: item.product.category,
  }));

  try {
    const { sendOrderConfirmationEmail } = await import('@/lib/email');
    const { sendOrderWhatsAppNotification } = await import('@/lib/whatsapp');

    const emailPromises: Promise<unknown>[] = [];

    if (customerEmail) {
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
        shippingEmail: customerEmail,
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
        customerEmail,
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
  return { success: true as const, alreadyPaid: false, loyaltyPointsEarned: 0 };
}