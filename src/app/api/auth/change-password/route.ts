import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const token = cookies().get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both fields are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const isCorrect = await verifyPassword(currentPassword, session.user.password);
    if (!isCorrect) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);

    // Update password and invalidate all OTHER sessions (keep current session alive)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashed },
      }),
      prisma.session.deleteMany({
        where: {
          userId: session.user.id,
          NOT: { token },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
