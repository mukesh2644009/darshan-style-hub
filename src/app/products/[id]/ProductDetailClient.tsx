'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiHeart, FiShare2, FiMinus, FiPlus, FiStar, FiTruck, FiRefreshCw, FiShield, FiChevronRight, FiCheck, FiX } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Product } from '@/lib/products';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import ProductCard from '@/components/ProductCard';
import { createWhatsAppOrderLink, createWhatsAppShareLink } from '@/components/WhatsAppButton';

function stripEmojis(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uFE00-\uFE0F]|[\u200D]|[\u20E3]|[\u2300-\u23FF]|[\u2B50-\u2B55]|[\u25A0-\u25FF]/g, '').trim();
}

function DescriptionSection({ product }: { product: Product }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <section>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm h-48 animate-pulse" />
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm h-48 animate-pulse" />
        </div>
      </section>
    );
  }

  const headingPattern = /^[\s]*(?:product\s+description|description|key\s+features?|features?|highlights?|details?|specifications?|about\s+this\s+product|package\s+contains?)\s*:?\s*$/i;
  const bulletPattern = /^[\s]*[-•*]+\s*/;

  const lines = product.description
    .split(/\n/)
    .map(l => stripEmojis(l).trim())
    .filter(l => l.length > 0);

  const descLines: string[] = [];
  const featureLines: string[] = [];
  let inFeatures = false;

  for (const line of lines) {
    if (headingPattern.test(line)) {
      if (/key\s+features?|features?|highlights?|specifications?|package\s+contains?/i.test(line)) {
        inFeatures = true;
      }
      continue;
    }

    const cleaned = line.replace(bulletPattern, '').trim();
    if (!cleaned) continue;

    if (inFeatures || bulletPattern.test(line)) {
      featureLines.push(cleaned);
      inFeatures = true;
    } else {
      descLines.push(cleaned);
    }
  }

  return (
    <section>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-600 rounded-full" />
            Product Description
          </h2>
          <div className="text-gray-600 leading-relaxed space-y-3">
            {descLines.length > 0 ? (
              descLines.map((line, idx) => <p key={idx}>{line}</p>)
            ) : (
              <p>{stripEmojis(product.description)}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-600 rounded-full" />
            Key Features
          </h2>

          {featureLines.length > 0 && (
            <div className="space-y-2.5 mb-6">
              {featureLines.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 mt-0.5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiCheck size={12} />
                  </span>
                  <span className="text-gray-700 text-sm leading-relaxed">{feat}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-0 border border-gray-100 rounded-xl overflow-hidden">
            {[
              { label: 'Category', value: product.category },
              ...(product.subcategory ? [{ label: 'Type', value: product.subcategory }] : []),
              { label: 'Available Sizes', value: product.sizes.join(', ') },
              { label: 'Available Colors', value: product.colors.map(c => c.name).join(', ') },
              { label: 'Availability', value: product.inStock ? 'In Stock' : 'Out of Stock' },
            ].map((item, idx) => (
              <div key={idx} className={`flex items-start justify-between px-4 py-2.5 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <span className="text-gray-500 text-sm">{item.label}</span>
                <span className="text-gray-900 text-sm font-medium text-right max-w-[55%]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addItem, openCart } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const isWishlisted = isInWishlist(product.id);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    if (!selectedColor) {
      alert('Please select a color');
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSize, selectedColor);
    }
    openCart();
  };

  const handleOrderOnWhatsApp = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    if (!selectedColor) {
      alert('Please select a color');
      return;
    }

    const link = createWhatsAppOrderLink(
      product.name,
      product.price,
      selectedSize,
      selectedColor,
      quantity
    );
    window.open(link, '_blank');
  };

  const handleShareWhatsApp = () => {
    const productUrl = typeof window !== 'undefined' ? window.location.href : '';
    const link = createWhatsAppShareLink(product.name, productUrl, product.price);
    window.open(link, '_blank');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-accent-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-accent-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <FiChevronRight size={14} />
            <Link href="/products" className="hover:text-primary-600">Products</Link>
            <FiChevronRight size={14} />
            <Link href={`/products?category=${product.category}`} className="hover:text-primary-600">
              {product.category}
            </Link>
            <FiChevronRight size={14} />
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white">
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-primary-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  {discount}% OFF
                </span>
              )}
              <button
                onClick={() => toggleItem(product)}
                className={`absolute top-4 right-4 p-3 rounded-full transition-all ${
                  isWishlisted ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-accent-100'
                }`}
              >
                <FiHeart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-primary-600' : 'border-transparent'
                    }`}
                  >
                    <Image src={image} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:py-4">
            {/* Category & Rating */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-primary-600 font-medium">{product.subcategory}</span>
              <div className="flex items-center gap-1">
                <FiStar className="text-yellow-400 fill-yellow-400" size={16} />
                <span className="font-medium">{product.rating}</span>
                <span className="text-gray-500">({product.reviews} reviews)</span>
              </div>
            </div>

            {/* Name & Price */}
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-gray-900">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                  <span className="text-primary-600 font-medium">
                    Save ₹{(product.originalPrice - product.price).toLocaleString()}
                  </span>
                </>
              )}
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Select Size</h3>
                <button type="button" onClick={() => setShowSizeGuide(true)} className="text-sm text-primary-600 hover:text-primary-700 underline">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                      selectedSize === size
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-accent-300 hover:border-primary-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">
                Select Color: <span className="text-gray-500 font-normal">{selectedColor || 'Choose'}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor === color.name
                        ? 'border-primary-600 ring-2 ring-primary-200'
                        : 'border-accent-300 hover:border-primary-400'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="font-medium text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white rounded-full border border-accent-300">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-accent-100 rounded-l-full transition-colors"
                  >
                    <FiMinus size={18} />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-accent-100 rounded-r-full transition-colors"
                  >
                    <FiPlus size={18} />
                  </button>
                </div>
                <span className="text-gray-500">
                  {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 mb-8">
              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>

              {/* Order on WhatsApp */}
              <button
                onClick={handleOrderOnWhatsApp}
                disabled={!product.inStock}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaWhatsapp size={20} />
                Order on WhatsApp
              </button>

              {/* Share Options */}
              <div className="flex gap-3">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-green-500 text-green-600 py-2.5 rounded-full font-medium hover:bg-green-50 transition-colors"
                >
                  <FaWhatsapp size={18} />
                  Share
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-600 py-2.5 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  <FiShare2 size={18} />
                  Copy Link
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-accent-100 rounded-2xl">
              <div className="text-center">
                <FiTruck className="mx-auto mb-2 text-primary-600" size={24} />
                <p className="text-sm font-medium text-gray-900">Free Shipping</p>
                <p className="text-xs text-gray-500">Above ₹999</p>
              </div>
              <div className="text-center">
                <FiRefreshCw className="mx-auto mb-2 text-primary-600" size={24} />
                <p className="text-sm font-medium text-gray-900">Easy Returns</p>
                <p className="text-xs text-gray-500">7 Days</p>
              </div>
              <div className="text-center">
                <FiShield className="mx-auto mb-2 text-primary-600" size={24} />
                <p className="text-sm font-medium text-gray-900">100% Genuine</p>
                <p className="text-xs text-gray-500">Authentic</p>
              </div>
            </div>

            {/* WhatsApp Help */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <FaWhatsapp className="text-green-500 flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="font-medium text-gray-900">Need Help?</p>
                  <p className="text-sm text-gray-600">
                    Chat with us on WhatsApp for size recommendations, custom orders, or any queries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description & Key Features */}
        <DescriptionSection product={product} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSizeGuide(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Size Guide</h2>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Size Chart */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  {product.category} Size Chart
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary-50 text-primary-900">
                        <th className="px-4 py-2.5 text-left font-semibold">Size</th>
                        <th className="px-4 py-2.5 text-center font-semibold">Bust (in)</th>
                        <th className="px-4 py-2.5 text-center font-semibold">Waist (in)</th>
                        <th className="px-4 py-2.5 text-center font-semibold">Hip (in)</th>
                        <th className="px-4 py-2.5 text-center font-semibold">Length (in)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: 'XS', bust: '32', waist: '26', hip: '35', length: '42' },
                        { size: 'S', bust: '34', waist: '28', hip: '37', length: '43' },
                        { size: 'M', bust: '36', waist: '30', hip: '39', length: '44' },
                        { size: 'L', bust: '38', waist: '32', hip: '41', length: '45' },
                        { size: 'XL', bust: '40', waist: '34', hip: '43', length: '46' },
                        { size: 'XXL', bust: '42', waist: '36', hip: '45', length: '47' },
                        { size: 'XXXL', bust: '44', waist: '38', hip: '47', length: '48' },
                      ].map((row, idx) => (
                        <tr key={row.size} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${product.sizes.includes(row.size) ? '' : 'opacity-40'}`}>
                          <td className="px-4 py-2.5 font-medium text-gray-900">{row.size}</td>
                          <td className="px-4 py-2.5 text-center text-gray-600">{row.bust}</td>
                          <td className="px-4 py-2.5 text-center text-gray-600">{row.waist}</td>
                          <td className="px-4 py-2.5 text-center text-gray-600">{row.hip}</td>
                          <td className="px-4 py-2.5 text-center text-gray-600">{row.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2">Sizes not available for this product are faded.</p>
              </div>

              {/* How to Measure */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">How to Measure</h3>
                <div className="space-y-2.5 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">1</span>
                    <span><strong>Bust:</strong> Measure around the fullest part of your chest.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">2</span>
                    <span><strong>Waist:</strong> Measure around the narrowest part of your waist.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">3</span>
                    <span><strong>Hip:</strong> Measure around the fullest part of your hips.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">4</span>
                    <span><strong>Length:</strong> Measure from the shoulder to the desired length.</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Tip:</strong> If you are between sizes, we recommend choosing the larger size for a comfortable fit. For any sizing help, chat with us on WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
