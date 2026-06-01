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

    // Run everything in a transaction: create order + decrement stock atomically
    const order = await prisma.$transaction(async (tx) => {
      // Validate stock availability and decrement for each item
      for (const item of items as { productId: string; price: number; quantity: number; size?: string }[]) {
        if (item.size) {
          // Find the size record for this product
          const sizeRecord = await tx.productSize.findFirst({
            where: { productId: item.productId, size: item.size },
          });

          if (!sizeRecord) {
            throw new Error(`Size ${item.size} not found for product ${item.productId}`);
          }
          if (sizeRecord.quantity < item.quantity) {
            throw new Error(`Insufficient stock for size ${item.size}. Available: ${sizeRecord.quantity}, Requested: ${item.quantity}`);
          }

          // Decrement stock
          await tx.productSize.update({
            where: { id: sizeRecord.id },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      // Update inStock flag: if all sizes are now 0, mark product as out of stock
      const productIds = [...new Set((items as { productId: string }[]).map(i => i.productId))];
      for (const productId of productIds) {
        const sizes = await tx.productSize.findMany({ where: { productId } });
        const totalRemaining = sizes.reduce((s, sz) => s + sz.quantity, 0);
        if (totalRemaining === 0) {
          await tx.product.update({ where: { id: productId }, data: { inStock: false } });
        }
      }

      // Create the POS order record (for receipt only — filtered out of admin orders)
      return tx.order.create({
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
            create: (items as { productId: string; price: number; quantity: number; size?: string }[]).map(item => ({
              productId: item.productId,
              price: item.price,
              quantity: item.quantity,
              size: item.size || null,
            })),
          },
        },
        include: { items: { include: { product: { include: { images: true } } } } },
      });
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    console.error('POS order error:', error);
    const msg = error?.message?.includes('Insufficient stock') || error?.message?.includes('not found')
      ? error.message
      : 'Failed to create order';
    return NextResponse.json({ error: msg }, { status: 400 });
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
