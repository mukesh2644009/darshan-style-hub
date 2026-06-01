import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/pos/customers?phone=XXXXXXXXXX
// Look up a returning customer by mobile number from past POS orders
export async function GET(request: Request) {
  const auth = await requireStaff();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone')?.replace(/\D/g, '');

  if (!phone || phone.length < 10) {
    return NextResponse.json({ found: false });
  }

  // Find most recent POS order with this phone number
  const order = await prisma.order.findFirst({
    where: { source: 'POS', shippingPhone: { contains: phone } },
    orderBy: { createdAt: 'desc' },
    select: {
      shippingName: true,
      shippingPhone: true,
      shippingAddress: true,
    },
  });

  if (!order) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    customer: {
      name: order.shippingName,
      phone: order.shippingPhone,
      address: order.shippingAddress !== 'In-store purchase' ? order.shippingAddress : '',
    },
  });
}
