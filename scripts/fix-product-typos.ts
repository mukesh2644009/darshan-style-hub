/**
 * One-time / occasional backfill: fix known typos in Product name & description (DB content).
 * Run after deploy: DATABASE_URL=... npm run db:fix-typos
 */
import { PrismaClient } from '@prisma/client';

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
    select: { id: true, sku: true, name: true, description: true },
  });
  let n = 0;
  for (const p of products) {
    const name = fixText(p.name);
    const description = fixText(p.description);
    if (name !== p.name || description !== p.description) {
      await prisma.product.update({
        where: { id: p.id },
        data: { name, description },
      });
      console.log(`Updated ${p.sku}: ${p.name.slice(0, 56)}${p.name.length > 56 ? '…' : ''}`);
      n += 1;
    }
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
