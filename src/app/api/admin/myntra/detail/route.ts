import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Single-product Myntra review panel: fetch current values (GET) and save
// edits + per-size measurements (PATCH) without touching the rest of the
// product record.

const MEASUREMENT_FIELDS = ['bust', 'chest', 'frontLength', 'garmentWaist', 'inseamLength', 'toFitWaist'] as const;

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const productId = new URL(request.url).searchParams.get('productId');
  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      myntraListingDetail: { include: { sizeMeasurements: true } },
      colors: true,
      sizes: true,
      images: { orderBy: { id: 'asc' }, take: 1 },
    },
  });
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const { sizeMeasurements, ...myntra } = product.myntraListingDetail ?? { sizeMeasurements: [] };
  return NextResponse.json({
    productId: product.id,
    sku: product.sku,
    category: product.category,
    subcategory: product.subcategory,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    colors: product.colors,
    sizes: product.sizes.map((s) => s.size),
    imageUrl: product.images[0]?.url || null,
    myntra: product.myntraListingDetail ? myntra : null,
    measurements: sizeMeasurements,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { productId, patch, measurements } = await request.json().catch(() => ({}));
  if (!productId || typeof patch !== 'object' || patch === null) {
    return NextResponse.json({ error: 'productId and patch are required' }, { status: 400 });
  }

  const detail = await prisma.myntraListingDetail.upsert({
    where: { productId },
    create: { productId, ...patch },
    update: { ...patch },
  });

  if (measurements && typeof measurements === 'object') {
    for (const [size, m] of Object.entries(measurements as Record<string, Record<string, string>>)) {
      const data = Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f, m[f] !== '' && m[f] != null ? parseFloat(m[f]) : null]));
      await prisma.myntraSizeMeasurement.upsert({
        where: { myntraListingDetailId_size: { myntraListingDetailId: detail.id, size } },
        create: { myntraListingDetailId: detail.id, size, ...data },
        update: data,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
