import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PATCH — bulk update rating + reviews for multiple products
// body: [{ id, rating, reviews }, ...]
export async function PATCH(request: Request) {
  const authResult = await requireAdmin();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const updates: { id: string; rating: number; reviews: number }[] = await request.json();

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'Expected a non-empty array' }, { status: 400 });
  }

  await Promise.all(
    updates.map(({ id, rating, reviews }) =>
      prisma.product.update({
        where: { id },
        data: {
          rating:  Math.min(5, Math.max(0, parseFloat(rating.toString()))),
          reviews: Math.max(0, parseInt(reviews.toString(), 10)),
        },
      })
    )
  );

  return NextResponse.json({ success: true, updated: updates.length });
}
