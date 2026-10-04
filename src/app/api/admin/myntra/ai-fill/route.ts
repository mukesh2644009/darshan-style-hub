import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { absoluteImageUrl } from '@/lib/productImageCategorization';
import { isMyntraAiConfigured, suggestMyntraCoOrdListing } from '@/lib/myntraAi';
import { toMyntraFabric } from '@/lib/myntraValues';
import { detectFabric } from '@/lib/productTextHeuristics';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // free-tier Gemini can take ~1 min with photos

// Returns AI-drafted Myntra fields for one Co-Ord product. Never saves — the
// admin reviews the suggestions in the panel and clicks Save themselves.
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (!isMyntraAiConfigured()) {
      return NextResponse.json({ error: 'AI Fill needs GEMINI_API_KEY in .env (free key from aistudio.google.com).' }, { status: 503 });
    }

    const { productId } = await request.json().catch(() => ({}));
    if (typeof productId !== 'string') {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { id: 'asc' } }, flipkartListingDetail: true },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const isDress = product.category === 'Western Dress';
    if (product.category !== 'Co Ord Sets' && product.category !== 'Summer Co-ord Sets' && !isDress) {
      return NextResponse.json({ error: `Myntra AI Fill currently supports Co-Ord Sets and Western Dress only (this is "${product.category}").` }, { status: 422 });
    }

    const suggestion = await suggestMyntraCoOrdListing({
      name: product.name,
      description: product.description,
      imageUrls: product.images.map((img) => absoluteImageUrl(img.url)).filter(Boolean),
      category: product.category,
    });
    if (isDress) return NextResponse.json({ suggestion });

    // Fabric is mandatory on Myntra but rarely stated in our descriptions. If
    // the AI couldn't decide, fall back to the other piece, then this product's
    // Flipkart fabric, then any fabric word in the text — always mapped onto
    // Myntra's own list for that field.
    const fk = product.flipkartListingDetail;
    for (const [field, other] of [['topFabric', 'bottomFabric'], ['bottomFabric', 'topFabric']] as const) {
      if (suggestion[field]) continue;
      const fkOwn = field === 'topFabric' ? fk?.topFabric : fk?.bottomFabric;
      suggestion[field] =
        toMyntraFabric(suggestion[other], field) ||
        toMyntraFabric(fkOwn, field) ||
        toMyntraFabric(fk?.fabricType, field) ||
        toMyntraFabric(detectFabric(`${product.name}\n${product.description}`), field);
    }
    const care = suggestion.materialCareDescription || '';
    if ((!care || /unknown/i.test(care)) && suggestion.topFabric && suggestion.bottomFabric) {
      suggestion.materialCareDescription =
        `Top fabric: ${suggestion.topFabric}, Bottom fabric: ${suggestion.bottomFabric}, ${suggestion.washCare || 'Hand Wash'}`;
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Myntra AI fill error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI fill failed' }, { status: 500 });
  }
}
