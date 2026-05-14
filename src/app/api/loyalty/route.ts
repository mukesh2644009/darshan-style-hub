import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** GET /api/loyalty — returns the current user's points balance and recent transactions */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        loyaltyPoints: true,
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            points: true,
            type: true,
            description: true,
            orderId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      points: dbUser.loyaltyPoints,
      transactions: dbUser.loyaltyTransactions,
    });
  } catch (error) {
    console.error('Loyalty GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch loyalty data' }, { status: 500 });
  }
}
