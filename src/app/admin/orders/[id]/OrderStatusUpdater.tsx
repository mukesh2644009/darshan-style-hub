'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiLoader, FiDollarSign, FiTruck } from 'react-icons/fi';

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-500', icon: '🕐' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-500', icon: '✅' },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-purple-500', icon: '🚚' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-500', icon: '📦' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500', icon: '❌' },
];

const PAYMENT_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'PAID', label: 'Paid', color: 'bg-green-500' },
  { value: 'FAILED', label: 'Failed', color: 'bg-red-500' },
  { value: 'REFUNDED', label: 'Refunded', color: 'bg-gray-500' },
];

interface Props {
  orderId: string;
  currentStatus: string;
  currentPaymentStatus: string;
}

export default function OrderStatusUpdater({ orderId, currentStatus, currentPaymentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const RETURN_STATUSES = ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED', 'EXCHANGE_REQUESTED', 'EXCHANGE_APPROVED', 'EXCHANGED'];
  const isCancelled = currentStatus === 'CANCELLED';
  const isReturnFlow = RETURN_STATUSES.includes(currentStatus);
  const hasChanges = status !== currentStatus || paymentStatus !== currentPaymentStatus;

  const handleUpdate = async () => {
    if (!hasChanges) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentStatus }),
      });

      if (response.ok) {
        setMessage('Order updated successfully!');
        router.refresh();
      } else {
        setMessage('Failed to update order');
      }
    } catch (error) {
      setMessage('Error updating order');
    } finally {
      setLoading(false);
    }
  };

  const returnStatusLabels: Record<string, { icon: string; label: string; color: string; note: string }> = {
    RETURN_REQUESTED:   { icon: '↩', label: 'Return Requested',   color: 'bg-orange-50 border-orange-200 text-orange-800', note: 'Customer has raised a return. Go to Returns dashboard to approve or reject.' },
    RETURN_APPROVED:    { icon: '✅', label: 'Return Approved',    color: 'bg-orange-100 border-orange-300 text-orange-900', note: 'Return approved. Schedule pickup and process refund from the Returns dashboard.' },
    RETURNED:           { icon: '📦', label: 'Returned',           color: 'bg-gray-100 border-gray-300 text-gray-700',       note: 'Item returned and refund processed.' },
    EXCHANGE_REQUESTED: { icon: '🔄', label: 'Exchange Requested', color: 'bg-sky-50 border-sky-200 text-sky-800',           note: 'Customer has requested an exchange. Go to Returns dashboard to approve or reject.' },
    EXCHANGE_APPROVED:  { icon: '✅', label: 'Exchange Approved',  color: 'bg-sky-100 border-sky-300 text-sky-900',          note: 'Exchange approved. Ship the replacement item.' },
    EXCHANGED:          { icon: '🎁', label: 'Exchanged',          color: 'bg-teal-50 border-teal-200 text-teal-800',        note: 'Exchange fulfilled successfully.' },
  };

  if (isCancelled) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <span className="text-xl">❌</span>
          </div>
          <div>
            <p className="font-semibold text-red-800">Order Cancelled</p>
            <p className="text-sm text-red-600">This order has been cancelled and cannot be modified.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isReturnFlow) {
    const info = returnStatusLabels[currentStatus];
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className={`flex items-start gap-3 p-4 border rounded-xl ${info.color}`}>
          <span className="text-2xl shrink-0">{info.icon}</span>
          <div>
            <p className="font-semibold">{info.label}</p>
            <p className="text-sm mt-0.5">{info.note}</p>
          </div>
        </div>
        <a
          href="/admin/returns"
          className="block w-full py-2.5 text-center rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors text-sm"
        >
          Go to Returns Dashboard →
        </a>
        {/* Still allow payment status update */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FiDollarSign className="w-4 h-4" />
            Payment Status
          </h2>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setPaymentStatus(s.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  paymentStatus === s.value ? `${s.color} text-white` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {paymentStatus !== currentPaymentStatus && (
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="mt-3 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save Payment Status'}
            </button>
          )}
        </div>
        {message && (
          <p className={`text-sm text-center ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      {/* Order Status */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <FiTruck className="w-5 h-5" />
          Order Status
        </h2>
        <p className="text-sm text-gray-500 mb-3">Track the delivery progress</p>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                status === s.value
                  ? `${s.color} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
        {status === 'DELIVERED' && currentStatus !== 'DELIVERED' && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
            ⚠️ Only mark as <strong>Delivered</strong> after the courier confirms the customer has physically received the package. This will unlock the return &amp; exchange window for the customer.
          </p>
        )}
      </div>

      {/* Payment Status */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <FiDollarSign className="w-5 h-5" />
          Payment Status
        </h2>
        <p className="text-sm text-gray-500 mb-3">Mark as Paid once you verify UPI payment or receive COD</p>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setPaymentStatus(s.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                paymentStatus === s.value
                  ? `${s.color} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleUpdate}
        disabled={loading || !hasChanges}
        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
          loading || !hasChanges
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {loading ? (
          <>
            <FiLoader className="w-5 h-5 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            <FiCheck className="w-5 h-5" />
            Save Changes
          </>
        )}
      </button>

      {message && (
        <p className={`text-sm text-center ${
          message.includes('success') ? 'text-green-600' : 'text-red-600'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}

