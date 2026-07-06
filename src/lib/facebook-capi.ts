import crypto from 'crypto';

const PIXEL_ID = '3141261462728297';
const ACCESS_TOKEN = process.env.FACEBOOK_CAPI_ACCESS_TOKEN || '';
const API_VERSION = 'v21.0';

function hashData(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
}

interface CustomData {
  value?: number;
  currency?: string;
  // camelCase (used internally)
  contentName?: string;
  contentCategory?: string;
  contentIds?: string[];
  contentType?: string;
  numItems?: number;
  orderId?: string;
  // snake_case (sent from browser pixel via /api/track)
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  num_items?: number;
  order_id?: string;
}

function buildUserData(user: UserData) {
  const data: Record<string, string> = {};

  if (user.email) data.em = hashData(user.email);
  if (user.phone) data.ph = hashData(user.phone.replace(/\D/g, ''));
  if (user.firstName) data.fn = hashData(user.firstName);
  if (user.lastName) data.ln = hashData(user.lastName);
  if (user.city) data.ct = hashData(user.city);
  if (user.state) data.st = hashData(user.state);
  if (user.zip) data.zp = hashData(user.zip);
  if (user.country) data.country = hashData(user.country);
  if (user.clientIpAddress) data.client_ip_address = user.clientIpAddress;
  if (user.clientUserAgent) data.client_user_agent = user.clientUserAgent;
  if (user.fbc) data.fbc = user.fbc;
  if (user.fbp) data.fbp = user.fbp;

  return data;
}

function buildCustomData(custom: CustomData) {
  const data: Record<string, unknown> = {};

  if (custom.value !== undefined) data.value = custom.value;
  if (custom.currency) data.currency = custom.currency;
  // Accept both camelCase (internal) and snake_case (sent from browser pixel via /api/track)
  const contentName = custom.contentName || custom.content_name;
  if (contentName) data.content_name = contentName;
  const contentCategory = custom.contentCategory || custom.content_category;
  if (contentCategory) data.content_category = contentCategory;
  const contentIds = custom.contentIds || custom.content_ids;
  if (contentIds) data.content_ids = contentIds;
  const contentType = custom.contentType || custom.content_type;
  if (contentType) data.content_type = contentType;
  const numItems = custom.numItems ?? custom.num_items;
  if (numItems !== undefined) data.num_items = numItems;
  const orderId = custom.orderId || custom.order_id;
  if (orderId) data.order_id = orderId;

  return data;
}

export async function sendConversionEvent(
  eventName: string,
  eventSourceUrl: string,
  userData: UserData,
  customData?: CustomData,
  eventId?: string
) {
  if (!ACCESS_TOKEN) {
    console.warn('Facebook CAPI: No access token configured, skipping event:', eventName);
    return null;
  }

  const event: Record<string, unknown> = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: buildUserData(userData),
  };

  if (eventId) {
    event.event_id = eventId;
  }

  if (customData) {
    event.custom_data = buildCustomData(customData);
  }

  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [event],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Facebook CAPI error:', result);
      return null;
    }

    return result;
  } catch (error) {
    console.error('Facebook CAPI request failed:', error);
    return null;
  }
}

export async function trackViewContent(
  productId: string,
  productName: string,
  category: string,
  price: number,
  sourceUrl: string,
  userData: UserData
) {
  return sendConversionEvent('ViewContent', sourceUrl, userData, {
    contentIds: [productId],
    contentName: productName,
    contentCategory: category,
    contentType: 'product',
    value: price,
    currency: 'INR',
  });
}

export async function trackAddToCart(
  productId: string,
  productName: string,
  category: string,
  price: number,
  sourceUrl: string,
  userData: UserData
) {
  return sendConversionEvent('AddToCart', sourceUrl, userData, {
    contentIds: [productId],
    contentName: productName,
    contentCategory: category,
    contentType: 'product',
    value: price,
    currency: 'INR',
    numItems: 1,
  });
}

export async function trackInitiateCheckout(
  contentIds: string[],
  totalValue: number,
  numItems: number,
  sourceUrl: string,
  userData: UserData
) {
  return sendConversionEvent('InitiateCheckout', sourceUrl, userData, {
    contentIds,
    contentType: 'product',
    value: totalValue,
    currency: 'INR',
    numItems,
  });
}

export async function trackPurchase(
  orderId: string,
  contentIds: string[],
  totalValue: number,
  numItems: number,
  sourceUrl: string,
  userData: UserData
) {
  return sendConversionEvent('Purchase', sourceUrl, userData, {
    contentIds,
    contentType: 'product',
    value: totalValue,
    currency: 'INR',
    numItems,
    orderId,
  });
}
