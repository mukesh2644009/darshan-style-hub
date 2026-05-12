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

type NimbusLoginResponse = {
  status?: boolean;
  message?: string;
  data?: string | { token?: string; access_token?: string };
  token?: string;
  access_token?: string;
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
  return (process.env.NIMBUSPOST_API_BASE || 'https://api.nimbuspost.com/v1').replace(/\/+$/, '');
}

function getCreateShipmentPath(): string {
  return process.env.NIMBUSPOST_CREATE_SHIPMENT_PATH || '/shipments';
}

function getCancelShipmentPathTemplate(): string {
  return process.env.NIMBUSPOST_CANCEL_SHIPMENT_PATH_TEMPLATE || '/shipments/cancel';
}

function getTestConnectionPath(): string {
  return process.env.NIMBUSPOST_TEST_CONNECTION_PATH || '/couriers';
}

function getTestConnectionPaths(): string[] {
  const custom = process.env.NIMBUSPOST_TEST_CONNECTION_PATHS;
  if (custom) {
    return custom
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [getTestConnectionPath(), '/shipments', '/orders'];
}

function getLoginPath(): string {
  return process.env.NIMBUSPOST_LOGIN_PATH || '/users/login';
}

function getNimbusAuthHeaders(apiKey: string): HeadersInit {
  // Nimbus accounts can be configured on different auth gateways.
  // Send both common variants for compatibility.
  return {
    'Content-Type': 'application/json',
    'NP-API-KEY': apiKey,
    Authorization: `Bearer ${apiKey}`,
  };
}

function joinUrl(base: string, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function parseNimbusToken(data: NimbusLoginResponse): string | null {
  if (typeof data.data === 'string' && data.data) return data.data;
  if (data.token) return data.token;
  if (data.access_token) return data.access_token;
  if (typeof data.data === 'object' && data.data) {
    if (data.data.token) return data.data.token;
    if (data.data.access_token) return data.data.access_token;
  }
  return null;
}

async function getNimbusLoginToken(): Promise<string | null> {
  const email = process.env.NIMBUSPOST_EMAIL;
  const password = process.env.NIMBUSPOST_PASSWORD;
  if (!email || !password) return null;

  const loginUrl = joinUrl(getBaseUrl(), getLoginPath());
  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = (await response.json().catch(() => null)) as NimbusLoginResponse | null;
  if (!response.ok || !json) return null;
  return parseNimbusToken(json);
}

async function nimbusFetch<T>(
  url: string,
  init: RequestInit,
  options?: { allowLoginFallback?: boolean; apiKey?: string }
): Promise<T> {
  const response = await fetch(url, init);
  let json: unknown = await response.json().catch(() => null);

  if (!response.ok && options?.allowLoginFallback && (response.status === 401 || response.status === 403)) {
    const token = await getNimbusLoginToken();
    if (token) {
      const retryHeaders: Record<string, string> = {
        ...((init.headers as Record<string, string>) || {}),
        Authorization: `Bearer ${token}`,
      };
      if (options.apiKey) {
        retryHeaders['NP-API-KEY'] = options.apiKey;
      }

      const retryResponse = await fetch(url, {
        ...init,
        headers: retryHeaders,
      });
      json = await retryResponse.json().catch(() => null);
      if (!retryResponse.ok) {
        throw new Error(`NimbusPost API failed (${retryResponse.status}): ${JSON.stringify(json)}`);
      }
      return json as T;
    }
  }

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
  // Backward-compatibility no-op for legacy callers.
  // Nimbus v1 prefers NP-API-KEY header on each request.
  return '';
}

export async function createNimbusShipment(input: NimbusCreateShipmentInput): Promise<NimbusCreateShipmentResult> {
  const apiKey = getRequiredEnv('NIMBUSPOST_API_KEY');
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
    headers: getNimbusAuthHeaders(apiKey),
    body: JSON.stringify(payload),
  }, { allowLoginFallback: true, apiKey });

  return mapShipmentResponse(raw);
}

export async function cancelNimbusShipment(awb: string): Promise<unknown> {
  const apiKey = getRequiredEnv('NIMBUSPOST_API_KEY');
  const url = joinUrl(getBaseUrl(), getCancelShipmentPathTemplate());
  return nimbusFetch(url, {
    method: 'POST',
    headers: getNimbusAuthHeaders(apiKey),
    body: JSON.stringify({ awb }),
  }, { allowLoginFallback: true, apiKey });
}

export async function testNimbusConnection(): Promise<{ ok: boolean; message: string; raw?: unknown }> {
  const apiKey = getRequiredEnv('NIMBUSPOST_API_KEY');

  // If API-user credentials are configured, test login first.
  // Some Nimbus tenants can return 403 on list endpoints despite valid credentials.
  const email = process.env.NIMBUSPOST_EMAIL;
  const password = process.env.NIMBUSPOST_PASSWORD;
  if (email && password) {
    try {
      const token = await getNimbusLoginToken();
      if (token) {
        return {
          ok: true,
          message: 'NimbusPost API connection successful via API user login',
          raw: { login: 'ok' },
        };
      }
    } catch (error) {
      return {
        ok: false,
        message: 'NimbusPost login-token authentication failed',
        raw: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const paths = getTestConnectionPaths();

  let lastError: { message: string; raw?: unknown } = { message: 'NimbusPost connection failed' };

  for (const path of paths) {
    const url = joinUrl(getBaseUrl(), path);
    try {
      const result = await nimbusFetch<unknown>(
        url,
        {
          method: 'GET',
          headers: getNimbusAuthHeaders(apiKey),
        },
        { allowLoginFallback: true, apiKey }
      );
      return {
        ok: true,
        message: `NimbusPost API connection successful via ${path}`,
        raw: result,
      };
    } catch (error) {
      lastError = {
        message: `NimbusPost test failed on ${path}`,
        raw: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return { ok: false, message: lastError.message, raw: lastError.raw };
}

