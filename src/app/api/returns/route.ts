import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { isValidReturnReason } from '@/lib/return-reasons';

export const dynamic = 'force-dynamic';

const MAX_DETAILS = 2000;

/** List current user's return requests (newest first). */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user;

    const returns = await prisma.returnRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, returns });
  } catch (error) {
    console.error('Error listing returns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load return requests' },
      { status: 500 }
    );
  }
}

/** Submit a return request for a delivered order (one per order). */
export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user;
    const body = await request.json();
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    const detailsRaw = typeof body.details === 'string' ? body.details.trim() : '';
    const details = detailsRaw.length > 0 ? detailsRaw.slice(0, MAX_DETAILS) : null;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!reason || !isValidReturnReason(reason)) {
      return NextResponse.json(
        { success: false, error: 'Please select a valid return reason' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { returnRequest: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Returns can only be requested after the order is marked delivered. Contact us on WhatsApp if you need help sooner.',
        },
        { status: 400 }
      );
    }

    // Enforce 3-day return window from delivery
    const deliveredAt = order.updatedAt;
    const daysSinceDelivery = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'Return window has expired. Returns must be requested within 3 days of delivery.',
        },
        { status: 400 }
      );
    }

    if (order.returnRequest) {
      return NextResponse.json(
        { success: false, error: 'A return request already exists for this order' },
        { status: 400 }
      );
    }

    const created = await prisma.returnRequest.create({
      data: {
        userId: user.id,
        orderId: order.id,
        reason,
        details,
      },
    });

    return NextResponse.json(
      {
        success: true,
        returnRequest: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating return request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit return request' },
      { status: 500 }
    );
  }
}
