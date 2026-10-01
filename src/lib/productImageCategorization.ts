import { normalizeProductImageUrl } from './productImageUrl';

const SITE_BASE_URL = 'https://www.darshanstylehub.com';

export function absoluteImageUrl(url: string | undefined): string {
  if (!url) return '';
  const normalized = normalizeProductImageUrl(url);
  if (!normalized) return '';
  return /^https?:\/\//i.test(normalized) ? normalized : `${SITE_BASE_URL}${normalized}`;
}

export interface CategorizedImages {
  front: string;
  side: string;
  back: string;
  detail: string;
  lookShot: string;
  additional: string[];
}

/**
 * Marketplace listing templates (Myntra, Flipkart, ...) want specific image
 * angles (Front/Side/Back/Detail/Look Shot) in fixed columns, but our own
 * upload order doesn't guarantee that layout. Filenames from the product photo
 * shoot carry angle hints (e.g. "..._back_side_photo_...", "..._detail_photo_..."),
 * use those to place each image in the right column, falling back to upload
 * order only when no filename gives a hint at all. "back" is checked before
 * "side" so a file like "back_side_photo" (a back-angle shot) lands in Back,
 * not Side. Shared across every marketplace export — do not duplicate.
 */
export function categorizeProductImages(images: { url: string }[]): CategorizedImages {
  const result: CategorizedImages = { front: '', side: '', back: '', detail: '', lookShot: '', additional: [] };
  const unmatched: string[] = [];

  for (const img of images) {
    const name = (img.url.split('/').pop() || '').toLowerCase();
    if (!result.back && /back/.test(name)) {
      result.back = img.url;
    } else if (!result.front && /(front|main)/.test(name)) {
      result.front = img.url;
    } else if (!result.side && /side/.test(name)) {
      result.side = img.url;
    } else if (!result.detail && /detail/.test(name)) {
      result.detail = img.url;
    } else if (!result.lookShot && /(lifestyle|look)/.test(name)) {
      result.lookShot = img.url;
    } else {
      unmatched.push(img.url);
    }
  }

  const anyKeywordMatched = result.front || result.side || result.back || result.detail || result.lookShot;
  if (!anyKeywordMatched && images.length > 0) {
    const urls = images.map((i) => i.url);
    const [first, second, third, fourth, fifth, ...rest] = urls;
    result.front = first || '';
    result.side = second || '';
    result.back = third || '';
    result.detail = fourth || '';
    result.lookShot = fifth || '';
    result.additional = rest;
  } else {
    if (!result.front && images.length > 0) result.front = images[0].url;
    result.additional = unmatched.filter((u) => u !== result.front);
  }

  // Guarantee absolute URLs regardless of how the underlying image was
  // stored — some older products (e.g. DSH_KP_03) still have relative local
  // paths (/products/...) rather than a full Cloudinary URL, and this
  // function previously returned those raw, producing broken image links in
  // marketplace exports (confirmed via a real Flipkart QC check, 2026-09-27).
  result.front = absoluteImageUrl(result.front);
  result.side = absoluteImageUrl(result.side);
  result.back = absoluteImageUrl(result.back);
  result.detail = absoluteImageUrl(result.detail);
  result.lookShot = absoluteImageUrl(result.lookShot);
  result.additional = result.additional.map((u) => absoluteImageUrl(u));

  return result;
}
