import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getCurrentUser } from '@/lib/auth';
import { decrementInventory } from '@/lib/inventory';

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
      couponCode,
      couponDiscount: clientCouponDiscount,
      pointsToRedeem: clientPointsToRedeem = 0,
    } = body;

    // Guest checkout allowed — userId is optional
    const user = await getCurrentUser();

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
    const codCharge = paymentMethod === 'COD' ? 50 : 0;
    const isCod = paymentMethod === 'COD';

    // Server-side coupon validation — only DSH10 (10% off) for prepaid orders
    let discount = 0;
    if (!isCod && couponCode && String(couponCode).toUpperCase() === 'DSH10') {
      discount = Math.round(subtotal * 0.10);
      if (clientCouponDiscount && Math.abs(discount - Number(clientCouponDiscount)) > 1) {
        discount = Math.min(discount, Number(clientCouponDiscount));
      }
    }

    // Server-side loyalty points validation — 10 points = ₹1 discount
    let pointsDiscount = 0;
    let validatedPointsToRedeem = 0;
    if (user && clientPointsToRedeem > 0) {
      const dbUser = await (prisma as any).user.findUnique({
        where: { id: user.id },
        select: { loyaltyPoints: true },
      });
      const availablePoints = (dbUser as any)?.loyaltyPoints ?? 0;
      // Clamp: can't redeem more than available, more than what client sent, or ₹ more than subtotal
      const maxRedeemableByBalance = Math.floor(availablePoints / 10) * 10; // round to 10-point blocks
      const clientRequested = Math.floor(Number(clientPointsToRedeem) / 10) * 10;
      validatedPointsToRedeem = Math.min(clientRequested, maxRedeemableByBalance, availablePoints);
      pointsDiscount = Math.floor(validatedPointsToRedeem / 10); // 10 points = ₹1
      // Can't discount more than the subtotal
      pointsDiscount = Math.min(pointsDiscount, subtotal);
      validatedPointsToRedeem = pointsDiscount * 10;
    }

    const total = Math.max(0, subtotal + shipping + codCharge - discount - pointsDiscount);

    // Decrement inventory — blocks if any size is out of stock
    const inventoryError = await decrementInventory(
      orderItems.map(i => ({ productId: i.productId, size: i.size ?? null, quantity: i.quantity }))
    );
    if (inventoryError) {
      return NextResponse.json({ error: inventoryError }, { status: 400 });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: user?.id ?? null,
        status: isCod ? 'CONFIRMED' : 'PENDING',
        paymentStatus: isCod ? 'PENDING' : 'PENDING',
        paymentMethod,
        subtotal,
        shipping,
        discount: discount + pointsDiscount,
        total,
        shippingName: shippingName.trim(),
        shippingPhone: shippingPhone.trim(),
        shippingEmail: shippingEmail ? shippingEmail.toLowerCase().trim() : null,
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

    // If logged-in user has a guest email and provided a real email at checkout, save it to their profile
    if (
      user &&
      shippingEmail &&
      user.email?.endsWith('@darshan.local') &&
      !shippingEmail.endsWith('@darshan.local')
    ) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { email: shippingEmail.toLowerCase().trim() },
        });
      } catch {
        // Email might already belong to another account — skip silently
      }
    }

    // Mark any abandoned cart for this email as recovered
    if (shippingEmail) {
      (prisma as any).abandonedCart.updateMany({
        where: { email: shippingEmail.toLowerCase().trim(), status: 'PENDING' },
        data: { status: 'RECOVERED', recoveredAt: new Date() },
      }).catch(() => {});
    }

    // For COD orders: send confirmation + award loyalty points immediately (payment is on delivery).
    // For UPI/Razorpay: do NOT send emails or award points here — the order is PENDING payment.
    // All of that happens in /api/razorpay/verify after the payment is successfully confirmed.
    const customerEmail = shippingEmail || (user?.email?.endsWith('@darshan.local') ? null : user?.email);
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'darshanstylehub.business@gmail.com';
    const fullAddress = `${shippingAddress}, ${shippingCity}, ${shippingState} - ${shippingPincode}`;
    const emailItems = orderItems.map((item, index) => ({
      name: order.items[index].product.name,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color,
    }));

    let loyaltyPointsEarned = 0;

    if (isCod) {
      // Must await all notifications before returning — Vercel serverless
      // terminates the function once the response is sent.
      try {
        const { sendOrderConfirmationEmail } = await import('@/lib/email');
        const { sendOrderWhatsAppNotification } = await import('@/lib/whatsapp');

        const emailPromises: Promise<unknown>[] = [];

        if (customerEmail) {
          emailPromises.push(
            sendOrderConfirmationEmail({
              to: customerEmail,
              customerName: shippingName,
              orderId: order.id,
              total: order.total,
              subtotal: order.subtotal,
              shipping: order.shipping,
              discount: order.discount,
              items: emailItems,
              shippingAddress: fullAddress,
              shippingPhone: shippingPhone,
              paymentMethod,
              paymentStatus: 'PENDING',
              orderDate: order.createdAt,
            }).catch((err: unknown) => {
              console.error('Failed to send customer order email:', err);
            })
          );
        }

        emailPromises.push(
          sendOrderConfirmationEmail({
            to: adminEmail,
            customerName: shippingName,
            orderId: order.id,
            total: order.total,
            subtotal: order.subtotal,
            shipping: order.shipping,
            discount: order.discount,
            items: emailItems,
            shippingAddress: fullAddress,
            shippingPhone: shippingPhone,
            shippingEmail: customerEmail || undefined,
            paymentMethod,
            paymentStatus: 'PENDING',
            isAdminCopy: true,
            orderDate: order.createdAt,
          }).catch((err: unknown) => {
            console.error('Failed to send admin order email:', err);
          })
        );

        emailPromises.push(
          sendOrderWhatsAppNotification({
            orderId: order.id,
            customerName: shippingName,
            customerPhone: shippingPhone,
            customerEmail: customerEmail || undefined,
            items: emailItems,
            total: order.total,
            paymentMethod,
            shippingAddress: fullAddress,
          }).catch((err: unknown) => {
            console.error('Failed to send WhatsApp notification:', err);
          })
        );

        await Promise.allSettled(emailPromises);
      } catch (notificationError) {
        console.error('Notification service error:', notificationError);
      }

      // Deduct redeemed loyalty points (COD only — UPI deduction happens in verify endpoint)
      if (user && validatedPointsToRedeem > 0) {
        try {
          await (prisma as any).$transaction([
            (prisma as any).user.update({
              where: { id: user.id },
              data: { loyaltyPoints: { decrement: validatedPointsToRedeem } },
            }),
            (prisma as any).loyaltyTransaction.create({
              data: {
                userId: user.id,
                points: -validatedPointsToRedeem,
                type: 'REDEEM',
                description: `Redeemed for order #${order.id.slice(-8).toUpperCase()} (₹${pointsDiscount} off)`,
                orderId: order.id,
              },
            }),
          ]);
        } catch (redeemError) {
          console.error('Points deduction failed (non-critical):', redeemError);
        }
      }

      // COD loyalty points are awarded at delivery (not at order placement)
      // to ensure customer has actually paid before earning rewards.
      loyaltyPointsEarned = 0;
    }
    // UPI orders: no emails, no loyalty points — all deferred to /api/razorpay/verify

    return NextResponse.json({
      ...order,
      loyaltyPointsEarned,
      loyaltyPointsRedeemed: validatedPointsToRedeem,
      loyaltyDiscount: pointsDiscount,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
