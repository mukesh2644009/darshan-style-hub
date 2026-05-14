'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiClock, FiArrowRight } from 'react-icons/fi';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';

export default function RecentlyViewed() {
  const [mounted, setMounted] = useState(false);
  const items = useRecentlyViewedStore((s) => s.items);

  useEffect(() => setMounted(true), []);

  if (!mounted || items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FiClock className="text-primary-600" size={20} />
          <h2 className="font-display text-xl sm:text-2xl font-bold text-gray-900">
            Recently Viewed
          </h2>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View All <FiArrowRight size={14} />
        </Link>
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
        {items.map((product) => {
          const img =
            normalizeProductImageUrl(product.images?.[0]) || '/products/logo.jpeg';
          const href = `/products/${product.slug || product.id}`;
          const discount = product.originalPrice
            ? Math.round(
                ((product.originalPrice - product.price) / product.originalPrice) * 100
              )
            : 0;

          return (
            <Link
              key={product.id}
              href={href}
              className="flex-shrink-0 snap-start w-32 sm:w-40 group"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-accent-100 mb-2">
                <Image
                  src={img}
                  alt={product.name}
                  fill
                  sizes="160px"
                  unoptimized={img.startsWith('/products/')}
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                />
                {discount > 0 && (
                  <span className="absolute top-2 left-2 bg-primary-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">
                {product.name}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm font-bold text-gray-900">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
