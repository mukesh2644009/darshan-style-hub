import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { createNimbusShipment } from '@/lib/nimbuspost';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const orderId = typeof body.orderId === 'string' ? body.orderId : '';
    const deadWeightGrams = typeof body.deadWeightGrams === 'number' ? body.deadWeightGrams : 500;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.shippingPartner === 'NIMBUSPOST' && order.awbNumber) {
      return NextResponse.json(
        { success: false, error: 'Shipment already created', awbNumber: order.awbNumber },
        { status: 409 }
      );
    }

    const paymentMode = order.paymentMethod === 'COD' ? 'COD' : 'PREPAID';
    const shipment = await createNimbusShipment({
      orderNumber: order.id,
      paymentMode,
      amount: order.total,
      customerName: order.shippingName,
      customerPhone: order.shippingPhone,
      customerEmail:
        order.user?.email && !order.user.email.endsWith('@darshan.local') ? order.user.email : undefined,
      address: order.shippingAddress,
      city: order.shippingCity,
      state: order.shippingState,
      pincode: order.shippingPincode,
      deadWeightGrams,
      items: order.items.map((item) => ({
        name: item.product?.name || 'Product',
        quantity: item.quantity,
        price: item.price,
        sku: item.product?.sku,
      })),
    });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        shippingPartner: 'NIMBUSPOST',
        shipmentId: shipment.shipmentId || undefined,
        awbNumber: shipment.awbNumber || undefined,
        courierName: shipment.courierName || undefined,
        trackingUrl: shipment.trackingUrl || undefined,
        labelUrl: shipment.labelUrl || undefined,
        status: order.status === 'CONFIRMED' ? 'SHIPPED' : order.status,
        shippedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        shippingPartner: true,
        shipmentId: true,
        awbNumber: true,
        courierName: true,
        trackingUrl: true,
        labelUrl: true,
      },
    });

    return NextResponse.json({ success: true, order: updated, shipment: shipment.raw });
  } catch (error) {
    console.error('Nimbus create shipment error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create shipment' },
      { status: 500 }
    );
  }
}

