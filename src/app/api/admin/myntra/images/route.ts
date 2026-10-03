import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { myntraImageFiles } from '@/lib/myntraImageFiles';

export const dynamic = 'force-dynamic';

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
