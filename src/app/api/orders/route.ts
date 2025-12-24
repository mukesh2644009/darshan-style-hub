import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      items,
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingPincode,
      paymentMethod = 'COD',
      userId,
    } = body;

    // Validate required fields
    if (!items || !items.length) {
      return NextResponse.json(
        { error: 'Order must have at least one item' },
        { status: 400 }
      );
    }

    if (!shippingName || !shippingPhone || !shippingAddress || !shippingCity || !shippingState || !shippingPincode) {
      return NextResponse.json(
        { error: 'Shipping details are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        );
      }

      subtotal += product.price * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        size: item.size || null,
        color: item.color || null,
      });
    }

    const shipping = subtotal >= 999 ? 0 : 99;
    const total = subtotal + shipping;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: userId || null,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod,
        subtotal,
        shipping,
        discount: 0,
        total,
        shippingName,
        shippingPhone,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPincode,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

