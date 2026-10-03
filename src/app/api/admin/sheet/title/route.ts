import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { composeTitle } from '@/lib/parentSheet';
import { suggestProductTitle } from '@/lib/productTitleAi';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST { category, fabricSpec, description, bullets } → { title, byAi }.
// Falls back to the rule-based hang-tag title when Gemini is unavailable.
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const body = await request.json().catch(() => ({}));
    const category = String(body.category || '');
    const fabricSpec = String(body.fabricSpec || '');
    const description = String(body.description || '');
    const bullets: string[] = Array.isArray(body.bullets) ? body.bullets.map(String) : [];

    // Style examples: the newest DSH_ products in the same category.
    const examples = (await prisma.product.findMany({
      where: { category, sku: { startsWith: 'DSH_' } },
      select: { name: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    })).map((p) => p.name);

    try {
      const title = await suggestProductTitle({ category, fabricSpec, description, bullets, examples });
      if (title) return NextResponse.json({ title, byAi: true });
    } catch (err) {
      console.warn('AI title failed, using rule-based title:', err instanceof Error ? err.message : err);
    }
    return NextResponse.json({ title: composeTitle(fabricSpec, bullets, description), byAi: false });
  } catch (error) {
    console.error('Sheet title error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create a name' }, { status: 500 });
  }
}
