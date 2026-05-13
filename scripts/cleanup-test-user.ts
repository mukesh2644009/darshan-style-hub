/**
 * One-off helper to inspect / delete a test customer by phone.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/cleanup-test-user.ts <phone>             # inspect only (dry run)
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/cleanup-test-user.ts <phone> --delete    # actually delete
 *
 * Phone can be any Indian format: 7567121883, +917567121883, 917567121883.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalize(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('091')) return `+${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  return null;
}

async function main() {
  const rawPhone = process.argv[2];
  const doDelete = process.argv.includes('--delete');

  if (!rawPhone) {
    console.error('Usage: cleanup-test-user.ts <phone> [--delete]');
    process.exit(1);
  }

  const digits = rawPhone.replace(/\D/g, '');
  const normalized = normalize(rawPhone);

  // Match every plausible stored form
  const candidates = Array.from(
    new Set(
      [
        rawPhone,
        digits,
        normalized,
        `+91${digits.slice(-10)}`,
        `91${digits.slice(-10)}`,
        `0${digits.slice(-10)}`,
        digits.slice(-10),
      ].filter(Boolean) as string[]
    )
  );

  const users = await prisma.user.findMany({
    where: { phone: { in: candidates } },
    include: {
      addresses: true,
      sessions: true,
      cartItems: true,
      wishlist: true,
      orders: { include: { items: true } },
      returnRequests: true,
    },
  });

  if (users.length === 0) {
    console.log(`No user found for phone variants: ${candidates.join(', ')}`);
    return;
  }

  for (const u of users) {
    console.log('━'.repeat(60));
    console.log(`User      : ${u.name ?? '(no name)'}  (id: ${u.id})`);
    console.log(`Email     : ${u.email}`);
    console.log(`Phone     : ${u.phone}`);
    console.log(`Role      : ${u.role}`);
    console.log(`Created   : ${u.createdAt.toISOString()}`);
    console.log(`Addresses : ${u.addresses.length}`);
    console.log(`Sessions  : ${u.sessions.length}`);
    console.log(`Cart items: ${u.cartItems.length}`);
    console.log(`Wishlist  : ${u.wishlist.length}`);
    console.log(`Orders    : ${u.orders.length}` + (u.orders.length ? ` (items: ${u.orders.reduce((s, o) => s + o.items.length, 0)})` : ''));
    console.log(`Returns   : ${u.returnRequests.length}`);
  }
  console.log('━'.repeat(60));

  if (!doDelete) {
    console.log('Dry run only. Re-run with --delete to actually remove.');
    return;
  }

  for (const u of users) {
    // Delete in dependency order. Cascade handles addresses / sessions / cart /
    // wishlist / returnRequests when the User row goes, but Order has no
    // cascade, so we clean orders + items explicitly first.
    await prisma.$transaction(async (tx) => {
      const orderIds = u.orders.map((o) => o.id);
      if (orderIds.length) {
        await tx.returnRequest.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      await tx.user.delete({ where: { id: u.id } });
    });
    console.log(`Deleted user ${u.id} (${u.phone}) and ${u.orders.length} order(s).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
