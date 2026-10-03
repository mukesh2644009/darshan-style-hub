import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getMyntraSheetName, validateMyntraListing, type ProductWithMyntra } from '@/lib/myntra';
import { fillMyntraTemplate } from '@/lib/myntraTemplateFill';

export const dynamic = 'force-dynamic';

// "Fill Myntra Template": the admin uploads the bulk template they downloaded
// from Myntra's Partner Portal; we fill the selected products into it and hand
// it back under the same filename.
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const form = await request.formData();
    const file = form.get('file');
    const productIdsRaw = form.get('productIds');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required (the template downloaded from Myntra)' }, { status: 400 });
    }
    let productIds: string[] = [];
    try {
      productIds = JSON.parse(String(productIdsRaw));
    } catch { /* handled below */ }
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'productIds must be a non-empty array' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: { orderBy: { id: 'asc' } },
        sizes: true,
        colors: true,
        myntraListingDetail: { include: { sizeMeasurements: true } },
      },
    }) as ProductWithMyntra[];

    const validationErrors = products
      .map((p) => ({ productId: p.id, sku: p.sku, name: p.name, missingFields: validateMyntraListing(p) }))
      .filter((v) => v.missingFields.length > 0);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'One or more products are missing required Myntra fields', details: validationErrors },
        { status: 422 }
      );
    }

    const sheetNames = Array.from(new Set(products.map((p) => getMyntraSheetName(p.category))));
    if (sheetNames.length !== 1 || !sheetNames[0]) {
      return NextResponse.json(
        { error: 'Myntra templates hold one article type each — select only Co-Ords, or only Sarees.' },
        { status: 422 }
      );
    }

    const result = await fillMyntraTemplate(Buffer.from(await file.arrayBuffer()), sheetNames[0], products);

    const warnings: string[] = [];
    if (result.unmatchedHeaders.length > 0) {
      warnings.push(`Columns not in this Myntra template version (left out): ${result.unmatchedHeaders.join(', ')}`);
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'X-Fill-Warnings': encodeURIComponent(warnings.join(' || ')),
      },
    });
  } catch (error) {
    console.error('Myntra fill-template error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Fill-template failed' }, { status: 500 });
  }
}
