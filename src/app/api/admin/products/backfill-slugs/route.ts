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

    // Get all products - backfill those with null, empty, or id-like slugs
    const allProducts = await prisma.product.findMany({
      select: { id: true, name: true, slug: true }
    });

    const needsSlug = (slug: string | null) => {
      if (!slug || slug.trim() === '') return true;
      if (/^c[a-z0-9]{24}$/i.test(slug)) return true; // slug is same as id
      return false;
    };

    const products = allProducts.filter(p => needsSlug(p.slug));
    const existingSlugs = allProducts
      .filter(p => !needsSlug(p.slug))
      .map(p => p.slug!).filter(Boolean);

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

    const message = updated > 0 
      ? `Backfilled slugs for ${updated} products` 
      : allProducts.length === 0
        ? 'No products found in database'
        : `All ${allProducts.length} products already have slugs`;

    return NextResponse.json({
      success: true,
      message,
      updated,
      total: allProducts.length
    });
  } catch (error) {
    console.error('Error backfilling slugs:', error);
    return NextResponse.json(
      { error: 'Failed to backfill slugs' },
      { status: 500 }
    );
  }
}
