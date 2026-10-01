import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { deriveFlipkartAutofill } from '@/lib/flipkartAutofill';
import { isFlipkartSupportedCategory } from '@/lib/flipkart';

export const dynamic = 'force-dynamic';

interface ProductSummary {
  productId: string;
  sku: string;
  name: string;
  filledFields: number;
  reviewFields: string[];
  blockedFields: string[];
  skipped?: string;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const productIds: string[] = Array.isArray(body.productIds) ? body.productIds : [];
    if (productIds.length === 0) {
      return NextResponse.json({ error: 'productIds is required' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { colors: true, flipkartListingDetail: true },
    });

    const foundIds = new Set(products.map((p) => p.id));
    const notFound = productIds.filter((id) => !foundIds.has(id));

    const results: ProductSummary[] = [];

    for (const product of products) {
      if (!isFlipkartSupportedCategory(product.category)) {
        results.push({
          productId: product.id, sku: product.sku, name: product.name,
          filledFields: 0, reviewFields: [], blockedFields: [],
          skipped: `Category "${product.category}" isn't supported for Flipkart yet (only Co Ord Sets, Summer Co-ord Sets, and Suits).`,
        });
        continue;
      }

      const outcome = deriveFlipkartAutofill({
        name: product.name,
        description: product.description,
        category: product.category,
        colors: product.colors,
      });

      const existing = product.flipkartListingDetail;
      const patch: Record<string, string> = {};
      let filledFields = 0;
      for (const [key, value] of Object.entries(outcome.patch)) {
        const current = existing ? (existing as unknown as Record<string, string | null>)[key] : null;
        if (!current) {
          patch[key] = value;
          filledFields += 1;
        }
      }

      const detail = existing
        ? await prisma.flipkartListingDetail.update({ where: { productId: product.id }, data: patch })
        : await prisma.flipkartListingDetail.create({ data: { productId: product.id, ...patch } });

      const finalDetail = detail as unknown as Record<string, string | null>;
      const stillBlocked = outcome.blockedFields.filter((field) => !finalDetail[field]);
      const reviewedThisRun = outcome.reviewFields.filter((field) => field in patch);

      results.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        filledFields,
        reviewFields: reviewedThisRun,
        blockedFields: stillBlocked,
      });
    }

    return NextResponse.json({ results, notFound });
  } catch (error) {
    console.error('Flipkart autofill error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Autofill failed' },
      { status: 500 }
    );
  }
}
