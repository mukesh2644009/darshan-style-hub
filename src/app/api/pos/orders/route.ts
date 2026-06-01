import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff, getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST — create a POS order
export async function POST(request: Request) {
  try {
    const authResult = await requireStaff();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const staff = authResult.user;
    const body = await request.json();

    const {
      items,           // [{ productId, productName, price, quantity, size }]
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      paymentMethod,   // CASH | UPI
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Customer name and phone are required' }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
    const total = subtotal;

    // Validate all products exist
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products not found' }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        source: 'POS',
        staffId: staff.id,
        status: 'CONFIRMED',
        paymentMethod: paymentMethod === 'UPI' ? 'UPI (POS)' : 'Cash',
        paymentStatus: 'PAID',
        subtotal,
        shipping: 0,
        discount: 0,
        total,
        shippingName: customerName,
        shippingPhone: customerPhone,
        shippingAddress: customerAddress || 'In-store purchase',
        shippingCity: 'Jaipur',
        shippingState: 'Rajasthan',
        shippingPincode: '302022',
        items: {
          create: items.map((item: { productId: string; price: number; quantity: number; size?: string }) => ({
            productId: item.productId,
            price: item.price,
            quantity: item.quantity,
            size: item.size || null,
          })),
        },
      },
      include: { items: { include: { product: { include: { images: true } } } } },
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error('POS order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// GET — fetch a single POS order for receipt
export async function GET(request: Request) {
  try {
    const authResult = await requireStaff();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { include: { images: true } } } } },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
