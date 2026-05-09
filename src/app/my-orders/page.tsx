'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiPackage, FiShoppingBag, FiLoader, FiArrowLeft, FiTrash2,
  FiDownload, FiRotateCcw, FiAlertTriangle, FiX, FiTruck,
  FiCheckCircle, FiClock, FiXCircle, FiMapPin, FiRefreshCw,
} from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import { downloadReceipt } from '@/lib/generate-receipt';
import ReturnRequestModal from '@/components/ReturnRequestModal';
import { RETURN_REASONS } from '@/lib/return-reasons';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
  product: { name: string; sizes: string[]; colors: string[] };
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
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

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) fetchOrders();
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

  const handleDownloadReceipt = (order: Order) => {
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= 999 ? 0 : 99;
    const codCharge = order.paymentMethod === 'COD' ? 50 : 0;
    downloadReceipt({
      orderId: order.id,
      orderDate: new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }),
      customerName: order.shippingName,
      customerEmail: order.shippingEmail,
      customerPhone: order.shippingPhone,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPincode: order.shippingPincode,
      paymentMethod: order.paymentMethod || 'N/A',
      paymentStatus: order.paymentMethod === 'COD' ? 'Confirmed (Pay on Delivery)' : (order.paymentStatus || 'Pending'),
      items: order.items.map(item => ({ name: item.product.name, size: item.size, color: item.color, quantity: item.quantity, price: item.price })),
      subtotal, shipping, codCharge, total: order.total,
    });
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
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['PENDING'];
              const StatusIcon = cfg.icon;
              const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);
              const daysSinceUpdate = (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
              const withinReturnWindow = daysSinceUpdate <= 7;
              const returnFlowStatuses = ['RETURN_REQUESTED','RETURN_APPROVED','RETURNED','EXCHANGE_REQUESTED','EXCHANGE_APPROVED','EXCHANGED'];
              const inReturnFlow = returnFlowStatuses.includes(order.status);
              const canReturn = order.status === 'DELIVERED' && !order.returnRequest && !inReturnFlow && withinReturnWindow;
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
                        <p className="font-mono font-semibold text-gray-900 text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                          <span className="mx-1">·</span>
                          {order.paymentMethod}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="px-5 py-4 space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center shrink-0 mt-0.5">
                            <FiPackage className="w-4 h-4 text-primary-600" />
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
                      {/* Receipt — hide for returned/exchanged orders */}
                      {!['RETURNED', 'EXCHANGED'].includes(order.status) && (
                        <button
                          onClick={() => handleDownloadReceipt(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-xs font-medium"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                          Receipt
                        </button>
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

                      {/* Exchange */}
                      {canReturn && (
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
                        {order.status === 'EXCHANGED'          && <p className="text-xs text-gray-500 mt-0.5">Exchange fulfilled! Your new item is on its way.</p>}
                      </div>
                    </div>
                  )}

                  {/* Return window expired notice */}
                  {order.status === 'DELIVERED' && !order.returnRequest && !inReturnFlow && !withinReturnWindow && (
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Return & exchange window closed (7-day policy)</span>
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
          onSuccess={fetchOrders}
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
              Order <span className="font-mono font-semibold text-gray-700">#{cancelOrderId.slice(0, 8).toUpperCase()}</span> will be cancelled. This cannot be undone.
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
