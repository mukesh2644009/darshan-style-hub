import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { sendAdminCancelNotification, sendCustomerCancelNotification } from '@/lib/email';
import { restoreInventory } from '@/lib/inventory';

export const dynamic = 'force-dynamic';

// Get single order details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user;

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // ✅ Ensure user can only see their own orders
    if (order.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// Cancel order (only if PENDING and belongs to user)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user;

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // ✅ Check ownership
    if (order.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if order can be cancelled (only before it is shipped)
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Orders can only be cancelled before they are shipped' },
        { status: 400 }
      );
    }

    // Fetch items before cancelling to restore inventory
    const orderWithItems = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: { select: { productId: true, size: true, quantity: true } } },
    });

    // Update order status to cancelled
    const cancelled = await prisma.order.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
      include: {
        items: { include: { product: { select: { name: true } } } },
        user: { select: { email: true } },
      },
    });

    // Restore inventory
    if (orderWithItems) {
      restoreInventory(orderWithItems.items.map(i => ({
        productId: i.productId,
        size: i.size ?? null,
        quantity: i.quantity,
      }))).catch(() => {});
    }

    // Notify admin (fire-and-forget)
    sendAdminCancelNotification({
      orderId: cancelled.id,
      customerName: cancelled.shippingName,
      customerPhone: cancelled.shippingPhone,
      total: cancelled.total,
      items: cancelled.items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.price })),
    }).catch(() => {});

    // Notify customer about their cancellation
    const customerEmail = cancelled.user?.email && !cancelled.user.email.endsWith('@darshan.local')
      ? cancelled.user.email
      : null;
    if (customerEmail) {
      sendCustomerCancelNotification({
        to: customerEmail,
        customerName: cancelled.shippingName,
        orderId: cancelled.id,
        total: cancelled.total,
        items: cancelled.items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.price })),
        paymentMethod: cancelled.paymentMethod,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
