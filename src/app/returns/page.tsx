import type { Metadata } from 'next';
import Link from 'next/link';
import { FiArrowLeft, FiPackage, FiRefreshCw, FiShield } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { buildReturnSupportWhatsAppUrl } from '@/lib/whatsapp-customer';

export const metadata: Metadata = {
  title: 'Returns & Exchange | Darshan Style Hub™',
  description:
    'Returns and exchange policy for Darshan Style Hub. How to request a return after delivery and timelines.',
};

export default function ReturnsPolicyPage() {
  const waUrl = buildReturnSupportWhatsAppUrl();

  return (
    <div className="min-h-screen bg-accent-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <FiArrowLeft />
          Back to shop
        </Link>

        <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Returns & exchange</h1>
        <p className="text-gray-600 mb-10">
          We want you to love your purchase. Here is how returns and exchanges work at Darshan Style
          Hub™.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 sm:p-8 space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <FiPackage className="text-primary-600 w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Eligibility</h2>
              </div>
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                <li>Returns and size exchanges apply to <strong>delivered</strong> orders.</li>
                <li>
                  Items should be <strong>unused</strong>, with original tags and packaging where
                  applicable.
                </li>
                <li>
                  Please raise your request within <strong>7 days</strong> of delivery (unless we
                  specify otherwise for a promotion).
                </li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <FiRefreshCw className="text-primary-600 w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">How to request</h2>
              </div>
              <ol className="list-decimal pl-5 text-gray-700 space-y-2">
                <li>
                  Log in and open <Link href="/my-orders" className="text-primary-600 hover:underline font-medium">My orders</Link>.
                </li>
                <li>
                  For orders marked <strong>Delivered</strong>, use <strong>Request return</strong> and
                  tell us the reason.
                </li>
                <li>
                  Our team will confirm pickup or exchange steps. You can also message us on WhatsApp
                  with your order reference for faster coordination.
                </li>
              </ol>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <FiShield className="text-primary-600 w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Refunds</h2>
              </div>
              <p className="text-gray-700">
                Approved returns are refunded to your original payment method where applicable, after
                we receive and inspect the item. Cash on delivery orders may be settled via bank
                transfer or store credit as per our team&apos;s confirmation.
              </p>
            </section>
          </div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Questions about your order?</h3>
            <p className="text-sm text-gray-600">
              Message us on WhatsApp with your order ID — we typically reply within a few minutes.
            </p>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-green-500 text-white font-medium hover:bg-green-600 transition-colors shrink-0"
          >
            <FaWhatsapp className="w-5 h-5" />
            WhatsApp support
          </a>
        </div>
      </div>
    </div>
  );
}
