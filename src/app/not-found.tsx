import Link from 'next/link';
import { FiArrowLeft, FiHome, FiGrid } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium text-primary-600 mb-2">404</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
        This page could not be found
      </h1>
      <p className="text-gray-600 max-w-md mb-8">
        The link may be outdated, the product may have been removed, or the address was mistyped.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
        >
          <FiHome />
          Back to home
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-800 font-medium hover:bg-gray-50 transition-colors"
        >
          <FiGrid />
          Browse all products
        </Link>
      </div>
      <Link href="/contact" className="inline-flex items-center gap-2 mt-8 text-sm text-primary-600 hover:text-primary-700">
        <FiArrowLeft className="rotate-180" />
        Contact support
      </Link>
    </div>
  );
}
