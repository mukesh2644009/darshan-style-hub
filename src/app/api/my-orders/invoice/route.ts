import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateOrderInvoicePDF } from '@/lib/invoice-pdf';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow the owner to download their own invoice
    if (order.userId !== authResult.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = order.shipping ?? (subtotal >= 999 ? 0 : 99);

    const pdfBuffer = await generateOrderInvoicePDF({
      orderId: order.id,
      orderDate: order.createdAt,
      customerName: order.shippingName || order.user?.name || 'Customer',
      customerEmail:
        order.user?.email && !order.user.email.endsWith('@darshan.local')
          ? order.user.email
          : undefined,
      customerPhone: order.shippingPhone || '',
      shippingAddress: [
        order.shippingAddress,
        order.shippingCity,
        order.shippingState,
        order.shippingPincode,
      ]
        .filter(Boolean)
        .join(', '),
      items: order.items.map((item) => ({
        name: item.product?.name || 'Product',
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
      })),
      subtotal,
      shipping,
      discount: order.discount ?? 0,
      total: order.total,
      paymentMethod: order.paymentMethod || 'N/A',
      paymentStatus: order.paymentStatus || 'PENDING',
    });

    const orderShort = order.id.slice(0, 8).toUpperCase();

    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="DSH-Invoice-${orderShort}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
