/**
 * One-time / occasional backfill: fix known typos in Product name & description (DB content).
 * When a product name changes, regenerates SEO slug to match (see slugify / generateUniqueSlug).
 * Run: DATABASE_URL=... npm run db:fix-typos
 */
import { PrismaClient } from '@prisma/client';
import { slugify, generateUniqueSlug } from '../src/lib/slug';

const prisma = new PrismaClient();

const PAIRS: [string, string][] = [
  ['detalling', 'detailing'],
  ['tussels', 'tassels'],
  ['comfortble', 'comfortable'],
  ['stright', 'straight'],
  ['shillouttle', 'silhouette'],
  ['florar', 'floral'],
];

function fixText(s: string): string {
  let out = s;
  for (const [wrong, right] of PAIRS) {
    out = out.split(wrong).join(right);
  }
  return out;
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, slug: true, name: true, description: true },
    orderBy: { id: 'asc' },
  });

  let slugPool = products.map((p) => p.slug).filter((s): s is string => Boolean(s));

  let n = 0;
  for (const p of products) {
    const name = fixText(p.name);
    const description = fixText(p.description);
    const textChanged = name !== p.name || description !== p.description;
    if (!textChanged) continue;

    let newSlug: string | undefined;
    if (name !== p.name) {
      const poolWithoutThis = slugPool.filter((s) => s !== p.slug);
      const base = slugify(name);
      newSlug = generateUniqueSlug(base, poolWithoutThis);
      slugPool = slugPool.filter((s) => s !== p.slug);
      slugPool.push(newSlug);
    }

    await prisma.product.update({
      where: { id: p.id },
      data: {
        name,
        description,
        ...(newSlug !== undefined ? { slug: newSlug } : {}),
      },
    });
    const slugNote = newSlug ? ` → slug: ${newSlug}` : '';
    console.log(`Updated ${p.sku}: ${p.name.slice(0, 48)}${p.name.length > 48 ? '…' : ''}${slugNote}`);
    n += 1;
  }
  console.log(n === 0 ? 'No matching typos found.' : `Done. ${n} product(s) updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
