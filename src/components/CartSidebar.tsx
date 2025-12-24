'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-accent-200">
          <div className="flex items-center gap-2">
            <FiShoppingBag size={24} className="text-primary-600" />
            <h2 className="text-xl font-display font-bold">Your Cart</h2>
            <span className="bg-primary-100 text-primary-700 text-sm px-2 py-0.5 rounded-full">
              {items.length} items
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-accent-100 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FiShoppingBag size={64} className="text-accent-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Looks like you haven't added anything yet</p>
              <button
                onClick={closeCart}
                className="bg-primary-600 text-white px-6 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                className="flex gap-4 bg-accent-50 rounded-xl p-3"
              >
                {/* Product Image */}
                <div className="relative w-24 h-28 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{item.product.name}</h3>
                  <p className="text-sm text-gray-500">
                    {item.selectedSize} • {item.selectedColor}
                  </p>
                  <p className="text-primary-600 font-bold mt-1">
                    ₹{item.product.price.toLocaleString()}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center bg-white rounded-full border border-accent-200">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.selectedSize,
                            item.selectedColor,
                            item.quantity - 1
                          )
                        }
                        className="p-1.5 hover:bg-accent-100 rounded-full transition-colors"
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.selectedSize,
                            item.selectedColor,
                            item.quantity + 1
                          )
                        }
                        className="p-1.5 hover:bg-accent-100 rounded-full transition-colors"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        removeItem(item.product.id, item.selectedSize, item.selectedColor)
                      }
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-accent-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-xl font-bold">₹{getTotalPrice().toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Shipping calculated at checkout</p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-primary-600 text-white text-center py-3 rounded-full font-medium hover:bg-primary-700 transition-colors"
            >
              Proceed to Checkout
            </Link>
            <button
              onClick={closeCart}
              className="w-full mt-2 text-gray-600 py-2 text-center hover:text-primary-600 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

