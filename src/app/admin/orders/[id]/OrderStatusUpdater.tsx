'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiLoader } from 'react-icons/fi';

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-500' },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-purple-500' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-500' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500' },
];

interface Props {
  orderId: string;
  currentStatus: string;
}

export default function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdateStatus = async () => {
    if (status === currentStatus) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setMessage('Status updated successfully!');
        router.refresh();
      } else {
        setMessage('Failed to update status');
      }
    } catch (error) {
      setMessage('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Update Order Status</h2>

      <div className="flex flex-wrap gap-2 mb-4">
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
            {s.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleUpdateStatus}
        disabled={loading || status === currentStatus}
        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
          loading || status === currentStatus
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
            Update Status
          </>
        )}
      </button>

      {message && (
        <p className={`mt-3 text-sm text-center ${
          message.includes('success') ? 'text-green-600' : 'text-red-600'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}

