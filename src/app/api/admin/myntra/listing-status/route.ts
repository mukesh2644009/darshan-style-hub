import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Myntra gives us no API, so the status comes from each style's public page
// (myntra.com/<styleId>), which lists every size with "available": true/false:
//   IN_STOCK  — at least one size available
//   NO_STOCK  — sizes listed, none available (still cataloguing, or needs an
//               inventory upload in M-Direct)
//   NOT_FOUND — no product data on the page (not live / wrong id)
// Cached per style for 10 minutes so the admin list doesn't hammer Myntra.
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; value: MyntraStatus }>();

export interface MyntraStatus {
  styleId: string;
  status: 'IN_STOCK' | 'NO_STOCK' | 'NOT_FOUND' | 'UNKNOWN';
  sizes: { size: string; available: boolean }[];
}

async function lookup(styleId: string): Promise<MyntraStatus> {
  const hit = cache.get(styleId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  let value: MyntraStatus;
  try {
    const res = await fetch(`https://www.myntra.com/${encodeURIComponent(styleId)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36' },
      cache: 'no-store',
    });
    const html = await res.text();
    const sizes = Array.from(html.matchAll(/"label":"([A-Za-z0-9 /]+)","available":(true|false)/g))
      .map((m) => ({ size: m[1], available: m[2] === 'true' }));
    value = {
      styleId,
      status: sizes.length === 0 ? 'NOT_FOUND' : sizes.some((s) => s.available) ? 'IN_STOCK' : 'NO_STOCK',
      sizes,
    };
  } catch {
    value = { styleId, status: 'UNKNOWN', sizes: [] };
  }
  cache.set(styleId, { at: Date.now(), value });
  return value;
}

// POST { productIds } → { statuses: { [productId]: MyntraStatus } } for products with a Myntra style id.
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { productIds } = await request.json().catch(() => ({}));
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'productIds must be a non-empty array' }, { status: 400 });
    }
    const details = await prisma.myntraListingDetail.findMany({
      where: { productId: { in: productIds }, myntraStyleId: { not: null } },
      select: { productId: true, myntraStyleId: true },
    });
    const statuses: Record<string, MyntraStatus> = {};
    // A few at a time — it's a handful of styles, and Myntra is a public site.
    for (let i = 0; i < details.length; i += 4) {
      const batch = details.slice(i, i + 4);
      const results = await Promise.all(batch.map((d) => lookup(d.myntraStyleId!)));
      batch.forEach((d, j) => { statuses[d.productId] = results[j]; });
    }
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('Myntra listing status error:', error);
    return NextResponse.json({ error: 'Failed to check Myntra status' }, { status: 500 });
  }
}
