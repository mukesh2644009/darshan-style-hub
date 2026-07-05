'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiSearch, FiX, FiArrowRight, FiTrendingUp, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';

interface SearchProduct {
  id: string;
  slug: string | null;
  name: string;
  price: number;
  originalPrice?: number | null;
  category: string;
  subcategory: string;
  images: string[];
}

const POPULAR_SEARCHES = [
  'Anarkali suit',
  'Co ord set',
  'Cotton kurti',
  'Embroidered suit',
  'Party wear',
  'Casual kurti',
];

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    onClose();
  }, [onClose]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      if (data.success) {
        setResults(data.products.slice(0, 6));
        setTotalCount(data.products.length);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 280);
  };

  const goToAllResults = (q = query) => {
    if (!q.trim()) return;
    handleClose();
    router.push(`/products?search=${encodeURIComponent(q.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const itemCount = results.length + (results.length > 0 ? 1 : 0); // +1 for "view all" row
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, itemCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        const p = results[selectedIndex];
        handleClose();
        router.push(`/products/${p.slug || p.id}`);
      } else {
        goToAllResults();
      }
    }
  };

  const showPopular = !query.trim();
  const showResults = query.trim().length > 0;
  const showNoResults = showResults && !loading && results.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-[301] bg-white shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Search input row */}
            <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
              <FiSearch size={22} className="text-primary-600 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search suits, co-ord sets, kurtis, fabrics…"
                className="flex-1 text-lg sm:text-xl text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {loading && <FiLoader size={18} className="text-gray-400 animate-spin shrink-0" />}
              {query && !loading && (
                <button
                  onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                >
                  <FiX size={16} />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 ml-1"
                aria-label="Close search"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content area */}
            <div className="overflow-y-auto flex-1">
              {/* Popular searches (when input is empty) */}
              {showPopular && (
                <div className="px-4 sm:px-6 py-5">
                  <p className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    <FiTrendingUp size={13} />
                    Popular searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((term) => (
                      <button
                        key={term}
                        onClick={() => { handleQueryChange(term); inputRef.current?.focus(); }}
                        className="px-4 py-2 bg-accent-50 text-gray-700 text-sm rounded-full border border-accent-200 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {showNoResults && (
                <div className="px-4 sm:px-6 py-10 text-center">
                  <p className="text-2xl mb-2">🔍</p>
                  <p className="text-gray-600 font-medium mb-1">No results for &ldquo;{query}&rdquo;</p>
                  <p className="text-sm text-gray-400">Try different keywords or browse all products</p>
                  <button
                    onClick={() => goToAllResults()}
                    className="mt-4 px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors"
                  >
                    Browse all products
                  </button>
                </div>
              )}

              {/* Results */}
              {showResults && results.length > 0 && (
                <div className="divide-y divide-gray-50">
                  {results.map((product, idx) => {
                    const img = normalizeProductImageUrl(product.images?.[0]) || '/products/logo.jpeg';
                    const discount = product.originalPrice
                      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                      : 0;
                    const isSelected = idx === selectedIndex;

                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug || product.id}`}
                        onClick={handleClose}
                        className={`flex items-center gap-4 px-4 sm:px-6 py-3 transition-colors ${
                          isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Image */}
                        <div className="relative w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden bg-accent-100 shrink-0"
                          style={{ height: '4.5rem' }}>
                          <Image
                            src={img}
                            alt={product.name}
                            fill
                            sizes="64px"
                            className="object-cover object-top"
                          />
                          {discount > 0 && (
                            <span className="absolute top-1 left-1 bg-primary-600 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                              -{discount}%
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{product.category} · {product.subcategory}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                            {product.originalPrice && (
                              <span className="text-xs text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                            )}
                          </div>
                        </div>

                        <FiArrowRight size={16} className="text-gray-300 shrink-0" />
                      </Link>
                    );
                  })}

                  {/* View all results row */}
                  <button
                    onClick={() => goToAllResults()}
                    className={`w-full flex items-center justify-between px-4 sm:px-6 py-3.5 text-sm font-semibold transition-colors ${
                      selectedIndex === results.length
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-primary-600 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    <span>
                      View all {totalCount > 6 ? `${totalCount}` : ''} results for &ldquo;{query}&rdquo;
                    </span>
                    <FiArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
