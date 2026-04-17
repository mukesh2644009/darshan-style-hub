import { PUBLIC_SITE_URL } from '@/lib/site-url';

/** Public WhatsApp for customer support (India, no +). Matches WhatsAppButton / contact page. */
export const STORE_WHATSAPP_E164 =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919019076335';

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${STORE_WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
}

/** Pre-filled message for return / exchange help (optional order reference). */
export function buildReturnSupportWhatsAppUrl(orderId?: string): string {
  const short = orderId ? orderId.slice(0, 8).toUpperCase() : '—';
  const message =
    `Hi Darshan Style Hub 👋\n\n` +
    `I need help with a return or exchange.\n` +
    `Website: ${PUBLIC_SITE_URL}\n` +
    `Order reference: #${short}\n\n` +
    `Please advise on the next steps.`;
  return buildWhatsAppUrl(message);
}
