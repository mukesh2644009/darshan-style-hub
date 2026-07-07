import { NextResponse } from 'next/server';
import { sendConversionEvent } from '@/lib/facebook-capi';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventName, eventSourceUrl, customData, eventId } = body;

    if (!eventName) {
      return NextResponse.json({ error: 'eventName required' }, { status: 400 });
    }

    // Real client IP — Vercel sets x-forwarded-for
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || '';
    const ua = request.headers.get('user-agent') || '';

    // _fbc and _fbp cookies are critical for CAPI match quality.
    // The client reads them from document.cookie and sends them in the POST body.
    // Without these, Meta can only match on hashed email/phone.
    const userData = {
      clientIpAddress: ip,
      clientUserAgent: ua,
      ...(body.email && { email: body.email }),
      ...(body.phone && { phone: body.phone }),
      ...(body.fbc && { fbc: body.fbc }),
      ...(body.fbp && { fbp: body.fbp }),
      ...(body.externalId && { externalId: body.externalId }),
    };

    sendConversionEvent(
      eventName,
      eventSourceUrl || 'https://www.darshanstylehub.com',
      userData,
      customData,
      eventId
    ).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
