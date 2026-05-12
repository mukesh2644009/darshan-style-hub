type NimbusAuthResponse = {
  status?: boolean;
  data?: string | { token?: string };
  token?: string;
  message?: string;
};

type NimbusCreateShipmentInput = {
  orderNumber: string;
  paymentMode: 'COD' | 'PREPAID';
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  deadWeightGrams: number;
};

export type NimbusCreateShipmentResult = {
  shipmentId?: string;
  awbNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  labelUrl?: string;
  raw: unknown;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getBaseUrl(): string {
  return (process.env.NIMBUSPOST_API_BASE || 'https://api.nimbuspost.com').replace(/\/+$/, '');
}

function getLoginPath(): string {
  return process.env.NIMBUSPOST_LOGIN_PATH || '/v1/users/login';
}

function getCreateShipmentPath(): string {
  return process.env.NIMBUSPOST_CREATE_SHIPMENT_PATH || '/v1/shipments';
}

function getCancelShipmentPathTemplate(): string {
  return process.env.NIMBUSPOST_CANCEL_SHIPMENT_PATH_TEMPLATE || '/v1/shipments/{shipmentId}/cancel';
}

function joinUrl(base: string, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function normalizeAuthToken(data: NimbusAuthResponse): string {
  if (typeof data.data === 'string' && data.data) return data.data;
  if (data.token) return data.token;
  if (typeof data.data === 'object' && data.data?.token) return data.data.token;
  throw new Error('NimbusPost auth token missing in response');
}

async function nimbusFetch<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`NimbusPost API failed (${response.status}): ${JSON.stringify(json)}`);
  }
  return json as T;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^91/, '');
}

function resolveAddressLine(address: string): { addressLine1: string; addressLine2: string } {
  const cleaned = address.trim();
  if (cleaned.length <= 64) {
    return { addressLine1: cleaned, addressLine2: '' };
  }
  return {
    addressLine1: cleaned.slice(0, 64),
    addressLine2: cleaned.slice(64, 128),
  };
}

function mapShipmentResponse(raw: Record<string, unknown>): NimbusCreateShipmentResult {
  const data = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Record<string, unknown>;
  return {
    shipmentId: (data.shipment_id || data.shipmentId || data.order_id || data.orderId) as string | undefined,
    awbNumber: (data.awb_number || data.awb || data.awbNumber || data.tracking_number) as string | undefined,
    courierName: (data.courier_name || data.courier || data.partner_name) as string | undefined,
    trackingUrl: (data.tracking_url || data.trackingUrl) as string | undefined,
    labelUrl: (data.label_url || data.labelUrl || data.label) as string | undefined,
    raw,
  };
}

export async function getNimbusAuthToken(): Promise<string> {
  const email = getRequiredEnv('NIMBUSPOST_EMAIL');
  const password = getRequiredEnv('NIMBUSPOST_PASSWORD');
  const url = joinUrl(getBaseUrl(), getLoginPath());

  const auth = await nimbusFetch<NimbusAuthResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return normalizeAuthToken(auth);
}

export async function createNimbusShipment(input: NimbusCreateShipmentInput): Promise<NimbusCreateShipmentResult> {
  const token = await getNimbusAuthToken();
  const url = joinUrl(getBaseUrl(), getCreateShipmentPath());
  const { addressLine1, addressLine2 } = resolveAddressLine(input.address);

  // Allow complete payload override for Nimbus account-specific contract differences.
  const payload = process.env.NIMBUSPOST_CREATE_SHIPMENT_PAYLOAD_MODE === 'raw'
    ? {
        order_number: input.orderNumber,
        payment_mode: input.paymentMode,
        total_amount: input.amount,
        customer_name: input.customerName,
        customer_mobile: normalizePhone(input.customerPhone),
        customer_email: input.customerEmail || '',
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        dead_weight: Number((input.deadWeightGrams / 1000).toFixed(3)),
        products: input.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku || '',
        })),
      }
    : {
        orderNumber: input.orderNumber,
        paymentMode: input.paymentMode,
        amount: input.amount,
        customer: {
          name: input.customerName,
          phone: normalizePhone(input.customerPhone),
          email: input.customerEmail || '',
        },
        address: {
          line1: addressLine1,
          line2: addressLine2,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
        },
        parcel: {
          deadWeightKg: Number((input.deadWeightGrams / 1000).toFixed(3)),
        },
        items: input.items,
      };

  const raw = await nimbusFetch<Record<string, unknown>>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return mapShipmentResponse(raw);
}

export async function cancelNimbusShipment(shipmentId: string): Promise<unknown> {
  const token = await getNimbusAuthToken();
  const template = getCancelShipmentPathTemplate();
  const path = template.replace('{shipmentId}', shipmentId);
  const url = joinUrl(getBaseUrl(), path);
  return nimbusFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

