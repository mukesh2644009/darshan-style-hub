'use client';

import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { FiX, FiMessageCircle } from 'react-icons/fi';

// Replace with your actual WhatsApp number (with country code, no + or spaces)
const WHATSAPP_NUMBER = '919876543210'; // Example: 91 for India + your number

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  const defaultMessage = encodeURIComponent(
    'Hi! I\'m interested in your sarees and suits collection. Can you help me?'
  );

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Popup */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden animate-scaleIn mb-4">
          {/* Header */}
          <div className="bg-green-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <FaWhatsapp size={24} />
                </div>
                <div>
                  <p className="font-semibold">Darshan Style Hub</p>
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
                👋 Hi there! Looking for the perfect saree or suit? We're here to help!
              </p>
              <p className="text-xs text-gray-400 mt-2">Just now</p>
            </div>

            {/* Quick Messages */}
            <div className="space-y-2 mb-4">
              <p className="text-xs text-gray-500 font-medium">Quick Messages:</p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I want to know about your latest saree collection.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                📦 Inquire about sarees
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I want to check availability of a suit.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                👗 Check suit availability
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I need help with my order.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                🛍️ Order support
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
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700 rotate-90'
            : 'bg-green-500 hover:bg-green-600 hover:scale-110'
        }`}
      >
        {isOpen ? (
          <FiX size={24} className="text-white" />
        ) : (
          <FaWhatsapp size={28} className="text-white" />
        )}
      </button>

      {/* Pulse Animation */}
      {!isOpen && (
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-ping" />
      )}
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

