import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { absoluteImageUrl } from '@/lib/productImageCategorization';
import { isGeminiConfigured, suggestFlipkartListing } from '@/lib/geminiListingAi';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // free-tier Gemini can take ~1 min with photos

// Returns AI-drafted Flipkart fields for one product. Never saves — the admin
// reviews the suggestions in the form and clicks Save themselves.
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (!isGeminiConfigured()) {
      return NextResponse.json({ error: 'AI Fill needs GEMINI_API_KEY in .env (free key from aistudio.google.com).' }, { status: 503 });
    }

    const { productId } = await request.json().catch(() => ({}));
    if (typeof productId !== 'string') {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { id: 'asc' } } },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const suggestion = await suggestFlipkartListing({
      name: product.name,
      description: product.description,
      category: product.category,
      imageUrls: product.images.map((img) => absoluteImageUrl(img.url)).filter(Boolean),
    });

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Flipkart AI fill error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI fill failed' }, { status: 500 });
  }
}
