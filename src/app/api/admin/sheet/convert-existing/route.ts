import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/auth';
import { absoluteImageUrl } from '@/lib/productImageCategorization';
import { RESIZE_OUTPUT_DIR, myntraPhotoName, toMyntraJpeg } from '@/lib/myntraImageFiles';
import { cloudinaryConfigured, productImageFolder, uploadToCloudinary } from '@/lib/cloudinaryUpload';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

// POST { sku, name, category, images: [{ url, label }] } — the Edit-page version
// of "Convert as per Myntra" for photos already on a product: converts each to
// 1080x1440 JPEG (<= 500 KB) with the SEO name, saves the set in
// resizeimages\<sku>\ (replacing any earlier set) and re-uploads it to
// Cloudinary under the same SEO names. Returns the new URLs; the Edit form
// saves them on Update Product.
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (!existsSync(path.dirname(RESIZE_OUTPUT_DIR))) {
      return NextResponse.json({ error: `Photo conversion works only on the laptop admin — ${path.dirname(RESIZE_OUTPUT_DIR)} not found.` }, { status: 400 });
    }
    if (!cloudinaryConfigured()) {
      return NextResponse.json({ error: 'Cloudinary keys missing — put the real values in .env.local and restart the dev server.' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const sku = String(body.sku || '').trim();
    const name = String(body.name || '').trim();
    const category = String(body.category || '').trim();
    const images: { url: string; label: string }[] = Array.isArray(body.images) ? body.images : [];
    if (!sku || !name || !category) return NextResponse.json({ error: 'SKU, name and category are required' }, { status: 400 });
    if (images.length === 0) return NextResponse.json({ error: 'No photos to convert' }, { status: 400 });

    // Fetch + convert everything first, so a failed download changes nothing.
    const converted: { fileName: string; data: Buffer }[] = [];
    const used = new Set<string>();
    for (const img of images) {
      const res = await fetch(absoluteImageUrl(img.url));
      if (!res.ok) return NextResponse.json({ error: `Could not fetch a photo (HTTP ${res.status}): ${img.url}` }, { status: 502 });
      const data = await toMyntraJpeg(Buffer.from(await res.arrayBuffer()));
      let fileName = myntraPhotoName(name, img.label || 'other', sku);
      for (let n = 2; used.has(fileName); n++) fileName = myntraPhotoName(name, img.label || 'other', sku, n);
      used.add(fileName);
      converted.push({ fileName, data });
    }

    // Local Myntra folder: replace any earlier conversion of this SKU.
    const folder = path.join(RESIZE_OUTPUT_DIR, sku.toLowerCase());
    await fs.mkdir(folder, { recursive: true });
    const skuTag = sku.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const ours = new RegExp(`_(main_photo|back_side_photo|side_photo|detail_photo|lifestyle_photo|other)_${skuTag}(_\\d+)?\\.jpg$`);
    for (const existing of await fs.readdir(folder)) {
      if (ours.test(existing)) await fs.rm(path.join(folder, existing), { force: true });
    }
    for (const c of converted) await fs.writeFile(path.join(folder, c.fileName), c.data);

    // Site copies under the same SEO names.
    const cloudFolder = productImageFolder(category, name);
    const files: { url: string; name: string; sizeKb: number }[] = [];
    for (const c of converted) {
      const url = await uploadToCloudinary(c.data, cloudFolder, c.fileName);
      files.push({ url, name: c.fileName, sizeKb: Math.round(c.data.length / 1024) });
    }

    return NextResponse.json({ folder, files });
  } catch (error) {
    console.error('Convert existing images error:', error);
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message || 'Photo conversion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
