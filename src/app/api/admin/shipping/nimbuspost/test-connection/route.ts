import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { testNimbusConnection } from '@/lib/nimbuspost';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const result = await testNimbusConnection();
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message, details: result.raw },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: result.message, details: result.raw });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'NimbusPost test failed',
      },
      { status: 500 }
    );
  }
}

