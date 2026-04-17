'use client';

import { useState } from 'react';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { buildReturnSupportWhatsAppUrl } from '@/lib/whatsapp-customer';
import { PUBLIC_SITE_URL } from '@/lib/site-url';

// Your WhatsApp number (with country code, no + or spaces)
const WHATSAPP_NUMBER = '919019076335'; // Your number: 91 (India) + 9019076335
const INSTAGRAM_URL = 'https://www.instagram.com/stylehubjaipur/';

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  const defaultMessage = encodeURIComponent(
    `Hi 👋\nI visited your website ${PUBLIC_SITE_URL}\nI'm interested in your women's apparel.\nPlease share product details and pricing.`,
  );

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 sm:gap-3">
      {/* Instagram Button */}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:scale-110 transition-all duration-300"
        title="Follow us on Instagram"
      >
        <FaInstagram className="text-white w-6 h-6 sm:w-7 sm:h-7" />
      </a>

      {/* WhatsApp Section */}
      <div className="relative">
        {/* Chat Popup */}
        {isOpen && (
          <div className="absolute bottom-14 sm:bottom-16 right-0 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl overflow-hidden animate-scaleIn mb-4">
            {/* Header */}
            <div className="bg-green-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <FaWhatsapp size={24} />
                  </div>
                  <div>
                    <p className="font-semibold">Darshan Style Hub™</p>
                    <p className="text-xs text-green-100">Typically replies within 5 mins</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 bg-gray-50">
              <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
                <p className="text-sm text-gray-600">
                  👋 Hi there! Looking for the perfect suit or kurti? We&apos;re here to help!
                </p>
                <p className="text-xs text-gray-400 mt-2">Just now</p>
              </div>

              {/* Quick Messages */}
              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-500 font-medium">Quick Messages:</p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi 👋\nI visited ${PUBLIC_SITE_URL}\nI'm interested in your suits collection.\nPlease share details.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  👗 Inquire about suits
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi 👋\nI visited ${PUBLIC_SITE_URL}\nI'm interested in your co ord sets collection.\nPlease share details.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  👚 Inquire about co ord sets
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi 👋\nI visited ${PUBLIC_SITE_URL}\nI want to place a bulk order.\nPlease share details.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  📦 Bulk order inquiry
                </a>
                <a
                  href={buildReturnSupportWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  ↩️ Returns & order support
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-full font-medium transition-colors"
              >
                <FaWhatsapp size={20} />
                Start Chat
              </a>
            </div>
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? 'bg-gray-600 hover:bg-gray-700 rotate-90'
              : 'bg-green-500 hover:bg-green-600 hover:scale-110'
          }`}
        >
          {isOpen ? (
            <FiX className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <FaWhatsapp className="text-white w-6 h-6 sm:w-7 sm:h-7" />
          )}
        </button>

        {/* Pulse Animation */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        )}
      </div>
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
    `💰 Price: ₹${price.toLocaleString()}\n` +
    `📏 Size: ${size}\n` +
    `🎨 Color: ${color}\n` +
    `🔢 Quantity: ${quantity}\n\n` +
    `Please confirm availability and share payment details.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

// Helper function to share product on WhatsApp
export function createWhatsAppShareLink(productName: string, productUrl: string, price: number) {
  const message = encodeURIComponent(
    `Check out this beautiful ${productName} for just ₹${price.toLocaleString()}! 🛍️\n\n${productUrl}`
  );
  return `https://wa.me/?text=${message}`;
}

