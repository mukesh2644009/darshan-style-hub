'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiTruck, FiPackage, FiX, FiLoader } from 'react-icons/fi';

const ACTIONS = [
  { status: 'CONFIRMED', label: 'Confirm', icon: FiCheck, color: 'text-blue-600 hover:bg-blue-50', show: ['PENDING'] },
  { status: 'SHIPPED',   label: 'Ship',    icon: FiTruck,  color: 'text-purple-600 hover:bg-purple-50', show: ['CONFIRMED'] },
  { status: 'DELIVERED', label: 'Deliver', icon: FiPackage,color: 'text-green-600 hover:bg-green-50',   show: ['SHIPPED'] },
  { status: 'CANCELLED', label: 'Cancel',  icon: FiX,      color: 'text-red-600 hover:bg-red-50',      show: ['PENDING', 'CONFIRMED', 'SHIPPED'] },
];

export default function QuickOrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (newStatus: string) => {
    setLoading(newStatus);
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch {
      // silent
    } finally {
      setLoading(null);
    }
  };

  const available = ACTIONS.filter(a => a.show.includes(currentStatus));

  if (available.length === 0) return <span className="text-xs text-gray-400">—</span>;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {available.map(({ status, label, icon: Icon, color }) => (
        <button
          key={status}
          onClick={() => handleAction(status)}
          disabled={loading !== null}
          title={label}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 border border-gray-200 transition-colors disabled:opacity-50 ${color}`}
        >
          {loading === status
            ? <FiLoader className="w-3.5 h-3.5 animate-spin" />
            : <Icon className="w-3.5 h-3.5" />
          }
          {label}
        </button>
      ))}
    </div>
  );
}
