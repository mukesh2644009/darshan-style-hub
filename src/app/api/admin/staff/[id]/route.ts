import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await prisma.user.delete({ where: { id: params.id, role: 'STAFF' } });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { name, phone, password } = await request.json();
  const data: Record<string, string> = {};
  if (name) data.name = name;
  if (phone) data.phone = phone;
  if (password) data.password = await hashPassword(password);

  const staff = await prisma.user.update({
    where: { id: params.id, role: 'STAFF' },
    data,
    select: { id: true, name: true, email: true, phone: true },
  });

  return NextResponse.json({ success: true, staff });
}
