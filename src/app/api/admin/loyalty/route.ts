import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function isAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return false;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  return session?.user?.role === 'ADMIN';
}

// GET — list all users (excluding admins) with their loyalty points + latest transactions
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const users = await (prisma as any).user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      loyaltyPoints: true,
      createdAt: true,
      _count: { select: { loyaltyTransactions: true } },
      loyaltyTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          points: true,
          type: true,
          description: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, users });
}

// POST — adjust or set loyalty points for a user
// body: { userId, action: 'add' | 'subtract' | 'set', points, reason }
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const body = await request.json();
  const { userId, action, points: rawPoints, reason } = body;

  if (!userId || !action || rawPoints == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const pts = Math.abs(Math.round(Number(rawPoints)));
  if (isNaN(pts) || pts < 0) {
    return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
  }

  const dbUser = await (prisma as any).user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true, name: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let newBalance: number;
  let txPoints: number;
  let txType: string;

  if (action === 'set') {
    newBalance = pts;
    txPoints = pts - ((dbUser as any).loyaltyPoints ?? 0);
    txType = 'ADMIN_ADJUST';
  } else if (action === 'add') {
    newBalance = ((dbUser as any).loyaltyPoints ?? 0) + pts;
    txPoints = pts;
    txType = 'BONUS';
  } else if (action === 'subtract') {
    newBalance = Math.max(0, ((dbUser as any).loyaltyPoints ?? 0) - pts);
    txPoints = -(((dbUser as any).loyaltyPoints ?? 0) - newBalance);
    txType = 'ADMIN_ADJUST';
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  await (prisma as any).$transaction([
    (prisma as any).user.update({
      where: { id: userId },
      data: { loyaltyPoints: newBalance },
    }),
    (prisma as any).loyaltyTransaction.create({
      data: {
        userId,
        points: txPoints,
        type: txType,
        description: reason?.trim() || `Admin ${action === 'set' ? 'set balance to' : action === 'add' ? 'added' : 'removed'} ${pts} pts`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, newBalance });
}
