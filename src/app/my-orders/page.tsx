'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';
import {
  FiPackage, FiShoppingBag, FiLoader, FiArrowLeft, FiTrash2,
  FiDownload, FiRotateCcw, FiAlertTriangle, FiX, FiTruck,
  FiCheckCircle, FiClock, FiXCircle, FiMapPin, FiRefreshCw, FiCreditCard, FiAward,
} from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import ReturnRequestModal from '@/components/ReturnRequestModal';
import { RETURN_REASONS } from '@/lib/return-reasons';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
  product: {
    name: string;
    category: string;
    sizes: Array<{ size: string; quantity?: number }>;
    colors: Array<{ name: string; hex?: string }>;
    images: Array<{ url: string }>;
  };
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  orderType?: string;
  parentOrderId?: string | null;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingPartner?: string | null;
  awbNumber?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  nimbusStatus?: string | null;
  items: OrderItem[];
  returnRequest?: {
    id: string;
    status: string;
    reason: string;
    createdAt: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; bg: string; text: string; dot: string }> = {
  PENDING:            { label: 'Pending',            icon: FiClock,        bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-400'  },
  CONFIRMED:          { label: 'Confirmed',          icon: FiCheckCircle,  bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  SHIPPED:            { label: 'Shipped',            icon: FiTruck,        bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500'  },
  DELIVERED:          { label: 'Delivered',          icon: FiPackage,      bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500'   },
  CANCELLED:          { label: 'Cancelled',          icon: FiXCircle,      bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400'     },
  RETURN_REQUESTED:   { label: 'Return Requested',   icon: FiRotateCcw,    bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400'  },
  RETURN_APPROVED:    { label: 'Return Approved',    icon: FiRotateCcw,    bg: 'bg-orange-100', text: 'text-orange-800',  dot: 'bg-orange-500'  },
  RETURNED:           { label: 'Returned',           icon: FiCheckCircle,  bg: 'bg-gray-100',   text: 'text-gray-600',    dot: 'bg-gray-400'    },
  EXCHANGE_REQUESTED: { label: 'Exchange Requested', icon: FiRefreshCw,    bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-400'     },
  EXCHANGE_APPROVED:  { label: 'Exchange Approved',  icon: FiRefreshCw,    bg: 'bg-sky-100',    text: 'text-sky-800',     dot: 'bg-sky-500'     },
  EXCHANGED:          { label: 'Exchanged',          icon: FiCheckCircle,  bg: 'bg-teal-50',    text: 'text-teal-700',    dot: 'bg-teal-400'    },
};

const RETURN_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:   { label: 'Pending review', bg: 'bg-amber-100',  text: 'text-amber-800'  },
  APPROVED:  { label: 'Approved',       bg: 'bg-blue-100',   text: 'text-blue-800'   },
  REJECTED:  { label: 'Rejected',       bg: 'bg-red-100',    text: 'text-red-700'    },
  COMPLETED: { label: 'Completed',      bg: 'bg-green-100',  text: 'text-green-800'  },
};

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [returnModalType, setReturnModalType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null);
  const [cancellingPending, setCancellingPending] = useState<string | null>(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState<number | null>(null);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetch('/api/loyalty').then(r => r.json()).then(d => {
        if (d.balance !== undefined) setLoyaltyBalance(d.balance);
      }).catch(() => {});
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/my-orders');
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!cancelOrderId) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/my-orders/${cancelOrderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setCancelOrderId(null); fetchOrders(); }
    } catch (e) {
      console.error(e);
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadReceipt = async (order: Order) => {
    setDownloadingInvoice(order.id);
    try {
      const res = await fetch(`/api/my-orders/invoice?orderId=${order.id}`);
      if (!res.ok) throw new Error('Failed to generate invoice');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DSH-Invoice-${order.id.slice(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not download invoice. Please try again.');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleRetryPayment = async (order: Order) => {
    setRetryingPayment(order.id);
    try {
      const res = await fetch('/api/razorpay/retry-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to initiate payment. Please try again.');
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'Darshan Style Hub™',
        description: 'Order Payment',
        order_id: data.razorpayOrderId,
        prefill: { name: order.shippingName, contact: order.shippingPhone },
        theme: { color: '#9F580A' },
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.id,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            fetchOrders(); // refresh the order list to show updated status
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: function () {
            setRetryingPayment(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setRetryingPayment(null);
    }
  };

  const handleEditPendingOrder = async (orderId: string) => {
    setCancellingPending(orderId);
    try {
      // Cancel the pending unpaid order so it doesn't linger in DB
      await fetch(`/api/my-orders/${orderId}`, { method: 'DELETE' });
      // Cart items are still in store (clearCart only runs after successful payment)
      // Take them straight to checkout to edit and re-place
      router.push('/checkout');
    } catch {
      // Even if cancel fails, still go to checkout — order will stay as PENDING
      router.push('/checkout');
    } finally {
      setCancellingPending(null);
    }
  };

  const returnReasonLabel = (code: string) => RETURN_REASONS.find(r => r.value === code)?.label ?? code;

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-accent-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-5 transition-colors">
            <FiArrowLeft className="w-4 h-4" />
            Back to shop
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-500 mt-1 text-sm">
                {user?.name}
                <span className="mx-2 text-gray-300">·</span>
                <Link href="/returns" className="text-primary-600 hover:underline underline-offset-2">
                  Returns & exchange policy
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Loyalty Points Card */}
          {loyaltyBalance !== null && (
            <div className="mt-5 flex items-center gap-4 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl px-5 py-4 text-white shadow-sm">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <FiAward className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-100">Your Loyalty Points</p>
                <p className="text-2xl font-bold leading-tight">
                  {loyaltyBalance.toLocaleString('en-IN')}
                  <span className="text-sm font-normal text-primary-200 ml-1.5">pts</span>
                </p>
                <p className="text-xs text-primary-200 mt-0.5">
                  = ₹{Math.floor(loyaltyBalance / 10).toLocaleString('en-IN')} discount at checkout · 1 pt per ₹10 spent
                </p>
              </div>
              {loyaltyBalance > 0 && (
                <Link
                  href="/products"
                  className="shrink-0 text-xs font-semibold bg-white text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Shop now
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Empty state */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <FiShoppingBag className="w-9 h-9 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-7 text-sm">When you place an order it will show up here.</p>
            <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors">
              <FiShoppingBag className="w-4 h-4" />
              Browse products
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const replacementForThis = orders.find(o => o.orderType === 'REPLACEMENT' && o.parentOrderId === order.id);
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['PENDING'];
              const StatusIcon = cfg.icon;
              const isReplacement = order.orderType === 'REPLACEMENT';
              const isFailedPayment =
                order.paymentMethod !== 'COD' &&
                (order.paymentStatus === 'FAILED' || order.paymentStatus === 'PENDING');
              const canRetryPayment =
                order.paymentMethod?.includes('Razorpay') &&
                order.paymentStatus === 'PENDING' &&
                order.status === 'PENDING';
              const canCancel = !isReplacement && !isFailedPayment && ['PENDING', 'CONFIRMED'].includes(order.status);
              const daysSinceUpdate = (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
              // Return window: at least 1 day after delivery (item in hand), and within 7 days
              const withinReturnWindow = daysSinceUpdate >= 1 && daysSinceUpdate <= 7;
              const returnFlowStatuses = ['RETURN_REQUESTED','RETURN_APPROVED','RETURNED','EXCHANGE_REQUESTED','EXCHANGE_APPROVED','EXCHANGED'];
              const inReturnFlow = returnFlowStatuses.includes(order.status);
              const canReturn = !isReplacement && order.status === 'DELIVERED' && !order.returnRequest && !inReturnFlow && withinReturnWindow;
              const hasSaree = order.items.some(item => item.product.category?.toLowerCase().includes('saree'));
              const rCfg = order.returnRequest ? (RETURN_STATUS_CONFIG[order.returnRequest.status] ?? RETURN_STATUS_CONFIG['PENDING']) : null;

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* Card header */}
                  <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <StatusIcon className={`w-4 h-4 ${cfg.text}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono font-semibold text-gray-900 text-sm">DSH{order.id.slice(0, 8).toUpperCase()}</p>
                          {isReplacement && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold uppercase tracking-wide">
                              <FiRefreshCw className="w-3 h-3" /> Replacement · FREE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                          <span className="mx-1">·</span>
                          {isReplacement ? 'Free exchange' : order.paymentMethod}
                          {isReplacement && order.parentOrderId && (
                            <>
                              <span className="mx-1">·</span>
                              for DSH{order.parentOrderId.slice(0, 8).toUpperCase()}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    {isFailedPayment ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 bg-red-50 text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        Transaction Cancelled
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    )}
                  </div>

                  {/* Payment pending banner — Razorpay order not yet paid */}
                  {canRetryPayment && (
                    <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <FiClock className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-xs font-semibold text-amber-700">Payment pending — pay now or edit your cart before paying</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditPendingOrder(order.id)}
                          disabled={cancellingPending === order.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-700 text-xs font-semibold hover:bg-amber-50 transition-colors disabled:opacity-60"
                        >
                          {cancellingPending === order.id
                            ? <FiLoader className="w-3 h-3 animate-spin" />
                            : <FiRotateCcw className="w-3 h-3" />
                          }
                          Edit Cart
                        </button>
                        <button
                          onClick={() => handleRetryPayment(order)}
                          disabled={retryingPayment === order.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
                        >
                          {retryingPayment === order.id
                            ? <FiLoader className="w-3 h-3 animate-spin" />
                            : <FiCreditCard className="w-3 h-3" />
                          }
                          Pay Now
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Transaction cancelled banner */}
                  {isFailedPayment && !canRetryPayment && (
                    <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                      <FiXCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Transaction Cancelled — Payment not received</p>
                    </div>
                  )}

                  {/* Items */}
                  <div className="px-5 py-4 space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-accent-100 shrink-0">
                            {item.product.images?.[0]?.url ? (
                              <Image
                                src={normalizeProductImageUrl(item.product.images[0].url) || '/products/logo.jpeg'}
                                alt={item.product.name}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FiPackage className="w-4 h-4 text-primary-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{item.product.name}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {item.size && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Size: {item.size}</span>
                              )}
                              {item.color && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Color: {item.color}</span>
                              )}
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Qty: {item.quantity}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 shrink-0">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Delivery address strip */}
                  <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                    <FiMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-500 truncate">
                      {order.shippingAddress}, {order.shippingCity}, {order.shippingState} — {order.shippingPincode}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-base font-bold text-gray-900">
                      ₹{order.total.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-gray-400 ml-2">total</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.shippingPartner === 'NIMBUSPOST' && order.awbNumber && !['CANCELLED'].includes(order.status) && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs font-semibold">
                          <FiTruck className="w-3.5 h-3.5" />
                          AWB: {order.awbNumber}
                        </span>
                      )}

                      {order.trackingUrl && !['CANCELLED'].includes(order.status) && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors text-xs font-medium"
                        >
                          <FiTruck className="w-3.5 h-3.5" />
                          Track shipment
                        </a>
                      )}

                      {/* Invoice — hide for returned/exchanged orders and failed payments */}
                      {!['RETURNED', 'EXCHANGED'].includes(order.status) && !isFailedPayment && (
                        <button
                          onClick={() => handleDownloadReceipt(order)}
                          disabled={downloadingInvoice === order.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium disabled:opacity-60"
                        >
                          {downloadingInvoice === order.id
                            ? <FiLoader className="w-3.5 h-3.5 animate-spin" />
                            : <FiDownload className="w-3.5 h-3.5" />
                          }
                          Invoice
                        </button>
                      )}

                      {/* Pay Now + Edit Cart — for pending UPI/Razorpay orders */}
                      {canRetryPayment && (
                        <>
                          <button
                            onClick={() => handleEditPendingOrder(order.id)}
                            disabled={cancellingPending === order.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium disabled:opacity-60"
                          >
                            {cancellingPending === order.id
                              ? <FiLoader className="w-3.5 h-3.5 animate-spin" />
                              : <FiRotateCcw className="w-3.5 h-3.5" />
                            }
                            Edit Cart
                          </button>
                          <button
                            onClick={() => handleRetryPayment(order)}
                            disabled={retryingPayment === order.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors text-xs font-semibold disabled:opacity-60"
                          >
                            {retryingPayment === order.id
                              ? <FiLoader className="w-3.5 h-3.5 animate-spin" />
                              : <FiCreditCard className="w-3.5 h-3.5" />
                            }
                            {retryingPayment === order.id ? 'Opening…' : 'Pay Now'}
                          </button>
                        </>
                      )}

                      {/* Cancel */}
                      {canCancel && (
                        <button
                          onClick={() => setCancelOrderId(order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-medium"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                          Cancel order
                        </button>
                      )}

                      {/* Return */}
                      {canReturn && (
                        <button
                          onClick={() => { setReturnModalType('RETURN'); setReturnModalOrder(order); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors text-xs font-medium"
                        >
                          <FiRotateCcw className="w-3.5 h-3.5" />
                          Return
                        </button>
                      )}

                      {/* Exchange — hidden for sarees (each is a unique, single-piece item) */}
                      {canReturn && !hasSaree && (
                        <button
                          onClick={() => { setReturnModalType('EXCHANGE'); setReturnModalOrder(order); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-medium"
                        >
                          <FiRefreshCw className="w-3.5 h-3.5" />
                          Exchange
                        </button>
                      )}
                    </div>
                  </div>

                  {order.shippingPartner === 'NIMBUSPOST' && (order.courierName || order.nimbusStatus) && !['CANCELLED'].includes(order.status) && (
                    <div className="px-5 py-2 border-t border-gray-100 bg-sky-50/50 flex flex-wrap items-center gap-x-4 gap-y-1">
                      {order.courierName && (
                        <p className="text-xs text-sky-700">
                          <span className="font-semibold">Courier:</span> {order.courierName}
                        </p>
                      )}
                      {order.nimbusStatus && (
                        <p className="text-xs text-sky-700">
                          <span className="font-semibold">Shipping status:</span> {order.nimbusStatus}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Return / exchange flow status banner */}
                  {inReturnFlow && (
                    <div className={`px-5 py-3 border-t border-gray-100 flex items-center gap-3 ${cfg.bg}`}>
                      <StatusIcon className={`w-4 h-4 shrink-0 ${cfg.text}`} />
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</p>
                        {order.status === 'RETURN_REQUESTED'   && <p className="text-xs text-gray-500 mt-0.5">We have received your return request. Our team will review it shortly.</p>}
                        {order.status === 'RETURN_APPROVED'    && <p className="text-xs text-gray-500 mt-0.5">Return approved! We will schedule a pickup soon. Refund will be processed after we receive the item.</p>}
                        {order.status === 'RETURNED'           && <p className="text-xs text-gray-500 mt-0.5">Your return is complete and refund has been processed.</p>}
                        {order.status === 'EXCHANGE_REQUESTED' && <p className="text-xs text-gray-500 mt-0.5">We have received your exchange request. Our team will review it shortly.</p>}
                        {order.status === 'EXCHANGE_APPROVED'  && <p className="text-xs text-gray-500 mt-0.5">Exchange approved! We are preparing your replacement item.</p>}
                        {order.status === 'EXCHANGED'          && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Exchange fulfilled! {replacementForThis ? (
                              <>Track your replacement on order <span className="font-mono font-semibold text-gray-700">DSH{replacementForThis.id.slice(0, 8).toUpperCase()}</span> below.</>
                            ) : 'Your new item is on its way.'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Return window expired or not yet open notice */}
                  {order.status === 'DELIVERED' && !order.returnRequest && !inReturnFlow && !withinReturnWindow && (
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {daysSinceUpdate < 1
                          ? 'Return & exchange will be available once your delivery is confirmed (within 24 hrs)'
                          : 'Return & exchange window closed (7-day policy)'}
                      </span>
                    </div>
                  )}

                  {/* Return request banner (legacy — returnRequest record exists but order status not yet migrated) */}
                  {order.returnRequest && rCfg && !inReturnFlow && (
                    <div className={`px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3 ${rCfg.bg}`}>
                      <p className={`text-xs font-medium ${rCfg.text}`}>
                        Request: {returnReasonLabel(order.returnRequest.reason)}
                      </p>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-white/70 ${rCfg.text}`}>
                        {rCfg.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return / Exchange modal */}
      {returnModalOrder && (
        <ReturnRequestModal
          order={returnModalOrder}
          requestType={returnModalType}
          onClose={() => setReturnModalOrder(null)}
          onSuccess={() => { fetchOrders(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      )}

      {/* Cancel confirmation modal */}
      {cancelOrderId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !cancelling && setCancelOrderId(null)}
          role="presentation"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fadeIn"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-labelledby="cancel-modal-title"
          >
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h2 id="cancel-modal-title" className="text-xl font-bold text-gray-900 text-center mb-2">
              Cancel this order?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Order <span className="font-mono font-semibold text-gray-700">DSH{cancelOrderId.slice(0, 8).toUpperCase()}</span> will be cancelled. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelOrderId(null)}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep order
              </button>
              <button
                onClick={cancelOrder}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {cancelling
                  ? <><FiLoader className="animate-spin w-4 h-4" /> Cancelling…</>
                  : <><FiX className="w-4 h-4" /> Yes, cancel</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
