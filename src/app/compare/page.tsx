'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiStar, FiShoppingBag, FiX, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useCompareStore } from '@/store/compareStore';
import { useCartStore } from '@/store/cartStore';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';
import { Product } from '@/lib/products';

function SizePickerModal({
  product,
  onClose,
  onConfirm,
}: {
  product: Product;
  onClose: () => void;
  onConfirm: (size: string, color: string) => void;
}) {
  const [size, setSize] = useState('');
  const [color, setColor] = useState(product.colors[0]?.name || '');

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:w-96 z-[201] bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-semibold text-gray-900 line-clamp-2">{product.name}</p>
            <p className="text-primary-600 font-bold mt-0.5">₹{product.price.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
            <FiX size={18} />
          </button>
        </div>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Select Size</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {product.sizes.map((s) => (
            <button key={s} onClick={() => setSize(s)}
              className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                size === s ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-200 text-gray-700 hover:border-primary-400'
              }`}
            >{s}</button>
          ))}
        </div>

        {product.colors.length > 1 && (
          <>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Color</p>
            <div className="flex gap-3 mb-4">
              {product.colors.map((c) => (
                <button key={c.name} onClick={() => setColor(c.name)} title={c.name}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.name ? 'border-primary-600 scale-110 shadow-md' : 'border-gray-200'}`}
                  style={{ backgroundColor: c.hex || '#ccc' }} />
              ))}
            </div>
          </>
        )}

        <button onClick={() => size && onConfirm(size, color)} disabled={!size}
          className="w-full py-3 rounded-2xl bg-primary-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary-700 transition-colors">
          <FiCheck size={16} /> Add to Cart
        </button>
      </div>
    </>
  );
}

const ROWS = [
  { label: 'Price', key: 'price', render: (p: Product) => `₹${p.price.toLocaleString()}` },
  { label: 'Category', key: 'category', render: (p: Product) => p.category },
  { label: 'Type', key: 'subcategory', render: (p: Product) => p.subcategory || '—' },
  { label: 'Rating', key: 'rating', render: (p: Product) => `${p.rating} ★ (${p.reviews})` },
  {
    label: 'Available Sizes',
    key: 'sizes',
    render: (p: Product) =>
      p.sizes.length > 0 ? (
        <div className="flex flex-wrap gap-1 justify-center">
          {p.sizes.map((s) => (
            <span key={s} className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">{s}</span>
          ))}
        </div>
      ) : '—',
  },
  {
    label: 'Colors',
    key: 'colors',
    render: (p: Product) =>
      p.colors.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {p.colors.map((c) => (
            <span key={c.name} title={c.name}
              className="w-5 h-5 rounded-full border border-gray-200 inline-block"
              style={{ backgroundColor: c.hex || '#ccc' }} />
          ))}
        </div>
      ) : '—',
  },
  { label: 'Availability', key: 'inStock', render: (p: Product) => p.inStock ? '✅ In Stock' : '❌ Out of Stock' },
  {
    label: 'Discount',
    key: 'discount',
    render: (p: Product) =>
      p.originalPrice
        ? `${Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}% OFF`
        : 'No discount',
  },
] as const;

export default function ComparePage() {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, clearAll } = useCompareStore();
  const { addItem, openCart } = useCartStore();
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-accent-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-accent-50 flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
          <FiRefreshCw size={36} className="text-primary-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900">No products to compare</h1>
        <p className="text-gray-500 max-w-sm">
          Use the compare button on any product card to add up to 3 items here.
        </p>
        <Link href="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/products" className="p-2 rounded-full hover:bg-white transition-colors text-gray-600">
              <FiArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
                Compare Products
              </h1>
              <p className="text-sm text-gray-500">Comparing {items.length} item{items.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={clearAll} className="text-sm text-gray-500 hover:text-gray-700 font-medium underline">
            Clear all
          </button>
        </div>

        {/* Compare Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Product headers */}
          <div className={`grid border-b border-gray-100`}
            style={{ gridTemplateColumns: `180px repeat(${items.length}, 1fr)` }}>
            <div className="p-4 bg-gray-50 border-r border-gray-100" />
            {items.map((product) => {
              const img = normalizeProductImageUrl(product.images?.[0]) || '/products/logo.jpeg';
              const discount = product.originalPrice
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;
              return (
                <motion.div key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 relative border-r border-gray-100 last:border-r-0">
                  <button onClick={() => removeItem(product.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <FiX size={14} />
                  </button>

                  <Link href={`/products/${product.slug || product.id}`}>
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-accent-100 mb-3 group">
                      <Image src={img} alt={product.name} fill sizes="200px"
                        unoptimized={img.startsWith('/products/')}
                        className="object-cover object-top transition-transform duration-300 group-hover:scale-105" />
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          {discount}% OFF
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 hover:text-primary-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1 mb-3">
                    <FiStar size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-600">{product.rating} ({product.reviews})</span>
                  </div>

                  <button
                    onClick={() => setPickerProduct(product)}
                    disabled={!product.inStock}
                    className="w-full py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiShoppingBag size={14} />
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Comparison rows */}
          {ROWS.map((row, rowIdx) => (
            <div key={row.key}
              className={`grid border-b border-gray-50 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              style={{ gridTemplateColumns: `180px repeat(${items.length}, 1fr)` }}>
              <div className="p-4 border-r border-gray-100 flex items-center">
                <span className="text-sm font-medium text-gray-500">{row.label}</span>
              </div>
              {items.map((product) => (
                <div key={product.id}
                  className="p-4 border-r border-gray-100 last:border-r-0 flex items-center justify-center text-sm text-gray-900 text-center">
                  {row.render(product)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Add another product CTA */}
        {items.length < 3 && (
          <div className="mt-6 text-center">
            <Link href="/products"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm border border-primary-300 rounded-full px-5 py-2 hover:bg-primary-50 transition-colors">
              + Add another product to compare
            </Link>
          </div>
        )}
      </div>

      {pickerProduct && (
        <SizePickerModal
          product={pickerProduct}
          onClose={() => setPickerProduct(null)}
          onConfirm={(size, color) => {
            addItem(pickerProduct, size, color);
            openCart();
            setPickerProduct(null);
          }}
        />
      )}
    </div>
  );
}
