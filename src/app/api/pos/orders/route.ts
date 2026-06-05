import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST — create a POS order and decrement stock
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

    const typedItems = items as { productId: string; productName?: string; price: number; quantity: number; size?: string }[];

    // Pre-fetch all size records needed (outside transaction for speed)
    const sizeRecords: Record<string, { id: string; quantity: number }> = {};
    for (const item of typedItems) {
      if (item.size) {
        const sz = await prisma.productSize.findFirst({
          where: { productId: item.productId, size: item.size },
          select: { id: true, quantity: true },
        });
        if (!sz) return NextResponse.json({ error: `Size "${item.size}" not found for a product` }, { status: 400 });
        if (sz.quantity < item.quantity) return NextResponse.json({ error: `Not enough stock for size ${item.size}. Only ${sz.quantity} left.` }, { status: 400 });
        sizeRecords[`${item.productId}-${item.size}`] = sz;
      }
    }

    // Decrement stock for each size (batch, no transaction needed — pre-validated above)
    await Promise.all(
      typedItems
        .filter(item => item.size && sizeRecords[`${item.productId}-${item.size}`])
        .map(item =>
          prisma.productSize.update({
            where: { id: sizeRecords[`${item.productId}-${item.size!}`].id },
            data: { quantity: { decrement: item.quantity } },
          })
        )
    );

    // Mark products as out of stock if all sizes hit 0
    const uniqueProductIds = Array.from(new Set(typedItems.map(i => i.productId)));
    await Promise.all(
      uniqueProductIds.map(async (productId) => {
        const sizes = await prisma.productSize.findMany({ where: { productId }, select: { quantity: true } });
        if (sizes.every(s => s.quantity <= 0)) {
          await prisma.product.update({ where: { id: productId }, data: { inStock: false } });
        }
      })
    );

    // Create the POS order record (for receipt — filtered out of admin orders list)
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
        shippingPincode: '302017',
        items: {
          create: typedItems.map(item => ({
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
  } catch (error: any) {
    console.error('POS order error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create bill' }, { status: 500 });
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
