import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const staff = await prisma.user.findMany({
    where: { role: 'STAFF' },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, staff });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { name, email, phone, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

  const hashed = await hashPassword(password);
  const staff = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase().trim(),
      phone: phone || null,
      password: hashed,
      role: 'STAFF',
    },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });

  return NextResponse.json({ success: true, staff }, { status: 201 });
}
