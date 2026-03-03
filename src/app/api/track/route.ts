import { NextResponse } from 'next/server';
import { sendConversionEvent } from '@/lib/facebook-capi';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventName, eventSourceUrl, customData, eventId } = body;

    if (!eventName) {
      return NextResponse.json({ error: 'eventName required' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const ua = request.headers.get('user-agent') || '';

    const userData = {
      clientIpAddress: ip,
      clientUserAgent: ua,
      ...(body.email && { email: body.email }),
      ...(body.phone && { phone: body.phone }),
    };

    sendConversionEvent(
      eventName,
      eventSourceUrl || 'https://darshanstylehub.com',
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
