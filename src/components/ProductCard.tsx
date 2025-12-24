'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FiHeart, FiShoppingBag, FiStar } from 'react-icons/fi';
import { Product } from '@/lib/products';
import { useCartStore } from '@/store/cartStore';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, product.sizes[0], product.colors[0].name);
    openCart();
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div
        className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-accent-100">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <span className="bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                {discount}% OFF
              </span>
            )}
            {product.newArrival && (
              <span className="bg-accent-700 text-white text-xs font-semibold px-2 py-1 rounded-full">
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
      </div>
    </Link>
  );
}

