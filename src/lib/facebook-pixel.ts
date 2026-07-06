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

export function trackServerEvent(
  eventName: string,
  customData?: Record<string, unknown>,
  extra?: { email?: string; phone?: string; eventId?: string }
) {
  const eventId = extra?.eventId || `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  trackPixelEvent(eventName, customData, eventId);

  // Always include _fbc and _fbp cookies — they are the primary signal
  // Meta CAPI uses for identity matching. Without them, event match quality drops
  // from "Excellent" to "Poor" and ROAS reporting becomes unreliable.
  const { fbc, fbp } = getMetaCookies();

  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName,
      eventSourceUrl: window.location.href,
      customData,
      eventId,
      ...(extra?.email && { email: extra.email }),
      ...(extra?.phone && { phone: extra.phone }),
      ...(fbc && { fbc }),
      ...(fbp && { fbp }),
    }),
  }).catch(() => {});
}

export function fbViewContent(productId: string, name: string, category: string, price: number) {
  trackServerEvent('ViewContent', {
    content_ids: [productId],
    content_name: name,
    content_category: category,
    content_type: 'product',
    value: price,
    currency: 'INR',
  });
}

export function fbAddToCart(productId: string, name: string, category: string, price: number, size?: string, totalSizes?: number) {
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
  });
}

// cartItems format: { productId, size, totalSizes }
export function fbInitiateCheckout(
  cartItems: { productId: string; size: string; totalSizes: number }[],
  totalValue: number,
  numItems: number
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
  });
}

export function fbPurchase(
  orderId: string,
  cartItems: { productId: string; size: string; totalSizes: number }[],
  totalValue: number,
  numItems: number,
  email?: string,
  phone?: string
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
  }, { email, phone });
}
