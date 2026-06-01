import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireStaff();
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const products = await prisma.product.findMany({
      include: {
        images: { select: { url: true } },
        sizes:  { select: { id: true, size: true, quantity: true } },
        colors: { select: { name: true, hex: true } },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('POS products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
