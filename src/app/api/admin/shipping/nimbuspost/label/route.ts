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

function deepFindStringByKeys(value: unknown, keys: string[], maxDepth = 6): string | undefined {
  if (maxDepth < 0 || value == null) return undefined;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const key of keys) {
      const candidate = obj[key];
      if (typeof candidate === 'string' && candidate.trim()) return candidate;
    }
    for (const nested of Object.values(obj)) {
      const found = deepFindStringByKeys(nested, keys, maxDepth - 1);
      if (found) return found;
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' && item.trim()) return item;
      const found = deepFindStringByKeys(item, keys, maxDepth - 1);
      if (found) return found;
    }
  }
  return undefined;
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

    const applyLoginFallback = async () => {
      const token = await getNimbusLoginToken(baseUrl);
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return Boolean(token);
    };

    // NimbusPost's documented print-label endpoint: POST /shipments/print
    // with { awb: [awb] }, matching the POST-with-body convention used by
    // every other endpoint in this codebase (create, cancel, track).
    const printPath = process.env.NIMBUSPOST_LABEL_PATH || '/shipments/print';
    let res = await fetch(`${baseUrl}${printPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ awb: [awb] }),
    });

    if (!res.ok && (res.status === 401 || res.status === 403)) {
      if (await applyLoginFallback()) {
        res = await fetch(`${baseUrl}${printPath}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ awb: [awb] }),
        });
      }
    }

    // Fall back to the older GET-with-query-param shape some Nimbus tenants use.
    if (!res.ok) {
      res = await fetch(`${baseUrl}/shipments/label?awb=${awb}`, { headers });
      if (!res.ok && (res.status === 401 || res.status === 403) && headers['Authorization'] === `Bearer ${apiKey}`) {
        if (await applyLoginFallback()) {
          res = await fetch(`${baseUrl}/shipments/label?awb=${awb}`, { headers });
        }
      }
    }

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      console.error(`NimbusPost label fetch failed (${res.status}):`, bodyText);
      return NextResponse.json(
        { success: false, error: `NimbusPost returned ${res.status}`, nimbusResponse: bodyText.slice(0, 2000) },
        { status: 502 }
      );
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

    const json = await res.json().catch(() => null) as Record<string, unknown> | null;
    const labelUrl = json ? deepFindStringByKeys(json, ['label_url', 'labelUrl', 'url', 'label', 'label_link']) : undefined;

    if (labelUrl) {
      // Save the label URL so next time it loads directly
      await prisma.order.update({ where: { id: orderId }, data: { labelUrl } });
      return NextResponse.redirect(labelUrl);
    }

    return NextResponse.json(
      { success: false, error: 'Could not retrieve label from NimbusPost', raw: json },
      { status: 502 }
    );
  } catch (error) {
    console.error('Label fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch label' }, { status: 500 });
  }
}
