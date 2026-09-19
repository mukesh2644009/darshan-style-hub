import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { deriveMyntraAutofill, deriveCoOrdSizeMeasurements } from '@/lib/myntraAutofill';

export const dynamic = 'force-dynamic';

const CO_ORD_CATEGORIES = ['Co Ord Sets', 'Summer Co-ord Sets'];

interface ProductSummary {
  productId: string;
  sku: string;
  name: string;
  filledFields: number;
  filledMeasurementCells: number;
  reviewFields: string[];
  blockedFields: string[];
  skipped?: string; // reason, e.g. unsupported category
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
      include: {
        sizes: true,
        colors: true,
        myntraListingDetail: { include: { sizeMeasurements: true } },
      },
    });

    const foundIds = new Set(products.map((p) => p.id));
    const notFound = productIds.filter((id) => !foundIds.has(id));

    const results: ProductSummary[] = [];

    for (const product of products) {
      const isCoOrd = CO_ORD_CATEGORIES.includes(product.category);
      const isSaree = product.category === 'Sarees';
      if (!isCoOrd && !isSaree) {
        results.push({
          productId: product.id, sku: product.sku, name: product.name,
          filledFields: 0, filledMeasurementCells: 0, reviewFields: [], blockedFields: [],
          skipped: `Category "${product.category}" isn't supported for Myntra (only Co Ord Sets, Summer Co-ord Sets and Sarees).`,
        });
        continue;
      }

      const outcome = deriveMyntraAutofill({
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        colors: product.colors,
      });

      const existing = product.myntraListingDetail;
      // Only fill fields that are currently empty — never clobber an admin's own edit.
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
        ? await prisma.myntraListingDetail.update({ where: { productId: product.id }, data: patch })
        : await prisma.myntraListingDetail.create({ data: { productId: product.id, ...patch } });

      let filledMeasurementCells = 0;
      if (isCoOrd) {
        const suggestions = deriveCoOrdSizeMeasurements(product.sizes.map((s) => s.size));
        const existingBySize = new Map((existing?.sizeMeasurements || []).map((m) => [m.size, m]));
        for (const s of suggestions) {
          const existingRow = existingBySize.get(s.size);
          const measurementPatch: Record<string, number> = {};
          (['bust', 'chest', 'frontLength', 'garmentWaist', 'inseamLength', 'toFitWaist'] as const).forEach((field) => {
            const currentVal = existingRow ? existingRow[field] : null;
            if (currentVal == null) {
              measurementPatch[field] = Number(s[field]);
              filledMeasurementCells += 1;
            }
          });
          if (Object.keys(measurementPatch).length > 0) {
            await prisma.myntraSizeMeasurement.upsert({
              where: { myntraListingDetailId_size: { myntraListingDetailId: detail.id, size: s.size } },
              create: { myntraListingDetailId: detail.id, size: s.size, ...measurementPatch },
              update: measurementPatch,
            });
          }
        }
      }

      // Report against the FINAL saved state, not the raw autofill output — a field
      // the autofill logic can't derive on its own (e.g. GTIN) may already have a
      // real value saved from a previous run or manual edit, and shouldn't show as
      // "still needs" just because this run didn't touch it.
      const finalDetail = detail as unknown as Record<string, string | null>;
      const stillBlocked = outcome.blockedFields.filter((field) => !finalDetail[field]);
      const reviewedThisRun = outcome.reviewFields.filter((field) => field in patch);

      results.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        filledFields,
        filledMeasurementCells,
        reviewFields: reviewedThisRun,
        blockedFields: stillBlocked,
      });
    }

    return NextResponse.json({ results, notFound });
  } catch (error) {
    console.error('Myntra autofill error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Autofill failed' },
      { status: 500 }
    );
  }
}
