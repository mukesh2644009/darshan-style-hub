import { PRODUCTION_SITE_ORIGIN } from '@/lib/production-site-origin';

/** Public WhatsApp for customer support (India, no +). Matches WhatsAppButton / contact page. */
export const STORE_WHATSAPP_E164 =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919019076335';

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${STORE_WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
}

/** Default prefill for footer, floating button, and contact — uses {@link PRODUCTION_SITE_ORIGIN} only (not env). */
export function buildDefaultStoreWhatsAppUrl(): string {
  const message =
    `Hi 👋\n` +
    `I visited your website ${PRODUCTION_SITE_ORIGIN}\n` +
    `I'm interested in your women's apparel.\n` +
    `Please share product details and pricing.`;
  return buildWhatsAppUrl(message);
}

/** Pre-filled message for return / exchange help (optional order reference). */
export function buildReturnSupportWhatsAppUrl(orderId?: string): string {
  const short = orderId ? orderId.slice(0, 8).toUpperCase() : '—';
  const message =
    `Hi Darshan Style Hub 👋\n\n` +
    `I need help with a return or exchange.\n` +
    `Website: ${PRODUCTION_SITE_ORIGIN}\n` +
    `Order reference: #${short}\n\n` +
    `Please advise on the next steps.`;
  return buildWhatsAppUrl(message);
}
