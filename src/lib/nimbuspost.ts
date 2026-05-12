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
  const tryLoginFallback = async (): Promise<T | null> => {
    const token = await getNimbusLoginToken();
    if (!token) return null;

    const retryHeaders: Record<string, string> = {
      ...((init.headers as Record<string, string>) || {}),
      Authorization: `Bearer ${token}`,
    };
    if (options?.apiKey) {
      retryHeaders['NP-API-KEY'] = options.apiKey;
    }

    const retryResponse = await fetch(url, {
      ...init,
      headers: retryHeaders,
    });
    const retryJson = await retryResponse.json().catch(() => null);
    if (!retryResponse.ok) {
      throw new Error(`NimbusPost API failed (${retryResponse.status}): ${JSON.stringify(retryJson)}`);
    }

    const retryBody = retryJson as Record<string, unknown> | null;
    if (retryBody && typeof retryBody === 'object') {
      const retryStatus = retryBody.status;
      const retrySuccess = retryBody.success;
      if (retryStatus === false || retrySuccess === false) {
        const retryMessage =
          (typeof retryBody.message === 'string' && retryBody.message) ||
          (typeof retryBody.error === 'string' && retryBody.error) ||
          JSON.stringify(retryBody);
        throw new Error(`NimbusPost business error: ${retryMessage}`);
      }
    }

    return retryJson as T;
  };

  const response = await fetch(url, init);
  let json: unknown = await response.json().catch(() => null);

  if (!response.ok && options?.allowLoginFallback && (response.status === 401 || response.status === 403)) {
    const fallbackResult = await tryLoginFallback();
    if (fallbackResult) {
      return fallbackResult;
    }
  }

  if (!response.ok) {
    throw new Error(`NimbusPost API failed (${response.status}): ${JSON.stringify(json)}`);
  }
  const body = json as Record<string, unknown> | null;
  if (body && typeof body === 'object') {
    const status = body.status;
    const success = body.success;
    if (status === false || success === false) {
      const message =
        (typeof body.message === 'string' && body.message) ||
        (typeof body.error === 'string' && body.error) ||
        JSON.stringify(body);

      // Some Nimbus endpoints respond HTTP 200 with business auth failure.
      if (
        options?.allowLoginFallback &&
        /missing or invalid token|invalid token|unauthorized|auth/i.test(message)
      ) {
        const fallbackResult = await tryLoginFallback();
        if (fallbackResult) {
          return fallbackResult;
        }
      }

      throw new Error(`NimbusPost business error: ${message}`);
    }
  }
  return json as T;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^91/, '');
}

function isNimbusRequiredFieldError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /is required/i.test(message);
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

