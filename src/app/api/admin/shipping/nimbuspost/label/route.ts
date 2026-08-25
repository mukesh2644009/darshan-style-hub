import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getNimbusLoginToken(baseUrl: string): Promise<string | null> {
  const email = process.env.NIMBUSPOST_EMAIL;
  const password = process.env.NIMBUSPOST_PASSWORD;
  if (!email || !password) return null;
  const res = await fetch(`${baseUrl}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => null) as Record<string, unknown> | null;
  if (!json) return null;
  if (typeof json.data === 'string') return json.data;
  return null;
}

export async function GET(request: Request) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const awb = order.awbNumber;
    if (!awb) {
      return NextResponse.json({ success: false, error: 'No AWB number for this order. Sync AWB first.' }, { status: 400 });
    }

    const apiKey = process.env.NIMBUSPOST_API_KEY || '';
    const baseUrl = (process.env.NIMBUSPOST_API_BASE || 'https://api.nimbuspost.com/v1').replace(/\/+$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'NP-API-KEY': apiKey,
      'Authorization': `Bearer ${apiKey}`,
    };

    // NimbusPost label endpoint
    let res = await fetch(`${baseUrl}/shipments/label?awb=${awb}`, { headers });

    if (!res.ok && (res.status === 401 || res.status === 403)) {
      const token = await getNimbusLoginToken(baseUrl);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        res = await fetch(`${baseUrl}/shipments/label?awb=${awb}`, { headers });
      }
    }

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `NimbusPost returned ${res.status}` }, { status: 502 });
    }

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="Label-${awb}.pdf"`,
        },
      });
    }

    // Some Nimbus tenants return a JSON with a label URL
    const json = await res.json() as { data?: { label_url?: string; url?: string }; label_url?: string; url?: string };
    const labelUrl =
      json?.data?.label_url || json?.data?.url || json?.label_url || json?.url;

    if (labelUrl) {
      // Save the label URL so next time it loads directly
      await prisma.order.update({ where: { id: orderId }, data: { labelUrl } });
      return NextResponse.redirect(labelUrl);
    }

    return NextResponse.json({ success: false, error: 'Could not retrieve label from NimbusPost' }, { status: 502 });
  } catch (error) {
    console.error('Label fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch label' }, { status: 500 });
  }
}
