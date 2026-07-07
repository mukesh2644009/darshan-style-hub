import { getMetaCookies } from './utm';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackPixelEvent(eventName: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === 'undefined') return;

  const fire = () => {
    if (window.fbq) {
      if (eventId) {
        window.fbq('track', eventName, params, { eventID: eventId });
      } else {
        window.fbq('track', eventName, params);
      }
    }
  };

  if (window.fbq) {
    fire();
  } else {
    // Wait for pixel to initialize (afterInteractive script may load after useEffect)
    let attempts = 0;
    const interval = setInterval(() => {
      if (window.fbq) {
        fire();
        clearInterval(interval);
      } else if (++attempts > 20) {
        clearInterval(interval);
      }
    }, 100);
  }
}

// Waits up to 2s for _fbp cookie to be set by the pixel script,
// then sends the CAPI event with both _fbp and _fbc included.
// Without this delay, CAPI fires before the pixel script sets _fbp,
// causing Meta to report "empty fbc/fbp" on most CAPI events.
function sendCapiWhenReady(payload: Record<string, unknown>, maxWaitMs = 2000) {
  const start = Date.now();
  const attempt = () => {
    const { fbc, fbp } = getMetaCookies();
    if (fbp || Date.now() - start > maxWaitMs) {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          ...(fbc && { fbc }),
          ...(fbp && { fbp }),
        }),
      }).catch(() => {});
    } else {
      setTimeout(attempt, 100);
    }
  };
  attempt();
}

export function trackServerEvent(
  eventName: string,
  customData?: Record<string, unknown>,
  extra?: { email?: string; phone?: string; externalId?: string; eventId?: string }
) {
  const eventId = extra?.eventId || `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  trackPixelEvent(eventName, customData, eventId);

  sendCapiWhenReady({
    eventName,
    eventSourceUrl: window.location.href,
    customData,
    eventId,
    ...(extra?.email && { email: extra.email }),
    ...(extra?.phone && { phone: extra.phone }),
    ...(extra?.externalId && { externalId: extra.externalId }),
  });
}

export function fbViewContent(productId: string, name: string, category: string, price: number, user?: { email?: string; phone?: string; id?: string }) {
  trackServerEvent('ViewContent', {
    content_ids: [productId],
    content_name: name,
    content_category: category,
    content_type: 'product',
    value: price,
    currency: 'INR',
  }, { email: user?.email, phone: user?.phone, externalId: user?.id });
}

export function fbAddToCart(productId: string, name: string, category: string, price: number, size?: string, totalSizes?: number, user?: { email?: string; phone?: string; id?: string }) {
  // Match the catalog variant ID format: productId_Size for multi-size products
  const contentId = (totalSizes && totalSizes > 1 && size)
    ? `${productId}_${size.replace(/\s+/g, '_')}`
    : productId;

  trackServerEvent('AddToCart', {
    content_ids: [contentId],
    content_name: name,
    content_category: category,
    content_type: 'product',
    value: price,
    currency: 'INR',
    num_items: 1,
  }, { email: user?.email, phone: user?.phone, externalId: user?.id });
}

// cartItems format: { productId, size, totalSizes }
export function fbInitiateCheckout(
  cartItems: { productId: string; size: string; totalSizes: number }[],
  totalValue: number,
  numItems: number,
  user?: { email?: string; phone?: string; id?: string }
) {
  const contentIds = cartItems.map(item =>
    item.totalSizes > 1 ? `${item.productId}_${item.size.replace(/\s+/g, '_')}` : item.productId
  );
  trackServerEvent('InitiateCheckout', {
    content_ids: contentIds,
    content_type: 'product',
    value: totalValue,
    currency: 'INR',
    num_items: numItems,
  }, { email: user?.email, phone: user?.phone, externalId: user?.id });
}

export function fbPurchase(
  orderId: string,
  cartItems: { productId: string; size: string; totalSizes: number }[],
  totalValue: number,
  numItems: number,
  email?: string,
  phone?: string,
  externalId?: string
) {
  const contentIds = cartItems.map(item =>
    item.totalSizes > 1 ? `${item.productId}_${item.size.replace(/\s+/g, '_')}` : item.productId
  );
  trackServerEvent('Purchase', {
    content_ids: contentIds,
    content_type: 'product',
    value: totalValue,
    currency: 'INR',
    num_items: numItems,
    order_id: orderId,
  }, { email, phone, externalId });
}
