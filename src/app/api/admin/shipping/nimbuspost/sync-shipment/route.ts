import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

function getBaseUrl(): string {
  return (process.env.NIMBUSPOST_API_BASE || 'https://api.nimbuspost.com/v1').replace(/\/+$/, '');
}

function deepFindStringByKeys(value: unknown, keys: string[], maxDepth = 6): string | undefined {
  if (maxDepth < 0 || value == null) return undefined;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const key of keys) {
      const candidate = obj[key];
      if (typeof candidate === 'string' && candidate.trim()) return candidate;
      if (typeof candidate === 'number') return String(candidate);
    }
    for (const nested of Object.values(obj)) {
      const found = deepFindStringByKeys(nested, keys, maxDepth - 1);
      if (found) return found;
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = deepFindStringByKeys(item, keys, maxDepth - 1);
      if (found) return found;
    }
  }
  return undefined;
}

async function getNimbusToken(): Promise<string | null> {
  const email = process.env.NIMBUSPOST_EMAIL;
  const password = process.env.NIMBUSPOST_PASSWORD;
  if (!email || !password) return null;
  const res = await fetch(`${getBaseUrl()}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => null) as Record<string, unknown> | null;
  if (!json) return null;
  if (typeof json.data === 'string') return json.data;
  return null;
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdmin();
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const orderId = typeof body.orderId === 'string' ? body.orderId : '';
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, shipmentId: true, awbNumber: true, shippingPartner: true },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const apiKey = process.env.NIMBUSPOST_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'NIMBUSPOST_API_KEY not configured' }, { status: 500 });
    }

    const token = await getNimbusToken();
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'NP-API-KEY': apiKey,
    };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    // Try fetching by order_number (our orderId) from Nimbus orders endpoint
    const searchUrl = `${getBaseUrl()}/orders?search=${encodeURIComponent(orderId)}`;
    const searchRes = await fetch(searchUrl, { headers: authHeaders });
    const searchJson = await searchRes.json().catch(() => null) as Record<string, unknown> | null;

    // Also try fetching shipment directly if we have shipmentId
    let shipmentJson: Record<string, unknown> | null = null;
    if (order.shipmentId) {
      const shipRes = await fetch(`${getBaseUrl()}/shipments/${order.shipmentId}`, { headers: authHeaders });
      shipmentJson = await shipRes.json().catch(() => null) as Record<string, unknown> | null;
    }

    const rawData = shipmentJson || searchJson;
    if (!rawData) {
      return NextResponse.json({ success: false, error: 'No response from Nimbus' }, { status: 502 });
    }

    const awbNumber = deepFindStringByKeys(rawData, ['awb_number', 'awb', 'awbNumber', 'tracking_number', 'waybill']);
    const shipmentId = deepFindStringByKeys(rawData, ['shipment_id', 'shipmentId', 'id', 'order_id']);
    const courierName = deepFindStringByKeys(rawData, ['courier_name', 'courier', 'partner_name', 'courierName']);
    const trackingUrl = deepFindStringByKeys(rawData, ['tracking_url', 'trackingUrl', 'track_url']);
    const labelUrl = deepFindStringByKeys(rawData, ['label_url', 'labelUrl', 'label', 'label_link']);
    const nimbusStatus = deepFindStringByKeys(rawData, ['status', 'shipment_status', 'current_status']);

    const updateData: Record<string, string | null> = {};
    if (awbNumber && !order.awbNumber) updateData.awbNumber = awbNumber;
    if (shipmentId && !order.shipmentId) updateData.shipmentId = shipmentId;
    if (courierName) updateData.courierName = courierName;
    if (trackingUrl) updateData.trackingUrl = trackingUrl;
    if (labelUrl) updateData.labelUrl = labelUrl;
    if (nimbusStatus) updateData.nimbusStatus = nimbusStatus;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...updateData,
        nimbusWebhookPayload: rawData as Prisma.InputJsonValue,
      },
      select: { id: true, awbNumber: true, shipmentId: true, courierName: true, trackingUrl: true, labelUrl: true, nimbusStatus: true },
    });

    return NextResponse.json({
      success: true,
      order: updated,
      awbFound: Boolean(awbNumber),
      message: awbNumber ? `AWB synced: ${awbNumber}` : 'No AWB yet from Nimbus',
      raw: rawData,
    });
  } catch (error) {
    console.error('Nimbus sync shipment error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to sync shipment' },
      { status: 500 }
    );
  }
}
