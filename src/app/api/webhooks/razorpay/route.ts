import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { confirmRazorpayPayment } from '@/lib/order-payment';

export const dynamic = 'force-dynamic';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/**
 * Server-to-server confirmation of Razorpay payments — the source of truth
 * that doesn't depend on the customer's browser tab surviving the UPI app
 * switch-and-return (which frequently gets killed in Instagram/Facebook's
 * in-app browser, leaving orders stuck PENDING despite the payment succeeding).
 * See api/razorpay/verify for the client-side confirmation path this backs up.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      payload?: { payment?: { entity?: Record<string, unknown> } };
    };

    if (payload.event !== 'payment.captured' && payload.event !== 'order.paid') {
      return NextResponse.json({ success: true, skipped: payload.event });
    }

    const payment = payload.payload?.payment?.entity;
    if (!payment) {
      return NextResponse.json({ success: false, error: 'No payment entity in payload' }, { status: 400 });
    }

    const paymentId = payment.id as string;
    const razorpayOrderId = payment.order_id as string;
    const notes = (payment.notes as Record<string, string> | undefined) || {};

    // Razorpay copies notes set at order-creation time onto the payment automatically.
    // Fall back to fetching the Razorpay order (receipt = our internal order id) if
    // notes weren't present for some reason.
    let orderId: string | undefined = notes.orderId;
    if (!orderId && razorpayOrderId) {
      const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
      orderId = razorpayOrder.receipt || undefined;
    }

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Could not resolve internal order id' }, { status: 400 });
    }

    const result = await confirmRazorpayPayment(orderId, paymentId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, alreadyPaid: result.alreadyPaid ?? false });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
}