/**
 * DEV-ONLY: delete a user (and their orders, items, addresses, sessions, etc.) by phone.
 *
 * Refuses to run unless NODE_ENV !== 'production'. Delete this file after use.
 *
 *   curl -X POST http://localhost:3333/api/dev-cleanup-user \
 *     -H 'Content-Type: application/json' \
 *     -d '{"phone":"7567121883"}'
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function normalize(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('091')) return `+${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  return null;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'disabled in production' }, { status: 403 });
  }

  let body: { phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'invalid json' }, { status: 400 });
  }

  const rawPhone = body.phone?.trim();
  if (!rawPhone) {
    return NextResponse.json({ success: false, error: 'phone required' }, { status: 400 });
  }

  const digits = rawPhone.replace(/\D/g, '');
  const normalized = normalize(rawPhone);
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
    include: { orders: { select: { id: true } } },
  });

  if (users.length === 0) {
    return NextResponse.json({ success: true, deleted: 0, message: 'no matching user' });
  }

  const summary: Array<{ id: string; phone: string | null; orders: number }> = [];

  for (const u of users) {
    const orderIds = u.orders.map((o) => o.id);
    await prisma.$transaction(async (tx) => {
      if (orderIds.length) {
        await tx.returnRequest.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      await tx.user.delete({ where: { id: u.id } });
    });
    summary.push({ id: u.id, phone: u.phone, orders: orderIds.length });
  }

  return NextResponse.json({ success: true, deleted: summary.length, summary });
}
