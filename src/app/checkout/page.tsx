'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronLeft, FiCreditCard, FiSmartphone, FiTruck } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderPlaced, setOrderPlaced] = useState(false);

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  const handlePlaceOrder = () => {
    // Simulate order placement
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-accent-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for shopping with Darshan Style Hub. Your order confirmation has been sent to your email.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Order ID: <span className="font-medium text-gray-900">#DSH{Date.now()}</span>
          </p>
          <Link href="/products" className="btn-primary inline-block">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-accent-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Your Cart is Empty
          </h1>
          <p className="text-gray-600 mb-6">
            Add some beautiful outfits to your cart before checkout
          </p>
          <Link href="/products" className="btn-primary inline-block">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50">
      {/* Header */}
      <div className="bg-white border-b border-accent-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/products" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600">
            <FiChevronLeft />
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                Shipping Information
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" className="input-field" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" className="input-field" placeholder="Doe" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="input-field" placeholder="john@example.com" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" className="input-field" placeholder="+91 98765 43210" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" className="input-field" placeholder="123 Main Street" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" className="input-field" placeholder="Bangalore" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input type="text" className="input-field" placeholder="560001" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                Payment Method
              </h2>

              <div className="space-y-3">
                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-accent-200 hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-primary-600"
                  />
                  <FiCreditCard size={24} className="text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">Credit / Debit Card</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard, RuPay</p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-accent-200 hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-primary-600"
                  />
                  <FiSmartphone size={24} className="text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">UPI</p>
                    <p className="text-sm text-gray-500">GPay, PhonePe, Paytm</p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-accent-200 hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-primary-600"
                  />
                  <FiTruck size={24} className="text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">Cash on Delivery</p>
                    <p className="text-sm text-gray-500">Pay when you receive</p>
                  </div>
                </label>
              </div>

              {paymentMethod === 'card' && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input type="text" className="input-field" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                      <input type="text" className="input-field" placeholder="MM/YY" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input type="text" className="input-field" placeholder="123" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-32">
              <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                    className="flex gap-3"
                  >
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{item.product.name}</h3>
                      <p className="text-xs text-gray-500">
                        {item.selectedSize} • {item.selectedColor} • Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field flex-1 text-sm"
                    placeholder="Enter coupon code"
                  />
                  <button className="px-4 py-2 bg-accent-100 text-accent-700 rounded-xl font-medium hover:bg-accent-200 transition-colors text-sm">
                    Apply
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-accent-200 pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-primary-600">
                    Add ₹{(999 - subtotal).toLocaleString()} more for free shipping
                  </p>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-accent-200 pt-3">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={handlePlaceOrder} className="w-full btn-primary mt-6">
                Place Order
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing this order, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

