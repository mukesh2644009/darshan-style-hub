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

