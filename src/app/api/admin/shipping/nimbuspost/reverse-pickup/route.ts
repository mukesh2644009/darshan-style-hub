import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { createNimbusReversePickup } from '@/lib/nimbuspost';
import { sendCustomerReversePickupEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const orderId     = typeof body.orderId === 'string' ? body.orderId : '';
    // Reverse QC ON by default — courier inspects the item at the customer's door
    // (right product, undamaged, properly packed) before accepting the pickup.
    const enableQc    = body.enableQc !== false;
    const weightGrams = typeof body.weightGrams === 'number' ? body.weightGrams : 500;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        shippingName: true,
        shippingPhone: true,
        shippingAddress: true,
        shippingCity: true,
        shippingState: true,
        shippingPincode: true,
        awbNumber: true,
        reverseAwb: true,
        user: { select: { email: true, name: true } },
        returnRequest: { select: { requestType: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const eligibleStatuses = ['RETURN_APPROVED', 'EXCHANGE_APPROVED', 'RETURN_REQUESTED', 'EXCHANGE_REQUESTED'];
    if (!eligibleStatuses.includes(order.status)) {
      return NextResponse.json(
        { success: false, error: `Order status "${order.status}" is not eligible for reverse pickup` },
        { status: 400 }
      );
    }

    if (order.reverseAwb) {
      return NextResponse.json(
        { success: false, error: 'Reverse pickup already created', reverseAwb: order.reverseAwb },
        { status: 409 }
      );
    }

    const result = await createNimbusReversePickup({
      originalOrderId: order.id,
      originalAwb: order.awbNumber,
      customerName: order.shippingName || 'Customer',
      customerPhone: order.shippingPhone || '',
      customerAddress: order.shippingAddress || '',
      customerCity: order.shippingCity || '',
      customerState: order.shippingState || '',
      customerPincode: order.shippingPincode || '',
      weightGrams,
      enableQc,
    });

    // Save reverse AWB to the order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        reverseAwb: result.awbNumber || null,
        reverseLabelUrl: result.labelUrl || null,
      },
    });

    // Notify the customer that a pickup has been scheduled (skip guest placeholder emails)
    const customerEmail =
      order.user?.email && !order.user.email.endsWith('@darshan.local') ? order.user.email : null;
    if (customerEmail) {
      const requestType = order.returnRequest?.requestType === 'EXCHANGE' ? 'EXCHANGE' : 'RETURN';
      sendCustomerReversePickupEmail({
        to: customerEmail,
        customerName: order.shippingName || order.user?.name || 'Customer',
        orderId: order.id,
        requestType,
        reverseAwb: result.awbNumber || null,
        courierName: result.courierName || null,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      reverseAwb: result.awbNumber,
      labelUrl: result.labelUrl,
      message: result.awbNumber
        ? `Reverse pickup created. AWB: ${result.awbNumber}`
        : 'Reverse pickup created but AWB not yet assigned by NimbusPost',
      raw: result.raw,
    });
  } catch (error) {
    console.error('Reverse pickup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create reverse pickup' },
      { status: 500 }
    );
  }
}
