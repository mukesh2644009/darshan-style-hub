'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiX, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompareStore } from '@/store/compareStore';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';

export default function CompareBar() {
  const { items, removeItem, clearAll, isOpen, closePanel } = useCompareStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {items.length > 0 && isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[150] bg-white border-t-2 border-primary-200 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-primary-700 shrink-0">
              <FiRefreshCw size={16} />
              <span className="text-sm font-semibold hidden sm:inline">Compare</span>
              <span className="text-xs text-gray-400 ml-1">({items.length}/3)</span>
            </div>

            <div className="flex-1 flex items-center gap-3 overflow-x-auto">
              {items.map((product) => {
                const img = normalizeProductImageUrl(product.images?.[0]) || '/products/logo.jpeg';
                return (
                  <div key={product.id} className="flex items-center gap-2 bg-accent-50 rounded-xl px-3 py-2 shrink-0 group">
                    <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-accent-100">
                      <Image
                        src={img}
                        alt={product.name}
                        fill
                        sizes="40px"
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 line-clamp-1 max-w-[120px]">
                        {product.name}
                      </p>
                      <p className="text-xs font-bold text-primary-600">₹{product.price.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="ml-1 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <FiX size={13} />
                    </button>
                  </div>
                );
              })}

              {/* Empty slots */}
              {Array.from({ length: 3 - items.length }).map((_, i) => (
                <div key={i}
                  className="flex items-center justify-center w-24 h-14 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 shrink-0">
                  + Add item
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {items.length >= 2 && (
                <Link
                  href="/compare"
                  className="flex items-center gap-1.5 bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-primary-700 transition-colors"
                >
                  Compare <FiArrowRight size={14} />
                </Link>
              )}
              <button
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Clear
              </button>
              <button onClick={closePanel} className="p-1 text-gray-400 hover:text-gray-600">
                <FiX size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
