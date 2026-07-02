import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { sendOrderDeliveredEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function getNestedString(
  payload: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const parts = key.split('.');
    let current: unknown = payload;
    for (const part of parts) {
      if (!current || typeof current !== 'object') {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[part];
    }
    if (typeof current === 'string' && current.trim()) {
      return current;
    }
  }
  return undefined;
}

function mapNimbusToOrderStatus(statusRaw?: string): string | null {
  if (!statusRaw) return null;
  const status = statusRaw.toUpperCase();

  if (
    ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'SHIPMENT_CREATED', 'BOOKED'].includes(status) ||
    status.includes('NDR') ||
    status.includes('UNDELIVERED')
  ) {
    return 'SHIPPED';
  }

  if (status === 'DELIVERED') return 'DELIVERED';

  // RTO = Return To Origin — shipment is coming back to sender.
  // Map to RETURNED (not CANCELLED) so the order history is accurate.
  // A customer's order being returned is NOT the same as it being cancelled.
  if (status.includes('RTO')) return 'RETURNED';

  // Only mark CANCELLED if Nimbuspost explicitly sends CANCELLED (shipment booking cancelled,
  // not yet shipped). Guard against accidental bulk cancellations from test/duplicate webhooks.
  if (status === 'CANCELLED' || status === 'SHIPMENT_CANCELLED') return 'CANCELLED';

  return null;
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifyWebhookSecret(request: Request, rawBody: string): boolean {
  // If configured, allow Nimbus NP-API-KEY header verification for webhook calls.
  const apiKey = process.env.NIMBUSPOST_API_KEY;
  const incomingApiKey = request.headers.get('np-api-key');
  if (apiKey && incomingApiKey) {
    return safeEqual(incomingApiKey, apiKey);
  }

  const secret = process.env.NIMBUSPOST_WEBHOOK_SECRET;
  if (!secret) return true;

  // 1) Simple shared-secret header mode
  const sharedSecretHeaderName = (process.env.NIMBUSPOST_WEBHOOK_SECRET_HEADER || 'x-nimbuspost-secret').toLowerCase();
  const sharedSecretHeaderValue = request.headers.get(sharedSecretHeaderName);
  if (sharedSecretHeaderValue) {
    return safeEqual(sharedSecretHeaderValue, secret);
  }

  // 2) HMAC signature mode (Nimbus/account specific)
  const signatureHeaderName = (process.env.NIMBUSPOST_WEBHOOK_SIGNATURE_HEADER || 'x-nimbuspost-signature').toLowerCase();
  const receivedSignatureRaw = request.headers.get(signatureHeaderName);
  if (!receivedSignatureRaw) return false;

  const receivedSignature = receivedSignatureRaw.replace(/^sha256=/i, '').trim();
  const computedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (safeEqual(receivedSignature, computedHex)) return true;

  // Optional base64 compatibility
  const computedBase64 = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  return safeEqual(receivedSignature, computedBase64);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!verifyWebhookSecret(request, rawBody)) {
      return NextResponse.json({ success: false, error: 'Invalid webhook secret' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;

    const awbNumber = getNestedString(payload, [
      'awb_number',
      'awb',
      'tracking_number',
      'data.awb_number',
      'data.awb',
      'data.tracking_number',
    ]);
    const shipmentId = getNestedString(payload, [
      'shipment_id',
      'shipmentId',
      'order_id',
      'data.shipment_id',
      'data.shipmentId',
      'data.order_id',
    ]);
    const trackingUrl = getNestedString(payload, ['tracking_url', 'data.tracking_url']);
    const statusCode = getNestedString(payload, ['status_code', 'data.status_code']);
    const nimbusStatus =
      getNestedString(payload, ['status', 'shipment_status', 'data.status', 'data.shipment_status']) || 'UNKNOWN';

    if (!awbNumber && !shipmentId) {
      return NextResponse.json({ success: false, error: 'awb/shipment id missing' }, { status: 400 });
    }

    const mappedStatus = mapNimbusToOrderStatus(nimbusStatus);

    const updated = await prisma.order.updateMany({
      where: shipmentId ? { shipmentId } : { awbNumber: awbNumber! },
      data: {
        ...(mappedStatus ? { status: mappedStatus } : {}),
        ...(trackingUrl ? { trackingUrl } : {}),
        nimbusStatus,
        nimbusStatusCode: statusCode || null,
        ...(nimbusStatus.toUpperCase() === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        nimbusWebhookPayload: payload as Prisma.InputJsonValue,
      },
    });

    // When NimbusPost confirms delivery, email the customer
    if (mappedStatus === 'DELIVERED') {
      try {
        const order = await prisma.order.findFirst({
          where: shipmentId ? { shipmentId } : { awbNumber: awbNumber! },
          include: {
            user: { select: { email: true, name: true } },
            items: {
              include: { product: { select: { name: true } } },
            },
          },
        });
        const customerEmail = order?.user?.email && !order.user.email.endsWith('@darshan.local')
          ? order.user.email
          : null;
        if (order && customerEmail) {
          sendOrderDeliveredEmail({
            to: customerEmail,
            customerName: order.shippingName || order.user?.name || 'Customer',
            orderId: order.id,
            total: order.total,
            items: order.items.map(i => ({
              name: i.product.name,
              quantity: i.quantity,
              price: i.price,
              size: i.size,
              color: i.color,
            })),
          }).catch(() => {});
        }
      } catch (emailErr) {
        console.error('Delivered email error (non-critical):', emailErr);
      }
    }

    return NextResponse.json({ success: true, updated: updated.count });
  } catch (error) {
    console.error('Nimbus webhook error:', error);
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
}

