import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  const configured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );

  return NextResponse.json(
    {
      success: true,
      provider: 'twilio',
      environment: process.env.NODE_ENV,
      smsConfigured: configured,
      status: configured ? 'ready' : 'missing_config',
      requiredEnvVars: [
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_PHONE_NUMBER',
      ],
    },
    { status: configured ? 200 : 503 }
  );
}
