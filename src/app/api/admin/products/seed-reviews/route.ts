import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Realistic rating distribution: mostly 4.2–4.9, some 5.0
function randomRating() {
  const options = [4.1, 4.2, 4.3, 4.4, 4.5, 4.5, 4.6, 4.6, 4.7, 4.7, 4.8, 4.8, 4.8, 4.9, 4.9, 5.0];
  return options[Math.floor(Math.random() * options.length)];
}

// Realistic review count: 8–120
function randomReviewCount() {
  const options = [8, 11, 14, 17, 19, 22, 25, 28, 31, 35, 38, 42, 47, 53, 61, 68, 74, 82, 91, 105, 112, 120];
  return options[Math.floor(Math.random() * options.length)];
}

export async function POST() {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Find all products with 0 reviews
  const products = await prisma.product.findMany({
    where: { reviews: 0 },
    select: { id: true },
  });

  if (products.length === 0) {
    return NextResponse.json({ message: 'All products already have reviews!', updated: 0 });
  }

  // Update each with random realistic values
  await Promise.all(
    products.map(p =>
      prisma.product.update({
        where: { id: p.id },
        data: { rating: randomRating(), reviews: randomReviewCount() },
      })
    )
  );

  return NextResponse.json({ message: `Added reviews to ${products.length} products`, updated: products.length });
}
