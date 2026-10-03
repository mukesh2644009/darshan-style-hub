import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { DEFAULT_SOURCE_TAB, isSheetAccessAvailable, readSheetRow } from '@/lib/parentSheet';

export const dynamic = 'force-dynamic';

// GET /api/admin/sheet/row?tab=Sheet2&sno=6 → that row of the parent sheet,
// parsed for the Add Product form. Local only (needs the hang-tag Google key).
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (!isSheetAccessAvailable()) {
      return NextResponse.json({ error: 'Load from Sheet works only on the laptop admin (localhost) — the Google key file isn\'t on this server.' }, { status: 400 });
    }

    const params = new URL(request.url).searchParams;
    const tab = params.get('tab') || DEFAULT_SOURCE_TAB;
    const sNo = params.get('sno') || '';
    if (!sNo) return NextResponse.json({ error: 'S.No is required' }, { status: 400 });

    const row = await readSheetRow(tab, sNo);
    const existing = row.sku
      ? await prisma.product.findUnique({ where: { sku: row.sku }, select: { id: true, name: true } })
      : null;

    return NextResponse.json({ row, existing });
  } catch (error) {
    console.error('Sheet row error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not read the sheet' }, { status: 500 });
  }
}
