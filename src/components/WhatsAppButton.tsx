'use client';

import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { buildDefaultStoreWhatsAppUrl, STORE_WHATSAPP_E164 } from '@/lib/whatsapp-customer';

const INSTAGRAM_URL = 'https://www.instagram.com/stylehubjaipur/';

/** Single-tap WhatsApp — no in-page chat popup (avoids overlaying the hero). */
export default function WhatsAppButton() {
  const whatsappLink = buildDefaultStoreWhatsAppUrl();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 sm:bottom-6 sm:right-6 sm:gap-3">
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 shadow-lg transition-transform duration-300 hover:scale-110 sm:h-14 sm:w-14"
        title="Follow us on Instagram"
      >
        <FaInstagram className="h-6 w-6 text-white sm:h-7 sm:w-7" />
      </a>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-green-600 sm:h-14 sm:w-14"
        title="Chat on WhatsApp"
      >
        <FaWhatsapp className="h-6 w-6 text-white sm:h-7 sm:w-7" />
      </a>
    </div>
  );
}

// Helper function to create WhatsApp order message
export function createWhatsAppOrderLink(
  productName: string,
  price: number,
  size: string,
  color: string,
  quantity: number
) {
  const message = encodeURIComponent(
    `Hi! I want to order:\n\n` +
      `📦 *${productName}*\n` +
      `💰 Price: ₹${price.toLocaleString('en-IN')}\n` +
      `📏 Size: ${size}\n` +
      `🎨 Color: ${color}\n` +
      `🔢 Quantity: ${quantity}\n\n` +
      `Please confirm availability and share payment details.`
  );
  return `https://wa.me/${STORE_WHATSAPP_E164}?text=${message}`;
}

// Helper function to share product on WhatsApp
export function createWhatsAppShareLink(productName: string, productUrl: string, price: number) {
  const message = encodeURIComponent(
    `Check out this beautiful ${productName} for just ₹${price.toLocaleString('en-IN')}! 🛍️\n\n${productUrl}`
  );
  return `https://wa.me/?text=${message}`;
}
