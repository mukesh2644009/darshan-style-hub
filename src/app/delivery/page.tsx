import type { Metadata } from 'next';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import DeliveryPincodeChecker from '@/components/DeliveryPincodeChecker';

export const metadata: Metadata = {
  title: 'Delivery & pincode check | Darshan Style Hub™',
  description:
    'Check if we deliver to your pincode across India. Shipping timelines, free shipping threshold, and how we dispatch orders from Jaipur.',
};

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-accent-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <FiArrowLeft />
          Back to shop
        </Link>

        <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Delivery & pincode check</h1>
        <p className="text-gray-600 mb-10">
          See if we ship to your area before you place an order. We dispatch from Jaipur to most pincodes across
          India.
        </p>

        <DeliveryPincodeChecker variant="full" showTitle={false} className="mb-10" />

        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-4 text-gray-700 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
          <p>
            Enter a valid 6-digit Indian pincode. If your area is serviceable, you&apos;ll see a confirmation
            message. Actual delivery time depends on the courier partner and your location — we&apos;ll show
            tracking details after your order ships.
          </p>
          <p>
            Free shipping applies on orders above ₹999 where indicated at checkout. Cash on delivery is available
            where supported.
          </p>
          <p>
            For restricted or remote pincodes, WhatsApp us — we may still be able to help with manual booking or
            bulk orders.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/shipping" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
            Shipping policy →
          </Link>
          <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
            Contact us →
          </Link>
        </div>
      </div>
    </div>
  );
}
