import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { fetchFlipkartListings, type FlipkartListing } from '@/lib/flipkartApi';

export const dynamic = 'force-dynamic';

// Short in-memory cache so every admin page load doesn't re-hit Flipkart.
const CACHE_TTL_MS = 10 * 60 * 1000;
let cache: { at: number; bySku: Map<string, FlipkartListing | null> } = { at: 0, bySku: new Map() };

export interface ProductFlipkartStatus {
  status: string; // ACTIVE if any size is active, else the first listing's status; IN_QC if only submitted
  url?: string;
  listedSkus: string[];
  requestId?: string;
  submittedAt?: string;
  livePrice?: number; // what buyers see on Flipkart now (live listings only)
  liveMrp?: number;
}

// Our bulk exports list each size as `${sku}-${size}`; some older listings
// (e.g. DSH_CS_03) use the bare product SKU — check both.
function candidateSkus(product: { sku: string; sizes: { size: string }[] }): string[] {
  return [product.sku, ...product.sizes.map((s) => `${product.sku}-${s.size}`)];
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { productIds } = await request.json();
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'productIds must be a non-empty array' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        sku: true,
        sizes: { select: { size: true } },
        flipkartListingDetail: { select: { flipkartRequestId: true, flipkartSubmittedAt: true } },
      },
    });

    if (Date.now() - cache.at > CACHE_TTL_MS) cache = { at: Date.now(), bySku: new Map() };
    const allSkus = products.filter((p) => p.sku).flatMap(candidateSkus);
    const unknown = allSkus.filter((sku) => !cache.bySku.has(sku));
    if (unknown.length > 0) {
      const found = await fetchFlipkartListings(unknown);
      const foundBySku = new Map(found.map((l) => [l.sku, l]));
      for (const sku of unknown) cache.bySku.set(sku, foundBySku.get(sku) ?? null);
    }

    const result: Record<string, ProductFlipkartStatus> = {};
    for (const product of products) {
      if (!product.sku) continue;
      const listings = candidateSkus(product)
        .map((sku) => cache.bySku.get(sku))
        .filter((l): l is FlipkartListing => !!l);
      if (listings.length === 0) {
        // Not live yet, but we filled a Flipkart template for it — QC pending.
        const detail = product.flipkartListingDetail;
        if (detail?.flipkartRequestId) {
          result[product.id] = {
            status: 'IN_QC',
            listedSkus: [],
            requestId: detail.flipkartRequestId,
            submittedAt: detail.flipkartSubmittedAt?.toISOString(),
          };
        }
        continue;
      }
      const active = listings.find((l) => l.listingStatus === 'ACTIVE');
      const shown = active ?? listings[0];
      result[product.id] = {
        status: active ? 'ACTIVE' : listings[0].listingStatus,
        url: shown.productUrl,
        listedSkus: listings.map((l) => l.sku),
        livePrice: shown.sellingPrice,
        liveMrp: shown.mrp,
      };
    }

    return NextResponse.json({ statuses: result });
  } catch (error) {
    console.error('Flipkart listing-status error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Listing status lookup failed' }, { status: 500 });
  }
}
