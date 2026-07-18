import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendOrderShippedEmail, sendOrderDeliveredEmail, sendOrderCancelledEmail } from '@/lib/email';
import { restoreInventory } from '@/lib/inventory';
import { createNimbusReversePickup } from '@/lib/nimbuspost';
import { getRazorpay } from '@/lib/razorpay-server';

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
      select: {
        status: true, shippingName: true, total: true,
        shippingPhone: true, shippingEmail: true, shippingAddress: true, shippingCity: true,
        shippingState: true, shippingPincode: true,
        awbNumber: true, reverseAwb: true,
        paymentStatus: true, razorpayPaymentId: true, paymentMethod: true,
        user: { select: { email: true, name: true } },
        items: { select: { productId: true, size: true, quantity: true, price: true, color: true, product: { select: { name: true } } } },
      },
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
    // When cancelling a COD/unpaid order, mark payment as FAILED (no payment was collected)
    if (status === 'CANCELLED' && existing?.paymentStatus === 'PENDING') {
      updateData.paymentStatus = 'FAILED';
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    });

    // Restore inventory when admin cancels an order
    if (status === 'CANCELLED' && existing?.items?.length) {
      restoreInventory(existing.items.map(i => ({
        productId: i.productId,
        size: i.size ?? null,
        quantity: i.quantity,
      }))).catch(() => {});
    }

    // Auto-refund via Razorpay when cancelling a paid online order
    let wasRefunded = false;
    if (
      status === 'CANCELLED' &&
      existing?.paymentStatus === 'PAID' &&
      existing?.razorpayPaymentId
    ) {
      try {
        const razorpay = getRazorpay();
        if (razorpay) {
          const amountPaise = Math.round((existing.total) * 100);
          const refund = (await razorpay.payments.refund(existing.razorpayPaymentId, {
            amount: amountPaise,
            speed: 'normal',
          })) as { id: string };
          await prisma.order.update({
            where: { id: params.id },
            data: { paymentStatus: 'REFUNDED', razorpayRefundId: refund.id },
          });
          wasRefunded = true;
        }
      } catch (refundErr) {
        // Log but don't block the cancellation
        console.error('Auto-refund failed on cancellation:', refundErr);
      }
    }

    // Notify customer + admin on cancellation
    if (status === 'CANCELLED' && existing) {
      const rawEmail = existing.shippingEmail || existing.user?.email;
      const customerEmail = rawEmail && !rawEmail.endsWith('@darshan.local') ? rawEmail : undefined;
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'darshanstylehub.business@gmail.com';

      if (customerEmail) {
        sendOrderCancelledEmail({
          to: customerEmail,
          customerName: existing.shippingName,
          orderId: params.id,
          total: existing.total,
          wasRefunded,
        }).catch(() => {});
      }

      sendOrderCancelledEmail({
        to: adminEmail,
        customerName: existing.shippingName,
        orderId: params.id,
        total: existing.total,
        wasRefunded,
        isAdminCopy: true,
      }).catch(() => {});
    }

    // Send shipped email to customer
    if (status === 'SHIPPED' && existing?.user?.email) {
      sendOrderShippedEmail({
        to: existing.user.email,
        customerName: existing.shippingName || existing.user.name || 'Customer',
        orderId: params.id,
        total: existing.total,
      }).catch(() => {});
    }

    // Auto-create reverse pickup in NimbusPost when return/exchange is approved
    if (
      (status === 'RETURN_APPROVED' || status === 'EXCHANGE_APPROVED') &&
      existing?.shippingPhone &&
      !existing.reverseAwb   // don't create twice
    ) {
      createNimbusReversePickup({
        originalOrderId: params.id,
        originalAwb: existing.awbNumber,
        customerName: existing.shippingName || 'Customer',
        customerPhone: existing.shippingPhone,
        customerAddress: existing.shippingAddress || '',
        customerCity: existing.shippingCity || '',
        customerState: existing.shippingState || '',
        customerPincode: existing.shippingPincode || '',
        weightGrams: 500,
        enableQc: true,
      }).then(async (result) => {
        if (result.awbNumber || result.labelUrl) {
          await prisma.order.update({
            where: { id: params.id },
            data: {
              reverseAwb: result.awbNumber || null,
              reverseLabelUrl: result.labelUrl || null,
            },
          });
        }
      }).catch((err) => console.error('Reverse pickup creation failed:', err));
    }

    // Send delivered email to customer
    if (status === 'DELIVERED' && existing?.user?.email && !existing.user.email.endsWith('@darshan.local')) {
      sendOrderDeliveredEmail({
        to: existing.user.email,
        customerName: existing.shippingName || existing.user.name || 'Customer',
        orderId: params.id,
        total: existing.total,
        items: (existing.items || []).map(i => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.price,
          size: i.size,
          color: i.color,
        })),
      }).catch(() => {});
    }

    // Award loyalty points on delivery for ALL payment methods (1 point per ₹10 spent)
    if (status === 'DELIVERED') {
      const orderId = params.id;
      const orderWithUser = await prisma.order.findUnique({
        where: { id: orderId },
        select: { total: true, userId: true },
      });
      if (orderWithUser?.userId) {
        const pointsToEarn = Math.floor(orderWithUser.total / 10);
        if (pointsToEarn > 0) {
          (prisma as any).$transaction([
            (prisma as any).user.update({
              where: { id: orderWithUser.userId },
              data: { loyaltyPoints: { increment: pointsToEarn } },
            }),
            (prisma as any).loyaltyTransaction.create({
              data: {
                userId: orderWithUser.userId,
                points: pointsToEarn,
                type: 'EARN_ORDER',
                description: `Earned for COD order #${orderId.slice(-8).toUpperCase()} (delivered)`,
                orderId,
              },
            }),
          ]).catch((e: unknown) => console.error('Loyalty points award failed:', e));
        }
      }
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
