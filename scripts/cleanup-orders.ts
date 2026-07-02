import * as fs from 'fs';
import * as path from 'path';

const envFile = path.resolve('.env.local');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}

(async () => {
  const { prisma } = await import('../src/lib/prisma');

  const orders = await prisma.order.findMany({
    select: { id: true, shippingName: true, status: true, total: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n📋 All orders in database:');
  console.table(orders.map(o => ({
    id: o.id.slice(0, 12),
    name: o.shippingName,
    status: o.status,
    total: o.total,
    date: o.createdAt.toLocaleDateString(),
  })));

  if (orders.length === 0) {
    console.log('✅ No orders found — database is clean!');
    await prisma.$disconnect();
    return;
  }

  // Delete all test orders (mukesh kumar / confirmed / old)
  const deleted = await prisma.order.deleteMany({});
  console.log(`\n🗑  Deleted ${deleted.count} order(s).`);

  await prisma.$disconnect();
  console.log('✅ Done — database is clean!');
})().catch(console.error);
