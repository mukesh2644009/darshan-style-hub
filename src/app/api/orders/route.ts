import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// ✅ Admin only - get all orders
export async function GET() {
  try {
    // Require admin authentication to view all orders
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            // ✅ Don't include password!
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
              },
            },
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
      shippingEmail,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingPincode,
      paymentMethod = 'COD',
    } = body;

    // Require logged-in user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Please login to place an order' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!items || !items.length) {
      return NextResponse.json(
        { error: 'Order must have at least one item' },
        { status: 400 }
      );
    }

    if (!shippingName || !shippingPhone || !shippingAddress || !shippingCity || !shippingPincode) {
      return NextResponse.json(
        { error: 'Shipping details are required' },
        { status: 400 }
      );
    }

    // Validate email
    if (shippingEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(shippingEmail)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }
    }

    // Validate phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(shippingPhone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate pincode format
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(shippingPincode)) {
      return NextResponse.json(
        { error: 'Invalid pincode format' },
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

      if (!product.inStock) {
        return NextResponse.json(
          { error: `${product.name} is out of stock` },
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
    const codCharge = paymentMethod === 'COD' ? 10 : 0;
    const total = subtotal + shipping + codCharge;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod,
        subtotal,
        shipping,
        discount: 0,
        total,
        shippingName: shippingName.trim(),
        shippingPhone: shippingPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        shippingCity: shippingCity.trim(),
        shippingState: shippingState.trim(),
        shippingPincode: shippingPincode.trim(),
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

    // Send order confirmation emails
    const customerEmail = shippingEmail || user?.email;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'darshanstylehub@gmail.com';
    const fullAddress = `${shippingAddress}, ${shippingCity}, ${shippingState} - ${shippingPincode}`;
    const emailItems = orderItems.map((item, index) => ({
      name: order.items[index].product.name,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color,
    }));

    try {
      const { sendOrderConfirmationEmail } = await import('@/lib/email');
      const { sendOrderWhatsAppNotification } = await import('@/lib/whatsapp');

      // Send email to customer
      if (customerEmail) {
        sendOrderConfirmationEmail({
          to: customerEmail,
          customerName: shippingName,
          orderId: order.id,
          total: order.total,
          items: emailItems,
          shippingAddress: fullAddress,
          shippingPhone: shippingPhone,
          paymentMethod,
        }).catch((err) => {
          console.error('Failed to send customer order email:', err);
        });
      }

      // Send email to admin (owner)
      sendOrderConfirmationEmail({
        to: adminEmail,
        customerName: shippingName,
        orderId: order.id,
        total: order.total,
        items: emailItems,
        shippingAddress: fullAddress,
        shippingPhone: shippingPhone,
        shippingEmail: customerEmail || undefined,
        paymentMethod,
        isAdminCopy: true,
      }).catch((err) => {
        console.error('Failed to send admin order email:', err);
      });

      // Send WhatsApp notification to admin
      sendOrderWhatsAppNotification({
        orderId: order.id,
        customerName: shippingName,
        customerPhone: shippingPhone,
        customerEmail: customerEmail || undefined,
        items: emailItems,
        total: order.total,
        paymentMethod,
        shippingAddress: fullAddress,
      }).catch((err) => {
        console.error('Failed to send WhatsApp notification:', err);
      });
    } catch (notificationError) {
      console.log('Notification service not available');
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
