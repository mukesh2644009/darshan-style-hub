import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { createNimbusShipment } from '@/lib/nimbuspost';
import { Prisma } from '@prisma/client';

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

    const missingOrderFields: string[] = [];
    if (!order.shippingName?.trim()) missingOrderFields.push('shippingName');
    if (!order.shippingAddress?.trim()) missingOrderFields.push('shippingAddress');
    if (!order.shippingCity?.trim()) missingOrderFields.push('shippingCity');
    if (!order.shippingState?.trim()) missingOrderFields.push('shippingState');
    if (!order.shippingPincode?.trim()) missingOrderFields.push('shippingPincode');
    if (!order.shippingPhone?.trim()) missingOrderFields.push('shippingPhone');
    if (!order.total || Number(order.total) <= 0) missingOrderFields.push('total');
    if (!order.items?.length) missingOrderFields.push('items');

    if (missingOrderFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Order is missing required shipment fields: ${missingOrderFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const alreadyCreatedInNimbus =
      order.shippingPartner === 'NIMBUSPOST' &&
      Boolean(
        order.awbNumber ||
        order.shipmentId ||
        order.nimbusStatus === 'SHIPMENT_CREATED' ||
        order.nimbusStatus === 'SHIPMENT_CREATED_AWB_PENDING'
      );

    if (alreadyCreatedInNimbus) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shipment already created for this order',
          awbNumber: order.awbNumber || undefined,
          shipmentId: order.shipmentId || undefined,
          nimbusStatus: order.nimbusStatus || undefined,
        },
        { status: 409 }
      );
    }

    const paymentMode = order.paymentMethod === 'COD' ? 'COD' : 'PREPAID';
    const shortOrderRef = `DSH${order.id.slice(0, 8).toUpperCase()}`;
    const orderShipping = order.shipping ?? 99;
    const orderCodCharge = order.paymentMethod === 'COD' ? 50 : 0;
    const shipment = await createNimbusShipment({
      orderNumber: shortOrderRef,
      paymentMode,
      amount: order.total,
      shippingCharges: orderShipping,
      codCharges: orderCodCharge,
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
        nimbusStatus: shipment.awbNumber ? 'SHIPMENT_CREATED' : 'SHIPMENT_CREATED_AWB_PENDING',
        nimbusWebhookPayload: shipment.raw as Prisma.InputJsonValue,
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

    return NextResponse.json({
      success: true,
      order: updated,
      shipment: shipment.raw,
      message: shipment.awbNumber
        ? 'Shipment created successfully'
        : 'Shipment created, but AWB not returned by Nimbus yet',
      awbFound: Boolean(shipment.awbNumber),
    });
  } catch (error) {
    console.error('Nimbus create shipment error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create shipment' },
      { status: 500 }
    );
  }
}

