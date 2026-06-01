import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireStaff();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const orders = await prisma.order.findMany({
    where: { source: 'POS' },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json({ success: true, orders });
}
