'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiSmartphone, FiTruck, FiAlertCircle, FiLoader, FiLock, FiCopy, FiCheck, FiInfo } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { validateEmail } from '@/lib/validation';

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Rajasthan',
    pincode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('');
  const [upiCopied, setUpiCopied] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const UPI_ID = 'parvati23@boi';

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Pre-fill form with logged-in user data
  useEffect(() => {
    if (user) {
      const nameParts = (user.name || '').split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || nameParts[0] || '',
        lastName: prev.lastName || nameParts.slice(1).join(' ') || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-accent-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FiLoader className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-accent-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiLock className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Login Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please login or create an account to place your order. Your cart items will be saved.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login?redirect=/checkout"
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors inline-block"
            >
              Login to Continue
            </Link>
            <Link
              href="/register?redirect=/checkout"
              className="w-full py-3 border-2 border-primary-600 text-primary-600 rounded-xl font-medium hover:bg-primary-50 transition-colors inline-block"
            >
              Create Account
            </Link>
          </div>
          <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 mt-4 inline-block">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 999 ? 0 : 99;
  const codCharge = paymentMethod === 'cod' ? 10 : 0;
  const total = subtotal + shipping + codCharge;

  const handlePlaceOrder = async () => {
    const newErrors: Record<string, string> = {};
    
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }
    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address?.trim()) newErrors.address = 'Address is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.pincode?.trim()) newErrors.pincode = 'Pincode is required';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setOrderLoading(true);
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.selectedSize,
            color: item.selectedColor,
          })),
          shippingName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          shippingEmail: formData.email.trim(),
          shippingPhone: formData.phone.trim().replace(/\s/g, '').replace(/^\+91/, ''),
          shippingAddress: formData.address.trim(),
          shippingCity: formData.city.trim(),
          shippingState: formData.state.trim(),
          shippingPincode: formData.pincode.trim(),
          paymentMethod: paymentMethod === 'cod' ? 'COD' : 'UPI',
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setOrderId(data.id || '');
        setOrderTotal(data.total || total);
        setOrderPaymentMethod(paymentMethod === 'cod' ? 'COD' : 'UPI');
        setOrderPlaced(true);
        clearCart();
      } else {
        setErrors({ form: data.error || 'Failed to place order. Please try again.' });
      }
    } catch (error) {
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setOrderLoading(false);
    }
  };

  if (orderPlaced) {
    // UPI: Show payment screen first, then confirmation after "I have paid"
    if (orderPaymentMethod === 'UPI' && !paymentConfirmed) {
      return (
        <div className="min-h-screen bg-accent-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSmartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">
                Complete Your Payment
              </h1>
              {orderId && (
                <p className="text-sm text-gray-500">
                  Order ID: <span className="font-medium text-gray-900">#{orderId.slice(0, 8).toUpperCase()}</span>
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center mb-6">
              <p className="text-sm text-blue-600 mb-1">Amount to Pay</p>
              <p className="text-3xl font-bold text-blue-700">₹{orderTotal.toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-500 mb-2 text-center">Pay to this UPI ID</p>
              <div className="flex items-center justify-between bg-white border-2 border-dashed border-primary-300 rounded-lg px-4 py-3">
                <span className="font-mono font-bold text-lg text-gray-900">{UPI_ID}</span>
                <button
                  onClick={copyUpiId}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200 transition-colors"
                >
                  {upiCopied ? <><FiCheck className="w-4 h-4" /> Copied!</> : <><FiCopy className="w-4 h-4" /> Copy</>}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-amber-800 mb-2">How to pay:</p>
              <ol className="text-sm text-amber-700 space-y-1.5">
                <li>1. Open <strong>GPay / PhonePe / Paytm</strong></li>
                <li>2. Tap <strong>&quot;Pay to UPI ID&quot;</strong></li>
                <li>3. Enter UPI ID: <strong>{UPI_ID}</strong></li>
                <li>4. Enter amount: <strong>₹{orderTotal.toLocaleString('en-IN')}</strong></li>
                <li>5. Complete the payment</li>
              </ol>
            </div>

            <button
              onClick={() => setPaymentConfirmed(true)}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <FiCheck className="w-5 h-5" />
              I Have Completed the Payment
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Please complete the payment before clicking this button
            </p>
          </div>
        </div>
      );
    }

    // Order Confirmation Screen (shown for COD, or UPI after payment confirmed)
    return (
      <div className="min-h-screen bg-accent-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-4">
            Thank you for shopping with Darshan Style Hub. Order confirmation has been sent to your email.
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mb-4">
              Order ID: <span className="font-medium text-gray-900">#{orderId.slice(0, 8).toUpperCase()}</span>
            </p>
          )}
          {orderPaymentMethod === 'COD' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Cash on Delivery</strong> — Please keep <strong>₹{orderTotal.toLocaleString('en-IN')}</strong> ready at the time of delivery.
              </p>
            </div>
          )}
          {orderPaymentMethod === 'UPI' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6">
              <p className="text-sm text-green-800">
                <strong>UPI Payment</strong> — Your payment of <strong>₹{orderTotal.toLocaleString('en-IN')}</strong> will be verified shortly.
              </p>
            </div>
          )}
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

              {Object.keys(errors).length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
                  <FiAlertCircle className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Please fix the following:</p>
                    <ul className="mt-1 text-sm list-disc list-inside">
                      {Object.values(errors).map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                    placeholder="Doe"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FiAlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="+91 98765 43210"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`input-field ${errors.address ? 'border-red-500' : ''}`}
                    placeholder="123 Main Street"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`input-field ${errors.city ? 'border-red-500' : ''}`}
                    placeholder="Jaipur"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input-field"
                    placeholder="Rajasthan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className={`input-field ${errors.pincode ? 'border-red-500' : ''}`}
                    placeholder="302001"
                  />
                  {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
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
                    onChange={(e) => setPaymentMethod(e.target.value as 'upi' | 'cod')}
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
                    onChange={(e) => setPaymentMethod(e.target.value as 'upi' | 'cod')}
                    className="accent-primary-600"
                  />
                  <FiTruck size={24} className="text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">Cash on Delivery (COD)</p>
                    <p className="text-sm text-gray-500">Pay when you receive</p>
                  </div>
                </label>

                {paymentMethod === 'cod' && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                    <FiInfo className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <strong>₹10 extra charge</strong> will be added for Cash on Delivery. Choose UPI to avoid this charge.
                    </p>
                  </div>
                )}
              </div>
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
                {codCharge > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>COD Charge</span>
                    <span>₹{codCharge}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-accent-200 pt-3">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              {errors.form && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <FiAlertCircle /> {errors.form}
                </div>
              )}

              <button 
                onClick={handlePlaceOrder} 
                disabled={orderLoading}
                className={`w-full mt-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                  orderLoading 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {orderLoading ? 'Placing Order...' : 'Place Order'}
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

