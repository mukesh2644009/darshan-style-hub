import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Single-product Flipkart review panel: fetch current values (GET) and save
// edits (PATCH) without touching the rest of the product record — unlike
// /api/admin/products/[id], which requires the full product payload.

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      flipkartListingDetail: true,
      colors: true,
      images: { orderBy: { id: 'asc' }, take: 1 },
    },
  });
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({
    productId: product.id,
    sku: product.sku,
    category: product.category,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    colors: product.colors,
    imageUrl: product.images[0]?.url || null,
    flipkart: product.flipkartListingDetail,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const { productId, patch } = body;
  if (!productId || typeof patch !== 'object' || patch === null) {
    return NextResponse.json({ error: 'productId and patch are required' }, { status: 400 });
  }

  const detail = await prisma.flipkartListingDetail.upsert({
    where: { productId },
    create: { productId, ...patch },
    update: { ...patch },
  });

  return NextResponse.json({ flipkart: detail });
}
