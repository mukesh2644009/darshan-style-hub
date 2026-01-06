'use client';

import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { FiCopy, FiCheck, FiX } from 'react-icons/fi';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  category: string;
}

interface Props {
  product: Product;
}

// Your WhatsApp number
const WHATSAPP_NUMBER = '919019076335';
const STORE_URL = 'https://darshan-style-hub.vercel.app';

export default function WhatsAppShareButton({ product }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const productUrl = `${STORE_URL}/products/${product.id}`;

  const generateMessage = () => {
    let message = `*${product.name}*\n\n`;
    message += `Category: ${product.category}\n`;
    message += `Price: Rs.${product.price.toLocaleString('en-IN')}`;
    
    if (discount > 0) {
      message += ` (${discount}% OFF!)`;
      message += `\nOriginal: Rs.${product.originalPrice?.toLocaleString('en-IN')}`;
    }
    
    message += `\n\nView Product: ${productUrl}`;
    message += `\n\n*Darshan Style Hub*`;
    message += `\nJohari Bazaar, Jaipur`;
    message += `\nContact: +91 90190 76335`;
    
    return message;
  };

  const message = generateMessage();

  const handleShareToCustomer = () => {
    if (!phoneNumber) return;
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
    setShowModal(false);
    setPhoneNumber('');
  };

  const handleShareGeneral = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
        title="Share on WhatsApp"
      >
        <FaWhatsapp className="w-4 h-4" />
        Share
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Share on WhatsApp</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Product Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-900">{product.name}</p>
              <p className="text-lg font-bold text-primary-600">
                ₹{product.price.toLocaleString('en-IN')}
                {discount > 0 && (
                  <span className="text-sm text-green-600 ml-2">{discount}% OFF</span>
                )}
              </p>
            </div>

            {/* Message Preview */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Preview
              </label>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-line max-h-40 overflow-y-auto">
                {message}
              </div>
              <button
                onClick={handleCopyMessage}
                className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {copied ? (
                  <>
                    <FiCheck className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FiCopy className="w-4 h-4" />
                    Copy Message
                  </>
                )}
              </button>
            </div>

            {/* Send to Specific Customer */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send to Customer (Phone Number)
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number (e.g. 9876543210)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  onClick={handleShareToCustomer}
                  disabled={!phoneNumber}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    phoneNumber
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Send
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleShareGeneral}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <FaWhatsapp className="w-5 h-5" />
                Open WhatsApp
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              This will open WhatsApp with the product details ready to send
            </p>
          </div>
        </div>
      )}
    </>
  );
}

