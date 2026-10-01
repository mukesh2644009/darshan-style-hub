import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { fetchFlipkartListings, updateFlipkartPrices } from '@/lib/flipkartApi';
import { platformPrice } from '@/lib/platformPricing';

export const dynamic = 'force-dynamic';

export interface PriceChange {
  sku: string;
  productSku: string;
  productId: string; // FSN
  current: { mrp: number; sellingPrice: number };
  target: { mrp: number; sellingPrice: number };
  capped: boolean;
}

// Pushes our platform pricing (site price + Flipkart markup) to listings that
// are already LIVE on Flipkart. Without `apply: true` it only previews the
// changes — prices on Flipkart change only after the admin confirms.
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { productIds, apply } = await request.json().catch(() => ({}));
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'productIds must be a non-empty array' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { sku: true, price: true, originalPrice: true, sizes: { select: { size: true } } },
    });

    // Same SKU conventions as listing-status: per-size SKUs, or the bare SKU.
    const skuOwner = new Map<string, (typeof products)[number]>();
    for (const p of products) {
      for (const sku of [p.sku, ...p.sizes.map((s) => `${p.sku}-${s.size}`)]) skuOwner.set(sku, p);
    }
    const live = await fetchFlipkartListings(Array.from(skuOwner.keys()));

    const changes: PriceChange[] = [];
    for (const listing of live) {
      const product = skuOwner.get(listing.sku)!;
      const target = platformPrice(product, 'flipkart');
      if (listing.mrp === target.mrp && listing.sellingPrice === target.price) continue;
      changes.push({
        sku: listing.sku,
        productSku: product.sku,
        productId: listing.productId,
        current: { mrp: listing.mrp, sellingPrice: listing.sellingPrice },
        target: { mrp: target.mrp, sellingPrice: target.price },
        capped: target.capped,
      });
    }

    const liveProducts = new Set(live.map((l) => skuOwner.get(l.sku)!.sku));
    const notLive = products.filter((p) => !liveProducts.has(p.sku)).map((p) => p.sku);

    if (!apply) {
      return NextResponse.json({ changes, notLive });
    }

    const failures = await updateFlipkartPrices(changes.map((c) => ({
      sku: c.sku,
      productId: c.productId,
      mrp: c.target.mrp,
      sellingPrice: c.target.sellingPrice,
    })));
    return NextResponse.json({ changes, notLive, updated: changes.length - failures.length, failures });
  } catch (error) {
    console.error('Flipkart sync-prices error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Price sync failed' }, { status: 500 });
  }
}
