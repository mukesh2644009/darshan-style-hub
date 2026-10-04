import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { RESIZE_OUTPUT_DIR, isImageFileName, myntraImageFiles } from '@/lib/myntraImageFiles';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// POST { productIds } — "Download Myntra Images": converts each product's photos
// to Myntra format (1080x1440, <= 500 KB, SEO names) and saves them in
// resizeimages\<sku>\ on this laptop, replacing the photos already in that
// folder. Each product is converted fully before its folder is touched.
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (!existsSync(path.dirname(RESIZE_OUTPUT_DIR))) {
      return NextResponse.json({ error: `Saving photos works only on the laptop admin — ${path.dirname(RESIZE_OUTPUT_DIR)} not found.` }, { status: 400 });
    }
    const { productIds } = await request.json().catch(() => ({}));
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'productIds is required' }, { status: 400 });
    }
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { images: { orderBy: { id: 'asc' } } },
    });

    const results: { sku: string; folder: string; count: number; replaced: number; error?: string }[] = [];
    for (const product of products) {
      const folder = path.join(RESIZE_OUTPUT_DIR, product.sku.toLowerCase());
      try {
        if (product.images.length === 0) throw new Error('no photos on this product');
        const files = await myntraImageFiles(product);
        await fs.mkdir(folder, { recursive: true });
        let replaced = 0;
        for (const existing of await fs.readdir(folder)) {
          if (isImageFileName(existing)) { await fs.rm(path.join(folder, existing), { force: true }); replaced += 1; }
        }
        for (const f of files) await fs.writeFile(path.join(folder, f.name), f.data);
        results.push({ sku: product.sku, folder, count: files.length, replaced });
      } catch (err) {
        results.push({ sku: product.sku, folder, count: 0, replaced: 0, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Save Myntra images error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save Myntra images' }, { status: 500 });
  }
}

// GET /api/admin/myntra/images?productIds=a,b,c (or productId=a) → zip of the
// photos in Myntra format, named by the angle they fill in the Myntra sheet.
// One product → files at the zip root; several → one folder per SKU.
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const params = new URL(request.url).searchParams;
    const productIds = (params.get('productIds') || params.get('productId') || '').split(',').filter(Boolean);
    if (productIds.length === 0) {
      return NextResponse.json({ error: 'productId or productIds is required' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { images: { orderBy: { id: 'asc' } } },
    });
    if (products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const noImages = products.filter((p) => p.images.length === 0).map((p) => p.sku);
    if (noImages.length > 0) {
      return NextResponse.json({ error: `No images for: ${noImages.join(', ')}` }, { status: 400 });
    }

    const zip = new JSZip();
    for (const product of products) {
      const folder = products.length > 1 ? zip.folder(product.sku.toLowerCase())! : zip;
      try {
        for (const file of await myntraImageFiles(product)) folder.file(file.name, file.data);
      } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Image fetch failed' }, { status: 502 });
      }
    }

    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    const filename = products.length === 1
      ? `Myntra-Images-${products[0].sku}.zip`
      : `Myntra-Images-${products.length}-products.zip`;
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Myntra images error:', error);
    return NextResponse.json({ error: 'Failed to prepare Myntra images' }, { status: 500 });
  }
}
