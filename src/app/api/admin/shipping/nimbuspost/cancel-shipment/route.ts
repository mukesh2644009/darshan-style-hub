import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { cancelNimbusShipment } from '@/lib/nimbuspost';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const orderId = typeof body.orderId === 'string' ? body.orderId : '';
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, shipmentId: true, awbNumber: true, shippingPartner: true, status: true, nimbusStatus: true },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Try to cancel in Nimbus if we have an AWB or shipment reference
    const cancelRef = order.awbNumber || order.shipmentId;
    if (order.shippingPartner === 'NIMBUSPOST' && cancelRef) {
      try {
        await cancelNimbusShipment(cancelRef);
      } catch (nimbusError) {
        // Log but don't block local status update
        console.warn('Nimbus cancel API warning:', nimbusError instanceof Error ? nimbusError.message : nimbusError);
      }
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: order.status === 'DELIVERED' ? order.status : 'CANCELLED',
        nimbusStatus: 'CANCELLED',
      },
      select: { id: true, status: true, nimbusStatus: true },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Nimbus cancel shipment error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to cancel shipment' },
      { status: 500 }
    );
  }
}

