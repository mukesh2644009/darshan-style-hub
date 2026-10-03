import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/auth';
import { RESIZE_OUTPUT_DIR, myntraPhotoName, toMyntraJpeg } from '@/lib/myntraImageFiles';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

// POST multipart { images[], labels (JSON), sku, name } — converts the photos
// picked in Add Product to Myntra format (1080x1440 JPEG, <= 500 KB) right
// away, names them like hang-tag did (<seo-title>_<angle>_<sku>.jpg), saves
// them in resizeimages\<sku>\ and returns them so the same files go to the site.
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (!existsSync(path.dirname(RESIZE_OUTPUT_DIR))) {
      return NextResponse.json({ error: `Photo conversion works only on the laptop admin — ${path.dirname(RESIZE_OUTPUT_DIR)} not found.` }, { status: 400 });
    }

    const form = await request.formData();
    const files = form.getAll('images') as File[];
    const sku = String(form.get('sku') || '').trim();
    const name = String(form.get('name') || '').trim();
    let labels: string[] = [];
    try { labels = JSON.parse(String(form.get('labels') || '[]')); } catch { labels = []; }
    if (!sku || !name) return NextResponse.json({ error: 'SKU and Product Name are needed first (they go in the file names).' }, { status: 400 });
    if (files.length === 0) return NextResponse.json({ error: 'No photos' }, { status: 400 });

    const folder = path.join(RESIZE_OUTPUT_DIR, sku.toLowerCase());
    await fs.mkdir(folder, { recursive: true });

    // Remove every earlier conversion of this SKU (e.g. made before the name
    // changed, even in an earlier session) so the folder holds only the current
    // set. Only files in our own naming pattern are touched.
    const skuTag = sku.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const ours = new RegExp(`_(main_photo|back_side_photo|side_photo|detail_photo|lifestyle_photo|other)_${skuTag}(_\\d+)?\\.jpg$`);
    for (const existing of await fs.readdir(folder)) {
      if (ours.test(existing)) await fs.rm(path.join(folder, existing), { force: true });
    }

    const used = new Set<string>();
    const out: { name: string; label: string; sizeKb: number; dataUrl: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const label = labels[i] || 'other';
      const data = await toMyntraJpeg(Buffer.from(await files[i].arrayBuffer()));
      let fileName = myntraPhotoName(name, label, sku);
      for (let n = 2; used.has(fileName); n++) fileName = myntraPhotoName(name, label, sku, n);
      used.add(fileName);
      await fs.writeFile(path.join(folder, fileName), data);
      out.push({ name: fileName, label, sizeKb: Math.round(data.length / 1024), dataUrl: `data:image/jpeg;base64,${data.toString('base64')}` });
    }

    return NextResponse.json({ folder, files: out });
  } catch (error) {
    console.error('Convert images error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Photo conversion failed' }, { status: 500 });
  }
}
