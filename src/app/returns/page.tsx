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
                <li>Returns and exchanges apply to <strong>delivered</strong> orders only.</li>
                <li>
                  Please raise your request within <strong>7 days</strong> of delivery.
                </li>
              </ul>

              <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">All of the following must be met</p>
                </div>
                <ul className="divide-y divide-gray-100 text-sm text-gray-700">
                  {[
                    ['🏷️', 'Tags intact', 'Original tags must still be attached — this confirms the item was not worn.'],
                    ['📸', 'Photo approval', 'You will be asked to share photos of the item before pickup is scheduled.'],
                    ['📦', 'Original packaging', 'Item must be in its original packaging to prevent transit damage.'],
                    ['✂️', 'No stitching or alterations', 'Stitched or altered suits/kurtas cannot be returned or exchanged.'],
                  ].map(([icon, title, desc]) => (
                    <li key={title} className="flex items-start gap-3 px-4 py-3">
                      <span className="text-lg shrink-0">{icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                  <span className="text-2xl shrink-0">🚚</span>
                  <div>
                    <p className="font-semibold text-amber-900">Returns — ₹99 pickup fee</p>
                    <p className="text-xs text-amber-700 mt-0.5">A flat ₹99 pickup charge is deducted from your refund once the return is approved.</p>
                  </div>
                </div>
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
                  <span className="text-2xl shrink-0">🎉</span>
                  <div>
                    <p className="font-semibold text-green-900">Exchanges — always free</p>
                    <p className="text-xs text-green-700 mt-0.5">Size or colour exchanges carry no pickup or handling fee.</p>
                  </div>
                </div>
              </div>
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
