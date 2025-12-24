import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function getCurrentUser() {
  const token = cookies().get('auth_token')?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
  });
}

// Cancel order (only if PENDING and belongs to user)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (order.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if order can be cancelled
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Only pending orders can be cancelled' },
        { status: 400 }
      );
    }

    // Update order status to cancelled
    await prisma.order.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}

