'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FiHeart, FiShoppingBag, FiStar, FiX, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { Product } from '@/lib/products';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCompareStore } from '@/store/compareStore';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { toggleItem: toggleCompare, isInCompare, isFull } = useCompareStore();
  const [isHovered, setIsHovered] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const isWishlisted = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);
  const compareDisabled = !isCompared && isFull();
  const primaryImage =
    normalizeProductImageUrl(product.images?.[0]) || '/products/logo.jpeg';

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const availableSizes = product.sizes.filter(
    (s) => typeof s === 'string' ? true : (s as { quantity?: number }).quantity !== 0
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize('');
    setSelectedColor(product.colors[0]?.name || '');
    setShowSizePicker(true);
  };

  const handleConfirmAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedSize) return;
    addItem(product, selectedSize, selectedColor || product.colors[0]?.name || '');
    setShowSizePicker(false);
    openCart();
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
  };

  const closePicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSizePicker(false);
  };

  return (
    <>
      {/* Size Picker — right-side drawer */}
      <AnimatePresence>
        {showSizePicker && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]"
              onClick={closePicker}
            />

            {/* Right drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-[201] w-full max-w-sm bg-white shadow-2xl flex flex-col"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <p className="font-display text-lg font-bold text-gray-900">Add to Cart</p>
                <button
                  onClick={closePicker}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                {/* Product summary row */}
                <div className="flex gap-4 items-start">
                  <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-accent-100 shrink-0">
                    <Image
                      src={primaryImage}
                      alt={product.name}
                      fill
                      sizes="80px"
                      unoptimized={primaryImage.startsWith('/products/')}
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0 pt-1">
                    <p className="font-semibold text-gray-900 leading-snug line-clamp-3 text-sm">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-primary-600 font-bold">₹{product.price.toLocaleString()}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Size selection */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    Select Size
                    {!selectedSize && (
                      <span className="text-primary-500 normal-case font-normal ml-2">— required</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((s) => {
                      const sizeStr = typeof s === 'string' ? s : (s as { size: string }).size;
                      return (
                        <button
                          key={sizeStr}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSize(sizeStr); }}
                          className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                            selectedSize === sizeStr
                              ? 'bg-primary-600 border-primary-600 text-white shadow-md scale-105'
                              : 'border-gray-200 text-gray-700 hover:border-primary-400 hover:bg-primary-50'
                          }`}
                        >
                          {sizeStr}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Sticky footer CTA */}
              <div className="px-5 py-4 border-t border-gray-100 bg-white">
                <button
                  onClick={handleConfirmAdd}
                  disabled={!selectedSize}
                  className="w-full py-4 rounded-2xl bg-primary-600 text-white font-bold text-base flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-700 active:scale-[0.98] transition-all"
                >
                  <FiShoppingBag size={18} />
                  {selectedSize ? `Add to Cart — ₹${product.price.toLocaleString()}` : 'Select a size first'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Card */}
      <Link href={`/products/${product.slug || product.id}`}>
        <motion.div
          className="group bg-white rounded-2xl overflow-hidden shadow-sm relative"
          whileHover={{ y: -6, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          {/* Image Container */}
          <div className="relative aspect-[3/4] overflow-hidden bg-accent-100">
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 280px"
              unoptimized={primaryImage.startsWith('/products/')}
              className="object-cover object-top transition-transform duration-500 group-hover:scale-110"
            />

            {/* Badges */}
            <div className="absolute bottom-3 left-3 sm:bottom-auto sm:top-3 flex flex-col gap-1.5 sm:gap-2">
              {discount > 0 && (
                <span className="bg-primary-600 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-full">
                  {discount}% OFF
                </span>
              )}
              {product.newArrival && (
                <span className="bg-accent-700 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-full">
                  NEW
                </span>
              )}
              {/* Scarcity indicator */}
              {product.stock > 0 && product.stock <= 5 && (
                <span className="bg-orange-500 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                  Only {product.stock} left!
                </span>
              )}
            </div>

            {/* Wishlist + Compare Buttons */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5">
              <button
                onClick={handleWishlist}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isWishlisted
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                <FiHeart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>

              {/* Compare button with visible hover label */}
              <div className="relative group/compare flex items-center justify-end">
                {/* Tooltip label — slides in from the right on hover */}
                <span className="absolute right-full mr-2 whitespace-nowrap bg-gray-900/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full pointer-events-none
                  opacity-0 translate-x-1 group-hover/compare:opacity-100 group-hover/compare:translate-x-0
                  transition-all duration-200">
                  {compareDisabled
                    ? 'Max 3 items'
                    : isCompared
                    ? 'Remove compare'
                    : 'Compare'}
                </span>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(product); }}
                  disabled={compareDisabled}
                  className={`p-2 rounded-full transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isCompared
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/80 text-gray-700 hover:bg-white'
                  }`}
                >
                  <FiRefreshCw size={15} />
                </button>
              </div>
            </div>

            {/* Quick Add Button */}
            <div
              className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent transform transition-all duration-300 ${
                isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
            >
              <button
                onClick={handleAddToCart}
                className="w-full bg-white text-gray-900 py-2.5 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-primary-600 hover:text-white transition-colors"
              >
                <FiShoppingBag size={18} />
                Add to Cart
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4">
            <div className="flex items-center gap-1 mb-2">
              <FiStar className="text-yellow-400 fill-yellow-400" size={14} />
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviews})
              </span>
            </div>

            <h3 className="font-medium text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>

            <p className="text-sm text-gray-500 mb-2 line-clamp-1">{product.subcategory}</p>

            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

          </div>
        </motion.div>
      </Link>
    </>
  );
}
