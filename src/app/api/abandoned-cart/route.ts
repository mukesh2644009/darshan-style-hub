import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Debug endpoint: GET ?test=true creates a dummy cart to verify DB writes work
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('test') !== 'true') {
    const total = await prisma.abandonedCart.count();
    return NextResponse.json({ totalCartsInDb: total });
  }

  const email = searchParams.get('email') || 'test@example.com';
  try {
    const cart = await prisma.abandonedCart.create({
      data: {
        email,
        name: 'Test User',
        items: [
          { product: { id: 'test1', name: 'Test Saree', price: 1199, images: [], category: 'Sarees' }, quantity: 1, selectedSize: 'Free Size', selectedColor: 'Blue' },
        ],
        total: 1199,
      },
    });
    return NextResponse.json({ success: true, created: cart.id });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'create failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, name, phone, items, total } = await request.json();

    if (!email || !items?.length) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Upsert: if same email already has a PENDING cart, update it; else create new
    const existing = await prisma.abandonedCart.findFirst({
      where: { email, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await prisma.abandonedCart.update({
        where: { id: existing.id },
        data: { items, total, name: name || existing.name, phone: phone || existing.phone, updatedAt: new Date() },
      });
    } else {
      await prisma.abandonedCart.create({
        data: { email, name, phone, items, total },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Abandoned cart save error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'save failed' }, { status: 500 });
  }
}
