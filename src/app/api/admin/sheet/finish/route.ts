import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { isSheetAccessAvailable, readSheetRow, updateSheetRow, upsertCategoryTab } from '@/lib/parentSheet';
import { myntraImageFiles, RESIZE_OUTPUT_DIR } from '@/lib/myntraImageFiles';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// POST { tab, sNo, productId } — run after a product from the parent sheet is
// saved: converts its photos to Myntra format into resizeimages\<sku>\, marks
// the sheet row (Size Converted / Resized Folder / Added to Darshan Site /
// Item Name) and adds or updates the product in its category tab.
// Each step reports separately so one failure doesn't hide the others.
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (!isSheetAccessAvailable()) {
      return NextResponse.json({ error: 'This step works only on the laptop admin (localhost) — the Google key file isn\'t on this server.' }, { status: 400 });
    }

    const { tab, sNo, productId, convertedFiles } = await request.json().catch(() => ({}));
    if (!tab || !sNo || !productId) {
      return NextResponse.json({ error: 'tab, sNo and productId are required' }, { status: 400 });
    }
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { id: 'asc' } }, sizes: true },
    });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const steps: { step: string; ok: boolean; detail: string }[] = [];

    // 1. Myntra-format photos into the local folder — already done in the form
    // when the photos were added (SEO-named); otherwise convert from the site photos.
    const folder = path.join(RESIZE_OUTPUT_DIR, product.sku.toLowerCase());
    let imageNames: string[] = [];
    let resizeOk = false;
    const already: string[] = Array.isArray(convertedFiles) ? convertedFiles.map(String) : [];
    const present = already.length > 0
      ? (await Promise.all(already.map((n) => fs.access(path.join(folder, path.basename(n))).then(() => true, () => false)))).every(Boolean)
      : false;
    if (present) {
      imageNames = already;
      resizeOk = true;
      steps.push({ step: 'Photos converted for Myntra', ok: true, detail: `${already.length} photo(s) in ${folder}` });
    } else try {
      const files = await myntraImageFiles(product);
      await fs.mkdir(folder, { recursive: true });
      for (const f of files) await fs.writeFile(path.join(folder, f.name), f.data);
      imageNames = files.map((f) => f.name);
      resizeOk = files.length > 0;
      steps.push({ step: 'Photos converted for Myntra', ok: resizeOk, detail: `${files.length} photo(s) → ${folder}` });
    } catch (err) {
      steps.push({ step: 'Photos converted for Myntra', ok: false, detail: err instanceof Error ? err.message : String(err) });
    }

    // 2. Mark the source row.
    let row: Awaited<ReturnType<typeof readSheetRow>> | null = null;
    try {
      row = await readSheetRow(tab, String(sNo));
      await updateSheetRow(tab, row.rowNumber, {
        'Item Name': product.name,
        'Size Converted': resizeOk ? 'Yes' : 'No',
        'Resized Folder': resizeOk ? folder : '',
        'Added to Darshan Site': 'Yes',
      });
      steps.push({ step: `Sheet "${tab}" row S.No ${sNo} updated`, ok: true, detail: 'Item Name, Size Converted, Resized Folder, Added to Darshan Site' });
    } catch (err) {
      steps.push({ step: `Sheet "${tab}" row update`, ok: false, detail: err instanceof Error ? err.message : String(err) });
    }

    // 3. Category tab (created if it doesn't exist yet).
    try {
      const result = await upsertCategoryTab(product.category, {
        sku: product.sku,
        fabric: row?.fabricSpec || '',
        title: product.name,
        realPrice: product.originalPrice || row?.realPrice || 0,
        sellingPrice: product.price,
        bullets: row?.bullets || [],
        description: product.description,
        imageFiles: imageNames,
        sizes: product.sizes.map((s) => ({ size: s.size, quantity: s.quantity })),
      });
      steps.push({
        step: `Category tab "${result.tab}"`,
        ok: true,
        detail: `${result.created ? 'tab created, ' : ''}row ${result.action}`,
      });
    } catch (err) {
      steps.push({ step: 'Category tab update', ok: false, detail: err instanceof Error ? err.message : String(err) });
    }

    return NextResponse.json({ steps, folder });
  } catch (error) {
    console.error('Sheet finish error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Finish step failed' }, { status: 500 });
  }
}
