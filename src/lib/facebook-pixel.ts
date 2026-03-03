declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackPixelEvent(eventName: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    if (eventId) {
      window.fbq('track', eventName, params, { eventID: eventId });
    } else {
      window.fbq('track', eventName, params);
    }
  }
}

export function trackServerEvent(
  eventName: string,
  customData?: Record<string, unknown>,
  extra?: { email?: string; phone?: string; eventId?: string }
) {
  const eventId = extra?.eventId || `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  trackPixelEvent(eventName, customData, eventId);

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
    }),
  }).catch(() => {});
}

export function fbAddToCart(productId: string, name: string, category: string, price: number) {
  trackServerEvent('AddToCart', {
    content_ids: [productId],
    content_name: name,
    content_category: category,
    content_type: 'product',
    value: price,
    currency: 'INR',
    num_items: 1,
  });
}

export function fbInitiateCheckout(contentIds: string[], totalValue: number, numItems: number) {
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
  contentIds: string[],
  totalValue: number,
  numItems: number,
  email?: string,
  phone?: string
) {
  trackServerEvent('Purchase', {
    content_ids: contentIds,
    content_type: 'product',
    value: totalValue,
    currency: 'INR',
    num_items: numItems,
    order_id: orderId,
  }, { email, phone });
}
