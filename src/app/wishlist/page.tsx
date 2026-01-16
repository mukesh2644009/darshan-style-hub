'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem, openCart } = useCartStore();

  const handleAddToCart = (product: typeof items[0]) => {
    addItem(product, product.sizes[0], product.colors[0].name);
    openCart();
  };

  const handleAddAllToCart = () => {
    items.forEach((product) => {
      addItem(product, product.sizes[0], product.colors[0].name);
    });
    openCart();
  };

  return (
    <div className="min-h-screen bg-accent-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-500 mt-1">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
          {items.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={handleAddAllToCart}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-colors"
              >
                <FiShoppingBag size={18} />
                Add All to Cart
              </button>
              <button
                onClick={clearWishlist}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                <FiTrash2 size={18} />
                Clear All
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product) => {
              const discount = product.originalPrice
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <Link href={`/products/${product.id}`} className="block relative aspect-[3/4]">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {discount > 0 && (
                      <span className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {discount}% OFF
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1 hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 mb-2">{product.subcategory}</p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-full font-medium hover:bg-primary-700 transition-colors"
                      >
                        <FiShoppingBag size={16} />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="p-2.5 border border-gray-300 rounded-full text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
                        title="Remove from wishlist"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
