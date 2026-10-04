import sharp from 'sharp';
import { absoluteImageUrl, categorizeProductImages } from './productImageCategorization';

// Myntra photo spec, same as DarshanAutomation's imaging.js: 1080x1440
// stretched to fit, JPEG stepping quality down from 85 until <= 500 KB
// (floor 30), saved as .jpg. Server-only (sharp).
const WIDTH = 1080;
const HEIGHT = 1440;
const TARGET_KB = 500;

// Local folder the resized photos go to (one subfolder per SKU), as before.
export const RESIZE_OUTPUT_DIR = process.env.RESIZE_IMAGES_DIR || 'C:\\Users\\91973\\Documents\\2026\\resizeimages';

// Same SEO file naming as the hang-tag app's resized photos:
// "<title-slug>_<angle>_<sku>.jpg", e.g.
// "olive-jamdani-weave-kurta-pant-set-…_main_photo_dsh_su_04.jpg".
const slugify = (s: string) => s.toLowerCase().trim().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const skuFormat = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

export function myntraPhotoName(title: string, angle: string, sku: string, n?: number): string {
  return `${slugify(title).slice(0, 120)}_${skuFormat(angle)}_${skuFormat(sku)}${n ? `_${n}` : ''}.jpg`;
}

export async function toMyntraJpeg(source: Buffer): Promise<Buffer> {
  let quality = 85;
  let out: Buffer;
  do {
    out = await sharp(source).resize(WIDTH, HEIGHT, { fit: 'fill' }).jpeg({ quality }).toBuffer();
    quality -= 10;
  } while (out.length / 1024 > TARGET_KB && quality >= 30);
  return out;
}

/**
 * Fetches a product's photos and converts each to Myntra format, with the same
 * SEO names as "Convert as per Myntra" (hang-tag style):
 * `<title>_main_photo_<sku>.jpg`, `…_back_side_photo_…`, `…_other_<sku>_2.jpg`.
 */
export async function myntraImageFiles(product: { sku: string; name: string; images: { url: string }[] }): Promise<{ name: string; data: Buffer }[]> {
  const c = categorizeProductImages(product.images);
  const angles: [string, string][] = [
    ['main_photo', c.front],
    ['side_photo', c.side],
    ['back_side_photo', c.back],
    ['detail_photo', c.detail],
    ['lifestyle_photo', c.lookShot],
    ...c.additional.map((url): [string, string] => ['other', url]),
  ];
  const used = new Set<string>();
  const files: { name: string; data: Buffer }[] = [];
  for (const [angle, url] of angles) {
    if (!url) continue;
    const res = await fetch(absoluteImageUrl(url));
    if (!res.ok) throw new Error(`${product.sku}: could not fetch ${angle} image (HTTP ${res.status})`);
    let name = myntraPhotoName(product.name, angle, product.sku);
    for (let n = 2; used.has(name); n++) name = myntraPhotoName(product.name, angle, product.sku, n);
    used.add(name);
    files.push({ name, data: await toMyntraJpeg(Buffer.from(await res.arrayBuffer())) });
  }
  return files;
}

/** Image files in a SKU folder (what "replace" clears before writing a fresh set). */
export function isImageFileName(name: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(name);
}
