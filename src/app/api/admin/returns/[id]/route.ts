import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const VALID = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'] as const;
type ReturnStatus = (typeof VALID)[number];

function isValidStatus(s: string): s is ReturnStatus {
  return VALID.includes(s as ReturnStatus);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const status = typeof body.status === 'string' ? body.status.trim() : '';
    const adminNotes =
      typeof body.adminNotes === 'string' ? body.adminNotes.trim().slice(0, 2000) : undefined;

    if (!status || !isValidStatus(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const existing = await prisma.returnRequest.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Return request not found' },
        { status: 404 }
      );
    }

    // Sensible transitions: allow any admin override but warn in UI; block only if already COMPLETED and trying to go backwards without meaning — keep simple: allow all updates from admin

    const updated = await prisma.returnRequest.update({
      where: { id: params.id },
      data: {
        status,
        ...(adminNotes !== undefined ? { adminNotes: adminNotes || null } : {}),
      },
    });

    return NextResponse.json({ success: true, returnRequest: updated });
  } catch (error) {
    console.error('Admin return PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update return request' },
      { status: 500 }
    );
  }
}
