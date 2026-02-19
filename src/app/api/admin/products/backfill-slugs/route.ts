import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { slugify, generateUniqueSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const products = await prisma.product.findMany({
      where: { slug: null },
      select: { id: true, name: true }
    });

    const existingSlugs = await prisma.product.findMany({
      where: { slug: { not: null } },
      select: { slug: true }
    }).then(rows => rows.map(r => r.slug).filter(Boolean) as string[]);

    let updated = 0;
    for (const product of products) {
      const baseSlug = slugify(product.name);
      const slug = generateUniqueSlug(baseSlug, existingSlugs);
      existingSlugs.push(slug);

      await prisma.product.update({
        where: { id: product.id },
        data: { slug }
      });
      updated++;
    }

    return NextResponse.json({
      success: true,
      message: `Backfilled slugs for ${updated} products`,
      updated
    });
  } catch (error) {
    console.error('Error backfilling slugs:', error);
    return NextResponse.json(
      { error: 'Failed to backfill slugs' },
      { status: 500 }
    );
  }
}
