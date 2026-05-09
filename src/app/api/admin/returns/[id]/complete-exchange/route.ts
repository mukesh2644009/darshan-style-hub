import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendReplacementOrderEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Admin marks an APPROVED exchange request as completed:
 * 1. Original order → EXCHANGED, ReturnRequest → COMPLETED.
 * 2. Inventory of the returned size is incremented (best-effort).
 * 3. Inventory of the requested replacement size is decremented (if available); blocked if out of stock.
 * 4. A new ₹0 REPLACEMENT order is created with the customer's preferred size / colour.
 *    - paymentMethod = "EXCHANGE", paymentStatus = "PAID", status = "CONFIRMED"
 *    - Items copy productId, quantity from the original order, with the new size / colour, price = 0.
 *    - parentOrderId points to the original.
 * 5. Customer is emailed: "Your replacement order is on its way".
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const ret = await prisma.returnRequest.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { email: true, name: true } },
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sizes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ret) {
      return NextResponse.json(
        { success: false, error: 'Return request not found' },
        { status: 404 }
      );
    }

    if (ret.requestType !== 'EXCHANGE') {
      return NextResponse.json(
        { success: false, error: 'This action is only for exchange requests' },
        { status: 400 }
      );
    }

    if (ret.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Approve the exchange first, then mark it complete.' },
        { status: 400 }
      );
    }

    if (ret.replacementOrderId) {
      return NextResponse.json(
        { success: false, error: 'A replacement order already exists for this exchange' },
        { status: 400 }
      );
    }

    const order = ret.order;
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Original order missing' },
        { status: 400 }
      );
    }

    // Resolve the desired replacement size / colour: prefer values stored on the request,
    // otherwise fall back to the original item attributes (so we still produce an order).
    const firstItem = order.items[0];
    const targetSize  = (ret.exchangeSize  && ret.exchangeSize.trim())  || firstItem?.size  || null;
    const targetColor = (ret.exchangeColor && ret.exchangeColor.trim()) || firstItem?.color || null;

    // Stock check for replacement size on the first item's product (best-effort, single-product orders).
    if (firstItem && targetSize) {
      const sizeRow = firstItem.product.sizes.find((s) => s.size === targetSize);
      if (sizeRow && sizeRow.quantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Requested size "${targetSize}" is currently out of stock. Contact the customer on WhatsApp to choose another size or hold the exchange.`,
          },
          { status: 400 }
        );
      }
    }

    const replacement = await prisma.$transaction(async (tx) => {
      // 1. Mark original order EXCHANGED
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'EXCHANGED' },
      });

      // 2. Inventory adjustments — best-effort, never blocks the transaction
      for (const item of order.items) {
        // Return original size back to stock
        if (item.size) {
          const original = await tx.productSize.findFirst({
            where: { productId: item.productId, size: item.size },
          });
          if (original) {
            await tx.productSize.update({
              where: { id: original.id },
              data: { quantity: { increment: item.quantity } },
            });
          }
        }
      }

      // Decrement replacement size for the first item only (single SKU exchange)
      if (firstItem && targetSize) {
        const replSize = await tx.productSize.findFirst({
          where: { productId: firstItem.productId, size: targetSize },
        });
        if (replSize && replSize.quantity > 0) {
          await tx.productSize.update({
            where: { id: replSize.id },
            data: { quantity: { decrement: 1 } },
          });
        }
      }

      // 3. Create the ₹0 replacement order
      const newOrder = await tx.order.create({
        data: {
          userId: order.userId,
          status: 'CONFIRMED',
          paymentMethod: 'EXCHANGE',
          paymentStatus: 'PAID',
          subtotal: 0,
          shipping: 0,
          discount: 0,
          total: 0,
          orderType: 'REPLACEMENT',
          parentOrderId: order.id,
          shippingName:    order.shippingName,
          shippingPhone:   order.shippingPhone,
          shippingAddress: order.shippingAddress,
          shippingCity:    order.shippingCity,
          shippingState:   order.shippingState,
          shippingPincode: order.shippingPincode,
          items: {
            create: order.items.map((item, idx) => ({
              productId: item.productId,
              quantity:  item.quantity,
              price:     0,
              size:      idx === 0 ? targetSize  : item.size,
              color:     idx === 0 ? targetColor : item.color,
            })),
          },
        },
        include: { items: true },
      });

      // 4. Close the return request and link the replacement
      await tx.returnRequest.update({
        where: { id: ret.id },
        data: {
          status: 'COMPLETED',
          replacementOrderId: newOrder.id,
        },
      });

      return newOrder;
    });

    // 5. Notify the customer (fire-and-forget)
    const customerEmail = ret.user?.email;
    const customerName  = order.shippingName || ret.user?.name || 'Customer';
    if (customerEmail) {
      sendReplacementOrderEmail({
        to: customerEmail,
        customerName,
        originalOrderId: order.id,
        replacementOrderId: replacement.id,
        productName: firstItem?.product.name || 'your item',
        size:  targetSize  || undefined,
        color: targetColor || undefined,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      replacementOrderId: replacement.id,
      message: 'Exchange completed and replacement order created',
    });
  } catch (error) {
    console.error('Complete-exchange error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to complete exchange';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