function deepFindStringByKeys(
  value: unknown,
  keys: string[],
  maxDepth: number = 6
): string | undefined {
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

function mapShipmentResponse(raw: Record<string, unknown>): NimbusCreateShipmentResult {
  const data = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Record<string, unknown>;
  const awbNumber = deepFindStringByKeys(data, [
    'awb_number',
    'awb',
    'awbNumber',
    'tracking_number',
    'trackingNo',
    'waybill',
  ]);
  const shipmentId = deepFindStringByKeys(data, [
    'shipment_id',
    'shipmentId',
    'shipment',
    'order_id',
    'orderId',
    'id',
  ]);
  const courierName = deepFindStringByKeys(data, [
    'courier_name',
    'courier',
    'partner_name',
    'partner',
    'courierName',
  ]);
  const trackingUrl = deepFindStringByKeys(data, ['tracking_url', 'trackingUrl', 'track_url', 'tracking_link']);
  const labelUrl = deepFindStringByKeys(data, ['label_url', 'labelUrl', 'label', 'label_link', 'shipping_label']);

  return {
    shipmentId,
    awbNumber,
    courierName,
    trackingUrl,
    labelUrl,
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
  const pickupWarehouseName = process.env.NIMBUSPOST_PICKUP_WAREHOUSE_NAME || 'Primary Warehouse';
  const pickupContactName = process.env.NIMBUSPOST_PICKUP_CONTACT_NAME || 'Darshan Style Hub';
  const pickupAddress = process.env.NIMBUSPOST_PICKUP_ADDRESS || 'Sitapura, Jaipur';
  const pickupCity = process.env.NIMBUSPOST_PICKUP_CITY || 'Jaipur';
  const pickupState = process.env.NIMBUSPOST_PICKUP_STATE || 'Rajasthan';
  const pickupPincode = process.env.NIMBUSPOST_PICKUP_PINCODE || '302022';
  const pickupPhone = normalizePhone(process.env.NIMBUSPOST_PICKUP_PHONE || '9019076335');
  const paymentType = input.paymentMode === 'COD' ? 'cod' : 'prepaid';
  const consigneeAddress = `${addressLine1}${addressLine2 ? `, ${addressLine2}` : ''}`;
  const weightKg = Number((input.deadWeightGrams / 1000).toFixed(3));
  const packageWeight = Math.max(1, Math.round(input.deadWeightGrams));
  const packageLength = Number(process.env.NIMBUSPOST_PACKAGE_LENGTH || 10);
  const packageBreadth = Number(process.env.NIMBUSPOST_PACKAGE_BREADTH || 10);
  const packageHeight = Number(process.env.NIMBUSPOST_PACKAGE_HEIGHT || 10);
  const shippingCharges = Number(process.env.NIMBUSPOST_SHIPPING_CHARGES || 0);
  const discount = Number(process.env.NIMBUSPOST_DEFAULT_DISCOUNT || 0);
  const codCharges = Number(process.env.NIMBUSPOST_COD_CHARGES || 0);

  const nimbusDocPayload = {
    order_number: input.orderNumber,
    shipping_charges: shippingCharges,
    discount,
    cod_charges: input.paymentMode === 'COD' ? codCharges : 0,
    payment_type: paymentType,
    order_amount: input.amount,
    package_weight: packageWeight,
    package_length: packageLength,
    package_breadth: packageBreadth,
    package_height: packageHeight,
    consignee: {
      name: input.customerName,
      address: addressLine1,
      address_2: addressLine2 || '',
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      phone: normalizePhone(input.customerPhone),
      email: input.customerEmail || '',
    },
    pickup: {
      warehouse_name: pickupWarehouseName,
      name: pickupContactName,
      address: pickupAddress,
      address_2: '',
      city: pickupCity,
      state: pickupState,
      pincode: pickupPincode,
      phone: pickupPhone,
    },
    order_items: input.items.map((item) => ({
      name: item.name,
      qty: String(item.quantity),
      price: String(item.price),
      sku: item.sku || '',
    })),
  };

  // Some Nimbus tenants validate legacy snake_case keys, while others accept
  // modern schema keys. Send both so shipment create is tenant-compatible.
  const legacyFields = {
    consignee_name: input.customerName,
    consignee_address: consigneeAddress,
    consignee_city: input.city,
    consignee_state: input.state,
    consignee_pincode: input.pincode,
    consignee_phone: normalizePhone(input.customerPhone),
    consignee_email: input.customerEmail || '',
    order_number: input.orderNumber,
    payment_type: paymentType,
    payment_method: paymentType,
    order_total: input.amount,
    order_value: input.amount,
    pickup_warehouse_name: pickupWarehouseName,
    pickup_contact_name: pickupContactName,
    pickup_address: pickupAddress,
    pickup_city: pickupCity,
    pickup_state: pickupState,
    pickup_pincode: pickupPincode,
    pickup_phone: pickupPhone,
    weight: weightKg,
    order_items: input.items.map((item) => ({
      name: item.name,
      qty: item.quantity,
      quantity: item.quantity,
      price: item.price,
      sku: item.sku || '',
    })),
    products: input.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      sku: item.sku || '',
    })),
  };

  const modernFields = {
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
      deadWeightKg: weightKg,
    },
    items: input.items,
  };

  const camelCaseFields = {
    consigneeName: input.customerName,
    consigneeAddress: consigneeAddress,
    consigneeCity: input.city,
    consigneeState: input.state,
    consigneePincode: input.pincode,
    consigneePhone: normalizePhone(input.customerPhone),
    consigneeEmail: input.customerEmail || '',
    orderNumber: input.orderNumber,
    paymentType: paymentType,
    orderTotal: input.amount,
    pickupWarehouseName: pickupWarehouseName,
    pickupContactName: pickupContactName,
    pickupAddress: pickupAddress,
    pickupCity: pickupCity,
    pickupState: pickupState,
    pickupPincode: pickupPincode,
    pickupPhone: pickupPhone,
    weight: weightKg,
    orderItems: legacyFields.order_items,
    products: legacyFields.products,
  };

  const payloadCandidates: Array<{ label: string; payload: Record<string, unknown> }> = [
    { label: 'nimbus-doc', payload: nimbusDocPayload },
    { label: 'legacy', payload: legacyFields },
    { label: 'root-array', payload: { shipments: [legacyFields], orders: [legacyFields] } },
    { label: 'order-wrapper', payload: { order: legacyFields } },
    { label: 'orders-wrapper', payload: { orders: [legacyFields] } },
    { label: 'shipment-wrapper', payload: { shipment: legacyFields } },
    { label: 'data-wrapper', payload: { data: legacyFields } },
    { label: 'shipments-array', payload: { shipments: [legacyFields] } },
    { label: 'camelCase', payload: camelCaseFields },
    { label: 'modern', payload: modernFields },
  ];

  const mode = (process.env.NIMBUSPOST_CREATE_SHIPMENT_PAYLOAD_MODE || '').toLowerCase();
  const preferredPayload =
    mode === 'legacy'
      ? legacyFields
      : mode === 'modern'
        ? modernFields
        : mode === 'camel'
          ? camelCaseFields
          : null;

  const preferredCandidate = preferredPayload
    ? payloadCandidates.find((candidate) => candidate.payload === preferredPayload) || null
    : null;

  const candidates = preferredCandidate
    ? [preferredCandidate, ...payloadCandidates.filter((candidate) => candidate !== preferredCandidate)]
    : payloadCandidates;

  let lastError: unknown = null;
  let raw: Record<string, unknown> | null = null;
  const variantErrors: string[] = [];

  for (const candidate of candidates) {
    try {
      raw = await nimbusFetch<Record<string, unknown>>(
        url,
        {
          method: 'POST',
          headers: getNimbusAuthHeaders(apiKey),
          body: JSON.stringify(candidate.payload),
        },
        { allowLoginFallback: true, apiKey }
      );
      break;
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      variantErrors.push(`${candidate.label}: ${errorMessage}`);
      if (!isNimbusRequiredFieldError(error)) {
        throw error;
      }
    }
  }

  if (!raw) {
    if (variantErrors.length > 0) {
      throw new Error(
        `NimbusPost shipment creation failed for all JSON variants. ${variantErrors.join(' | ')}`
      );
    }
    throw lastError instanceof Error ? lastError : new Error('NimbusPost shipment creation failed');
  }

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

