import Link from 'next/link';
import { FiHeart } from 'react-icons/fi';

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-accent-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="text-center py-12">
            <FiHeart size={64} className="mx-auto text-accent-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Browse our collection and click the heart icon on products you love to save them here
            </p>
            <Link href="/products" className="btn-primary inline-block">
              Explore Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

