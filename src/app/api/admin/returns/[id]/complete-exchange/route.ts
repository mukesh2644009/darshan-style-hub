import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendReplacementOrderEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

type ExchangeLine = {
  orderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  originalSize: string | null;
  originalColor: string | null;
  targetSize: string | null;
  targetColor: string | null;
  sizes: { id: string; size: string; quantity: number }[];
};

/**
 * Admin marks an APPROVED exchange request as completed:
 * 1. Original order → EXCHANGED, ReturnRequest → COMPLETED.
 * 2. Inventory of the returned size is incremented (best-effort) for each exchanged item.
 * 3. Inventory of the requested replacement size is decremented (if available) per item;
 *    blocked if any requested size is out of stock.
 * 4. A new ₹0 REPLACEMENT order is created containing only the item(s) linked to this
 *    request, each with its own resolved size / colour.
 *    - paymentMethod = "EXCHANGE", paymentStatus = "PAID", status = "CONFIRMED"
 *    - parentOrderId points to the original.
 * 5. Customer is emailed: "Your replacement order is on its way".
 *
 * Requests submitted before per-item selection existed have no linked
 * ReturnRequestItem rows — those fall back to the original single-item,
 * order-wide exchangeSize/exchangeColor behaviour.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
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
        items: {
          include: {
            orderItem: {
              include: {
                product: {
                  select: { id: true, name: true, sizes: true },
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

    // Resolve the item(s) being exchanged. Prefer the linked ReturnRequestItem rows;
    // fall back to the legacy single-item, order-wide behaviour for older requests.
    const exchangeLines: ExchangeLine[] =
      ret.items.length > 0
        ? ret.items.map((ri) => ({
            orderItemId: ri.orderItemId,
            productId: ri.orderItem.productId,
            productName: ri.orderItem.product.name,
            quantity: ri.orderItem.quantity,
            originalSize: ri.orderItem.size,
            originalColor: ri.orderItem.color,
            targetSize: (ri.exchangeSize && ri.exchangeSize.trim()) || ri.orderItem.size || null,
            targetColor: (ri.exchangeColor && ri.exchangeColor.trim()) || ri.orderItem.color || null,
            sizes: ri.orderItem.product.sizes,
          }))
        : (() => {
            const firstItem = order.items[0];
            if (!firstItem) return [];
            const targetSize = (ret.exchangeSize && ret.exchangeSize.trim()) || firstItem.size || null;
            const targetColor = (ret.exchangeColor && ret.exchangeColor.trim()) || firstItem.color || null;
            return [
              {
                orderItemId: firstItem.id,
                productId: firstItem.productId,
                productName: firstItem.product.name,
                quantity: firstItem.quantity,
                originalSize: firstItem.size,
                originalColor: firstItem.color,
                targetSize,
                targetColor,
                sizes: firstItem.product.sizes,
              },
            ];
          })();

    if (exchangeLines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items found on this order to exchange' },
        { status: 400 }
      );
    }

    // Stock check for each item's requested replacement size.
    for (const line of exchangeLines) {
      if (line.targetSize) {
        const sizeRow = line.sizes.find((s) => s.size === line.targetSize);
        if (sizeRow && sizeRow.quantity <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: `Requested size "${line.targetSize}" for "${line.productName}" is currently out of stock. Contact the customer on WhatsApp to choose another size or hold the exchange.`,
            },
            { status: 400 }
          );
        }
      }
    }

    const replacement = await prisma.$transaction(async (tx) => {
      // 1. Mark original order EXCHANGED
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'EXCHANGED' },
      });

      // 2. Inventory adjustments — best-effort, never blocks the transaction.
      // Only the item(s) actually linked to this exchange are touched.
      for (const line of exchangeLines) {
        if (line.originalSize) {
          const original = await tx.productSize.findFirst({
            where: { productId: line.productId, size: line.originalSize },
          });
          if (original) {
            await tx.productSize.update({
              where: { id: original.id },
              data: { quantity: { increment: line.quantity } },
            });
          }
        }

        if (line.targetSize) {
          const replSize = await tx.productSize.findFirst({
            where: { productId: line.productId, size: line.targetSize },
          });
          if (replSize && replSize.quantity > 0) {
            await tx.productSize.update({
              where: { id: replSize.id },
              data: { quantity: { decrement: 1 } },
            });
          }
        }
      }

      // 3. Create the ₹0 replacement order — only the exchanged item(s)
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
            create: exchangeLines.map((line) => ({
              productId: line.productId,
              quantity:  line.quantity,
              price:     0,
              size:      line.targetSize,
              color:     line.targetColor,
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
    const summaryLine = exchangeLines[0];
    if (customerEmail) {
      sendReplacementOrderEmail({
        to: customerEmail,
        customerName,
        originalOrderId: order.id,
        replacementOrderId: replacement.id,
        productName: summaryLine?.productName || 'your item',
        size:  summaryLine?.targetSize  || undefined,
        color: summaryLine?.targetColor || undefined,
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
