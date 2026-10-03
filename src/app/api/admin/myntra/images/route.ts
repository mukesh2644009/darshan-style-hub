import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { absoluteImageUrl, categorizeProductImages } from '@/lib/productImageCategorization';

export const dynamic = 'force-dynamic';

// Same spec as DarshanAutomation's imaging.js: 1080x1440 stretched to fit,
// JPEG stepping quality down from 85 until <= 500 KB (floor 30), saved as .jpg.
const WIDTH = 1080;
const HEIGHT = 1440;
const TARGET_KB = 500;

async function toMyntraJpeg(source: Buffer): Promise<Buffer> {
  let quality = 85;
  let out: Buffer;
  do {
    out = await sharp(source).resize(WIDTH, HEIGHT, { fit: 'fill' }).jpeg({ quality }).toBuffer();
    quality -= 10;
  } while (out.length / 1024 > TARGET_KB && quality >= 30);
  return out;
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
      const sku = product.sku.toLowerCase();
      const folder = products.length > 1 ? zip.folder(sku)! : zip;
      const c = categorizeProductImages(product.images);
      const angles: [string, string][] = [
        ['front', c.front],
        ['side', c.side],
        ['back', c.back],
        ['detail', c.detail],
        ['lookshot', c.lookShot],
        ...c.additional.map((url, i): [string, string] => [`additional-${i + 1}`, url]),
      ];
      let n = 0;
      for (const [angle, url] of angles) {
        if (!url) continue;
        const res = await fetch(absoluteImageUrl(url));
        if (!res.ok) {
          return NextResponse.json({ error: `${product.sku}: could not fetch ${angle} image (HTTP ${res.status})` }, { status: 502 });
        }
        const jpeg = await toMyntraJpeg(Buffer.from(await res.arrayBuffer()));
        n += 1;
        folder.file(`${sku}_${n}_${angle}.jpg`, jpeg);
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
