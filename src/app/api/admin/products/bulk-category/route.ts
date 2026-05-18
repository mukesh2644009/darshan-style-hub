import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PATCH — bulk update category + subcategory for multiple products
// body: [{ id, category, subcategory }, ...]
export async function PATCH(request: Request) {
  const authResult = await requireAdmin();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const updates: { id: string; category: string; subcategory: string }[] = await request.json();

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'Expected a non-empty array' }, { status: 400 });
  }

  await Promise.all(
    updates.map(({ id, category, subcategory }) =>
      prisma.product.update({
        where: { id },
        data: { category: category.trim(), subcategory: subcategory.trim() },
      })
    )
  );

  return NextResponse.json({ success: true, updated: updates.length });
}
