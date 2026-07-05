/**
 * compress-images.mjs
 *
 * Converts all PNG/JPEG source images in public/ to WebP (and optionally AVIF).
 * Run once before deployment or in CI to shrink the raw source files.
 *
 * Note: Next.js already converts images to AVIF/WebP at runtime via /_next/image.
 * Compressing the SOURCE files gives an extra win:
 *   - Faster first-time optimisation (sharp processes a 200 KB WebP faster than a 1 MB PNG)
 *   - Smaller git repo / Docker image
 *   - Smaller CDN origin storage
 *
 * Usage:
 *   npm install --save-dev sharp   (one-time)
 *   node scripts/compress-images.mjs
 *
 * Options (edit below):
 *   QUALITY_WEBP  – 1–100, default 82
 *   QUALITY_AVIF  – 1–100, default 60  (lower = smaller; 60 is visually lossless for photos)
 *   MAX_WIDTH     – resize wider images to this max width (px), 0 = no resize
 *   DIRS          – directories to scan (relative to project root)
 */

import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('❌  sharp is not installed. Run: npm install --save-dev sharp');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Config ───────────────────────────────────────────────────────────────────
const QUALITY_WEBP = 82;
const QUALITY_AVIF = 60;
const MAX_WIDTH = 1920;  // 0 = never resize
const DIRS = [
  'public/Banners',
  'public/products/categories',
  // Uncomment to compress product images too (will take longer):
  // 'public/products/kurtis',
  // 'public/products/suits',
  // 'public/products/co-ord-sets',
  // 'public/products/sarees',
  // 'public/products/kurti',
  // 'public/products/tops',
];
const EXTS = ['.png', '.jpg', '.jpeg'];
// ─────────────────────────────────────────────────────────────────────────────

async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!EXTS.includes(ext)) return;

  const originalSize = fs.statSync(filePath).size;
  let img = sharp(filePath);

  if (MAX_WIDTH > 0) {
    const meta = await img.metadata();
    if (meta.width && meta.width > MAX_WIDTH) {
      img = img.resize(MAX_WIDTH, null, { withoutEnlargement: true });
    }
  }

  const webpPath = filePath.replace(/\.(png|jpe?g)$/i, '.webp');
  const avifPath = filePath.replace(/\.(png|jpe?g)$/i, '.avif');

  await img.clone().webp({ quality: QUALITY_WEBP }).toFile(webpPath);
  const webpSize = fs.statSync(webpPath).size;
  const webpSaving = (((originalSize - webpSize) / originalSize) * 100).toFixed(1);

  await img.clone().avif({ quality: QUALITY_AVIF }).toFile(avifPath);
  const avifSize = fs.statSync(avifPath).size;
  const avifSaving = (((originalSize - avifSize) / originalSize) * 100).toFixed(1);

  const kb = (b) => `${(b / 1024).toFixed(0)} KB`;
  console.log(
    `✓ ${path.relative(ROOT, filePath)}\n` +
    `    original ${kb(originalSize)}  →  WebP ${kb(webpSize)} (${webpSaving}% smaller)  |  AVIF ${kb(avifSize)} (${avifSaving}% smaller)`
  );
}

async function walkDir(dir) {
  const full = path.resolve(ROOT, dir);
  if (!fs.existsSync(full)) {
    console.warn(`⚠  Directory not found, skipping: ${dir}`);
    return;
  }
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const entryPath = path.join(full, entry.name);
    if (entry.isDirectory()) {
      await walkDir(path.relative(ROOT, entryPath));
    } else {
      await processFile(entryPath);
    }
  }
}

console.log('🖼  Compressing images…\n');
for (const dir of DIRS) {
  await walkDir(dir);
}
console.log('\n✅  Done. Commit the generated .webp and .avif files.');
console.log(
  '\n📌  Next step: update HeroCarousel to use <source type="image/avif"> / <source type="image/webp">\n' +
  '    OR rely on Next.js /_next/image which already serves AVIF/WebP automatically.'
);
