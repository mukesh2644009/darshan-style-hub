'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FiHeart, FiShoppingBag, FiStar, FiX, FiCheck } from 'react-icons/fi';
import { Product } from '@/lib/products';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const [isHovered, setIsHovered] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const isWishlisted = isInWishlist(product.id);
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

  return (
    <Link href={`/products/${product.slug || product.id}`}>
      <motion.div
        className="group bg-white rounded-2xl overflow-hidden shadow-sm relative"
        whileHover={{ y: -6, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Size Picker Overlay */}
        <AnimatePresence>
          {showSizePicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col p-4"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">Select Size</p>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSizePicker(false); }}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <FiX size={16} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {availableSizes.map((s) => {
                  const sizeStr = typeof s === 'string' ? s : (s as { size: string }).size;
                  return (
                    <button
                      key={sizeStr}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSize(sizeStr); }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        selectedSize === sizeStr
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-gray-300 text-gray-700 hover:border-primary-400'
                      }`}
                    >
                      {sizeStr}
                    </button>
                  );
                })}
              </div>

              {product.colors.length > 1 && (
                <>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Color</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedColor(c.name); }}
                        title={c.name}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          selectedColor === c.name ? 'border-primary-600 scale-110' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={handleConfirmAdd}
                disabled={!selectedSize}
                className="mt-auto w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary-700 transition-colors"
              >
                <FiCheck size={15} />
                Add to Cart
              </button>
            </motion.div>
          )}
        </AnimatePresence>
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

          {/* Badges - Bottom on mobile, top on desktop */}
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
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${
              isWishlisted
                ? 'bg-primary-600 text-white'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            <FiHeart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

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

          {/* Color Options */}
          <div className="flex items-center gap-1.5 mt-3">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color.name}
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-xs text-gray-500">+{product.colors.length - 4}</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

