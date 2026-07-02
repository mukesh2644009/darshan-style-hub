import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { createNimbusReversePickup } from '@/lib/nimbuspost';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const orderId     = typeof body.orderId === 'string' ? body.orderId : '';
    const enableQc    = body.enableQc === true;
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
