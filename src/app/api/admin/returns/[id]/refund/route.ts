import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getRazorpay } from '@/lib/razorpay-server';

export const dynamic = 'force-dynamic';

/**
 * mode=razorpay: full refund via Razorpay (requires razorpayPaymentId, PAID)
 * mode=manual: mark order payment REFUNDED + return COMPLETED (COD / offline / legacy orders)
 */
export async function POST(
  request: Request,
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

    const body = await request.json().catch(() => ({}));
    const mode = body.mode === 'manual' ? 'manual' : 'razorpay';

    const ret = await prisma.returnRequest.findUnique({
      where: { id: params.id },
      include: {
        order: true,
      },
    });

    if (!ret) {
      return NextResponse.json(
        { success: false, error: 'Return request not found' },
        { status: 404 }
      );
    }

    if (ret.status !== 'APPROVED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Approve the return request before issuing a refund',
        },
        { status: 400 }
      );
    }

    const order = ret.order;

    if (order.paymentStatus === 'REFUNDED') {
      return NextResponse.json(
        { success: false, error: 'Order is already marked as refunded' },
        { status: 400 }
      );
    }

    if (mode === 'manual') {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'REFUNDED' },
        }),
        prisma.returnRequest.update({
          where: { id: ret.id },
          data: { status: 'COMPLETED' },
        }),
      ]);

      return NextResponse.json({
        success: true,
        mode: 'manual',
        message: 'Marked as refunded and return completed',
      });
    }

    // Razorpay
    if (!order.razorpayPaymentId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No Razorpay payment ID on this order. Use “Mark refunded (manual)” for COD or older orders.',
        },
        { status: 400 }
      );
    }

    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        {
          success: false,
          error: 'Order payment must be PAID to issue a Razorpay refund',
        },
        { status: 400 }
      );
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      return NextResponse.json(
        {
          success: false,
          error: 'Razorpay is not configured (missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)',
        },
        { status: 503 }
      );
    }

    const amountPaise = Math.round(order.total * 100);
    if (amountPaise <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order total for refund' },
        { status: 400 }
      );
    }

    const refund = (await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: amountPaise,
      speed: 'normal',
    })) as { id: string };

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'REFUNDED',
          razorpayRefundId: refund.id,
        },
      }),
      prisma.returnRequest.update({
        where: { id: ret.id },
        data: { status: 'COMPLETED' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      mode: 'razorpay',
      refundId: refund.id,
      message: 'Refund issued and return marked completed',
    });
  } catch (error: unknown) {
    console.error('Refund error:', error);
    let msg = 'Refund failed';
    if (error && typeof error === 'object') {
      const e = error as { error?: { description?: string }; message?: string };
      msg = e.error?.description || e.message || msg;
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
