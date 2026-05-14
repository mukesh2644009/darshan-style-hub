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

// GET — full transaction history for a user
// query: ?userId=xxx
export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const transactions = await (prisma as any).loyaltyTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, transactions });
}

// DELETE — remove a specific transaction and reverse its points from the user balance
// body: { transactionId }
export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { transactionId } = await request.json();
  if (!transactionId) {
    return NextResponse.json({ error: 'transactionId required' }, { status: 400 });
  }

  const tx = await (prisma as any).loyaltyTransaction.findUnique({
    where: { id: transactionId },
  });
  if (!tx) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  // Reverse the points then delete the transaction
  await (prisma as any).$transaction([
    (prisma as any).user.update({
      where: { id: (tx as any).userId },
      data: { loyaltyPoints: { decrement: (tx as any).points } },
    }),
    (prisma as any).loyaltyTransaction.delete({
      where: { id: transactionId },
    }),
  ]);

  return NextResponse.json({ success: true });
}
