// Google Analytics E-commerce Tracking
// Tracks: view_item, add_to_cart, begin_checkout, purchase

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Check if gtag is available
function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function' && !!GA_MEASUREMENT_ID;
}

// Track when user views a product
export function gaViewItem(item: {
  id: string;
  name: string;
  category: string;
  price: number;
}) {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'view_item', {
    currency: 'INR',
    value: item.price,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: 1,
      },
    ],
  });
}

// Track when user adds item to cart
export function gaAddToCart(item: {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}) {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'add_to_cart', {
    currency: 'INR',
    value: item.price * item.quantity,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity,
      },
    ],
  });
}

// Track when user starts checkout
export function gaBeginCheckout(items: Array<{
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}>, totalValue: number) {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'begin_checkout', {
    currency: 'INR',
    value: totalValue,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

// Track successful purchase - MOST IMPORTANT!
export function gaPurchase(
  transactionId: string,
  items: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
  }>,
  totalValue: number,
  shipping: number = 0,
  paymentMethod: string = ''
) {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    currency: 'INR',
    value: totalValue,
    shipping: shipping,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    })),
  });

  // Also track as conversion
  window.gtag('event', 'conversion', {
    send_to: GA_MEASUREMENT_ID,
    value: totalValue,
    currency: 'INR',
    transaction_id: transactionId,
  });
}

// Track when user removes item from cart
export function gaRemoveFromCart(item: {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}) {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'remove_from_cart', {
    currency: 'INR',
    value: item.price * item.quantity,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity,
      },
    ],
  });
}

// Track WhatsApp button clicks
export function gaWhatsAppClick(location: string) {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'whatsapp_click', {
    event_category: 'engagement',
    event_label: location,
  });
}

// Track signup
export function gaSignUp(method: string = 'email') {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'sign_up', {
    method: method,
  });
}
