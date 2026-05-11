'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiTruck, FiAlertCircle, FiLoader, FiCheck, FiInfo, FiLock } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { validateEmail } from '@/lib/validation';
import { fbInitiateCheckout, fbPurchase } from '@/lib/facebook-pixel';
import { downloadReceipt } from '@/lib/generate-receipt';
import { FiDownload } from 'react-icons/fi';
import { gaBeginCheckout, gaPurchase } from '@/lib/google-analytics';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';
import QuickSignupModal from '@/components/QuickSignupModal';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli and Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const WHATSAPP_NUMBER = '919019076335';
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'whatsapp' | 'cod'>('upi');
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
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupPrompted, setSignupPrompted] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Prompt guests with items in cart to sign up once when they reach checkout.
  // If they close the modal, they can still continue as a guest below.
  useEffect(() => {
    if (isLoading) return;
    if (signupPrompted) return;
    if (isAuthenticated) return;
    if (items.length === 0) return;
    setShowSignupModal(true);
    setSignupPrompted(true);
  }, [isLoading, isAuthenticated, items.length, signupPrompted]);

  // Pre-fill form with logged-in user data and last saved address
  useEffect(() => {
    if (!user) return;

    const nameParts = (user.name || '').split(' ');
    const realEmail = user.email && !user.email.endsWith('@darshan.local') ? user.email : '';
    setFormData(prev => ({
      ...prev,
      firstName: prev.firstName || nameParts[0] || '',
      lastName: prev.lastName || nameParts.slice(1).join(' ') || '',
      email: prev.email || realEmail,
      phone: prev.phone || user.phone || '',
    }));

    // Fetch saved address from profile
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.address) {
          const a = data.address;
          setFormData(prev => ({
            ...prev,
            address: prev.address || a.addressLine1 || '',
            city: prev.city || a.city || '',
            state: prev.state || a.state || 'Rajasthan',
            pincode: prev.pincode || a.pincode || '',
          }));
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (items.length > 0) {
      // Facebook Pixel - begin checkout
      fbInitiateCheckout(
        items.map(item => item.product.id),
        getTotalPrice(),
        items.reduce((sum, item) => sum + item.quantity, 0)
      );
      
      // Google Analytics - begin checkout
      gaBeginCheckout(
        items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          category: item.product.category,
          price: item.product.price,
          quantity: item.quantity,
        })),
        getTotalPrice()
      );
    }
  }, []);

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

  // Guest checkout is allowed — no login required

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 999 ? 0 : 99;
  const codCharge = paymentMethod === 'cod' ? 50 : 0;
  const total = subtotal + shipping + codCharge;

  const handlePlaceOrder = async () => {
    const newErrors: Record<string, string> = {};
    
    // Email is optional for OTP-verified users
    if (formData.email?.trim()) {
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
    }
    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
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
          paymentMethod: paymentMethod === 'cod' ? 'COD' : paymentMethod === 'upi' ? 'UPI (Razorpay)' : 'UPI (WhatsApp)',
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (paymentMethod === 'upi') {
          await initiateRazorpay(data.id, data.total || total);
        } else {
          setOrderId(data.id || '');
          setOrderTotal(data.total || total);
          setOrderPaymentMethod(paymentMethod === 'cod' ? 'COD' : 'WHATSAPP');
          setOrderPlaced(true);

          // Facebook Pixel - purchase
          fbPurchase(
            data.id || '',
            items.map(item => item.product.id),
            data.total || total,
            items.reduce((sum, item) => sum + item.quantity, 0),
            formData.email,
            formData.phone
          );

          // Google Analytics - purchase
          gaPurchase(
            data.id || '',
            items.map(item => ({
              id: item.product.id,
              name: item.product.name,
              category: item.product.category,
              price: item.product.price,
              quantity: item.quantity,
            })),
            data.total || total,
            shipping,
            paymentMethod === 'cod' ? 'COD' : 'WhatsApp'
          );

          clearCart();
        }
      } else {
        setErrors({ form: data.error || 'Failed to place order. Please try again.' });
      }
    } catch (error) {
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setOrderLoading(false);
    }
  };

  const initiateRazorpay = async (orderDbId: string, amount: number) => {
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, orderId: orderDbId }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrors({ form: data.error || 'Failed to initiate payment' });
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'Darshan Style Hub™',
        description: `Order Payment`,
        order_id: data.orderId,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: '#9F580A' },
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderDbId,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setOrderId(orderDbId);
            setOrderTotal(amount);
            setOrderPaymentMethod('UPI');
            setOrderPlaced(true);

            // Facebook Pixel - purchase
            fbPurchase(
              orderDbId,
              items.map(item => item.product.id),
              amount,
              items.reduce((sum, item) => sum + item.quantity, 0),
              formData.email,
              formData.phone
            );

            // Google Analytics - purchase
            gaPurchase(
              orderDbId,
              items.map(item => ({
                id: item.product.id,
                name: item.product.name,
                category: item.product.category,
                price: item.product.price,
                quantity: item.quantity,
              })),
              amount,
              0,
              'UPI'
            );

            clearCart();
          } else {
            setErrors({ form: 'Payment verification failed. Please contact support.' });
          }
        },
        modal: {
          ondismiss: function () {
            setErrors({ form: 'Payment was cancelled. Your order has been saved — you can retry payment.' });
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      setErrors({ form: 'Failed to initiate payment. Please try again.' });
    }
  };

  const handleDownloadReceipt = () => {
    const subtotalVal = items.length > 0
      ? items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      : orderTotal;
    const shippingVal = subtotalVal >= 999 ? 0 : 99;
    const codVal = orderPaymentMethod === 'COD' ? 50 : 0;

    downloadReceipt({
      orderId: orderId,
      orderDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      customerName: `${formData.firstName} ${formData.lastName}`,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      shippingAddress: formData.address,
      shippingCity: formData.city,
      shippingState: formData.state,
      shippingPincode: formData.pincode,
      paymentMethod: orderPaymentMethod === 'UPI' ? 'UPI (Razorpay)' : orderPaymentMethod === 'WHATSAPP' ? 'UPI (WhatsApp)' : 'Cash on Delivery',
      paymentStatus: orderPaymentMethod === 'UPI' ? 'Paid' : orderPaymentMethod === 'COD' ? 'Confirmed (Pay on Delivery)' : 'Pending',
      items: items.length > 0
        ? items.map(item => ({
            name: item.product.name,
            size: item.selectedSize,
            color: item.selectedColor,
            quantity: item.quantity,
            price: item.product.price,
          }))
        : [{ name: 'Order Items', size: '-', color: '', quantity: 1, price: orderTotal }],
      subtotal: subtotalVal,
      shipping: shippingVal,
      codCharge: codVal,
      total: orderTotal,
    });
  };

  if (orderPlaced) {
    const orderIdShort = orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : '';

    const orderWhatsAppMsg = [
      `🛍️ *Order Confirmed — Darshan Style Hub*`,
      ``,
      `Order ID: ${orderIdShort}`,
      `Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      ``,
      `*Items:*`,
      ...(items.length > 0
        ? items.map(item => `• ${item.product.name}${item.selectedSize ? ` (${item.selectedSize})` : ''} x${item.quantity} — ₹${(item.product.price * item.quantity).toLocaleString('en-IN')}`)
        : [`• Order Items — ₹${orderTotal.toLocaleString('en-IN')}`]),
      ``,
      `*Total: ₹${orderTotal.toLocaleString('en-IN')}*`,
      `Payment: ${orderPaymentMethod === 'UPI' ? 'Paid via UPI' : orderPaymentMethod === 'WHATSAPP' ? 'UPI via WhatsApp' : 'Cash on Delivery'}`,
      ``,
      `Ship to: ${formData.firstName} ${formData.lastName}, ${formData.city} ${formData.pincode}`,
      ``,
      `Thank you for shopping with us! 🙏`,
      `🌐 darshanstylehub.com`,
    ].join('\n');

    const selfWhatsAppUrl = `https://wa.me/${formData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(orderWhatsAppMsg)}`;
    const whatsappPaymentMsg = `Hi! I just placed an order on Darshan Style Hub.\n\nOrder ID: ${orderIdShort}\nAmount: ₹${orderTotal.toLocaleString('en-IN')}\nName: ${formData.firstName} ${formData.lastName}\nPhone: ${formData.phone}\n\nPlease share the payment QR code or link.\n\n🌐 Website: https://www.darshanstylehub.com\n📸 Instagram: https://www.instagram.com/stylehubjaipur/\n📘 Facebook: https://www.facebook.com/profile.php?id=61587889244337`;
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappPaymentMsg)}`;

    // UPI Payment Success Screen
    if (orderPaymentMethod === 'UPI') {
      return (
        <div className="min-h-screen bg-accent-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheck className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-4">
              Thank you for shopping with Darshan Style Hub. Your payment has been confirmed.
            </p>
            {orderId && (
              <p className="text-sm text-gray-500 mb-4">
                Order ID: <span className="font-medium text-gray-900">{orderIdShort}</span>
              </p>
            )}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-600 mb-1">Amount Paid</p>
              <p className="text-3xl font-bold text-green-700">₹{orderTotal.toLocaleString('en-IN')}</p>
              <p className="text-xs text-green-600 mt-1">Paid via UPI</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Order confirmation has been sent to your email.
            </p>
            <button
              onClick={handleDownloadReceipt}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <FiDownload /> Download Receipt
            </button>
            <a
              href={selfWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <FaWhatsapp className="w-5 h-5" /> Send to My WhatsApp
            </a>
            <Link href="/products" className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center inline-block">
              Continue Shopping
            </Link>
          </div>
        </div>
      );
    }

    // WhatsApp payment: show WhatsApp redirect screen
    if (orderPaymentMethod === 'WHATSAPP') {
      return (
        <div className="min-h-screen bg-accent-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaWhatsapp className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
                Order Placed Successfully!
              </h1>
              {orderId && (
                <p className="text-sm text-gray-500">
                  Order ID: <span className="font-medium text-gray-900">{orderIdShort}</span>
                </p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-6">
              <p className="text-sm text-green-600 mb-1">Amount to Pay</p>
              <p className="text-3xl font-bold text-green-700">₹{orderTotal.toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-800 text-center">
                Tap the button below to connect with us on WhatsApp. We&apos;ll send you a <strong>payment QR code / link</strong> to complete your order.
              </p>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-lg"
            >
              <FaWhatsapp className="w-6 h-6" />
              Chat on WhatsApp to Pay
            </a>

            <p className="text-xs text-gray-400 text-center mt-4 mb-6">
              Order confirmation has also been sent to your email
            </p>

            <button
              onClick={handleDownloadReceipt}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <FiDownload /> Download Receipt
            </button>
            <Link href="/products" className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center inline-block">
              Continue Shopping
            </Link>
          </div>
        </div>
      );
    }

    // COD Confirmation Screen
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
              Order ID: <span className="font-medium text-gray-900">{orderIdShort}</span>
            </p>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Cash on Delivery</strong> — Please keep <strong>₹{orderTotal.toLocaleString('en-IN')}</strong> ready at the time of delivery.
            </p>
          </div>
          <button
            onClick={handleDownloadReceipt}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 mb-3"
          >
            <FiDownload /> Download Receipt
          </button>
          <a
            href={selfWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mb-3"
          >
            <FaWhatsapp className="w-5 h-5" /> Send to My WhatsApp
          </a>
          <Link href="/products" className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center inline-block">
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
      {/* Back link (all screens) */}
      <div className="bg-white border-b border-accent-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link href="/products" className="inline-flex items-center gap-1 text-gray-600 hover:text-primary-600 text-sm">
            <FiChevronLeft size={16} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {/* Mobile fixed bottom bar — total + place order button always visible */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-accent-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-500 leading-none">{items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}</p>
          <p className="text-lg font-bold text-primary-700 leading-tight">₹{total.toLocaleString('en-IN')}</p>
        </div>
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={orderLoading}
          className={`flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors ${
            orderLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {orderLoading ? <><FiLoader className="animate-spin w-4 h-4" /> Placing…</> : 'Place Order'}
        </button>
      </div>

      {/* Extra bottom padding on mobile to account for fixed bottom bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 lg:pb-8">
        <h1 className="font-display text-xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Checkout</h1>

        <form onSubmit={(e) => { e.preventDefault(); handlePlaceOrder(); }} className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 min-w-0 space-y-4 sm:space-y-6">
            {/* Shipping Info */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
              <h2 className="font-display text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <span className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                  1
                </span>
                <span>Shipping Info</span>
              </h2>

              {!isAuthenticated && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-blue-800">
                  <FiInfo className="flex-shrink-0 mt-0.5 w-4 h-4" />
                  <p className="text-sm">Checking out as <strong>guest</strong>. <Link href="/login?redirect=/checkout" className="underline font-medium">Login</Link> to track your order easily.</p>
                </div>
              )}

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Last Name</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="For order confirmation email (optional)"
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
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input-field bg-white"
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
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
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
              <h2 className="font-display text-base sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <span className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                  2
                </span>
                <span>Payment</span>
              </h2>

              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-accent-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'upi' | 'whatsapp' | 'cod')}
                    className="accent-blue-600 flex-shrink-0"
                  />
                  <FiLock size={20} className="text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Pay Online (UPI / Card)</p>
                    <p className="text-xs sm:text-sm text-gray-500">Secure via Razorpay</p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'whatsapp'
                      ? 'border-green-500 bg-green-50'
                      : 'border-accent-200 hover:border-green-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="whatsapp"
                    checked={paymentMethod === 'whatsapp'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'upi' | 'whatsapp' | 'cod')}
                    className="accent-green-600 flex-shrink-0"
                  />
                  <FaWhatsapp size={20} className="text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Pay via WhatsApp</p>
                    <p className="text-xs sm:text-sm text-gray-500">Get payment QR on WhatsApp</p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
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
                    onChange={(e) => setPaymentMethod(e.target.value as 'upi' | 'whatsapp' | 'cod')}
                    className="accent-primary-600 flex-shrink-0"
                  />
                  <FiTruck size={20} className="text-primary-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Cash on Delivery</p>
                    <p className="text-xs sm:text-sm text-gray-500">Pay when you receive</p>
                  </div>
                </label>

                {paymentMethod === 'cod' && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                    <FiInfo className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <strong>₹50 extra charge</strong> will be added for Cash on Delivery. Choose online payment to avoid this charge.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 order-first lg:order-none min-w-0 w-full">
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm lg:sticky lg:top-32 overflow-hidden">
              <h2 className="font-display text-base sm:text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              {/* Items — hidden on mobile to keep it compact, visible on lg */}
              <div className="hidden lg:block space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                    className="flex gap-3"
                  >
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={normalizeProductImageUrl(item.product.images?.[0]) || '/products/logo.jpeg'}
                        alt={item.product.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{item.product.name}</h3>
                      <p className="text-xs text-gray-500">
                        {item.selectedSize} • {item.selectedColor} • Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile: compact item list */}
              <div className="lg:hidden space-y-1.5 mb-4">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className="w-full flex justify-between items-baseline gap-2 text-sm">
                    <span className="text-gray-700 truncate min-w-0 flex-1">{item.product.name} ×{item.quantity}</span>
                    <span className="font-medium text-gray-900 flex-shrink-0">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-accent-200 pt-3">
                <div className="w-full flex justify-between items-center text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="flex-shrink-0">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full flex justify-between items-center text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className="flex-shrink-0">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-primary-600">Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free shipping</p>
                )}
                {codCharge > 0 && (
                  <div className="w-full flex justify-between items-center text-sm text-gray-600">
                    <span>COD Charge</span>
                    <span className="flex-shrink-0">₹{codCharge}</span>
                  </div>
                )}
                <div className="w-full flex justify-between items-center text-base font-bold border-t border-accent-200 pt-3">
                  <span>Total</span>
                  <span className="flex-shrink-0 text-primary-700">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {errors.form && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <FiAlertCircle className="flex-shrink-0" /> {errors.form}
                </div>
              )}

              {/* Place Order button — desktop only; mobile uses fixed bottom bar */}
              <button
                type="submit"
                disabled={orderLoading}
                className={`hidden lg:flex w-full mt-5 py-3 rounded-xl font-medium items-center justify-center gap-2 transition-colors ${
                  orderLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {orderLoading ? <><FiLoader className="animate-spin w-4 h-4" /> Placing Order…</> : 'Place Order'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3 hidden lg:block">
                By placing this order, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </form>
      </div>

      <QuickSignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={() => {
          setShowSignupModal(false);
          checkAuth();
        }}
      />
    </div>
  );
}

