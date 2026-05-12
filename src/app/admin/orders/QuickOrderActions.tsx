'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiTruck, FiPackage, FiX, FiLoader, FiExternalLink, FiTag, FiSlash } from 'react-icons/fi';

const ACTIONS = [
  { status: 'CONFIRMED', label: 'Confirm', icon: FiCheck, color: 'text-blue-600 hover:bg-blue-50', show: ['PENDING'] },
  { status: 'SHIPPED',   label: 'Ship',    icon: FiTruck,  color: 'text-purple-600 hover:bg-purple-50', show: ['CONFIRMED'] },
  { status: 'DELIVERED', label: 'Deliver', icon: FiPackage,color: 'text-green-600 hover:bg-green-50',   show: ['SHIPPED'] },
  { status: 'CANCELLED', label: 'Cancel',  icon: FiX,      color: 'text-red-600 hover:bg-red-50',      show: ['PENDING', 'CONFIRMED', 'SHIPPED'] },
];

type QuickOrderActionsProps = {
  orderId: string;
  currentStatus: string;
  shippingPartner?: string | null;
  awbNumber?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
};

export default function QuickOrderActions({
  orderId,
  currentStatus,
  shippingPartner,
  awbNumber,
  trackingUrl,
  labelUrl,
}: QuickOrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (newStatus: string) => {
    setLoading(newStatus);
    try {
      if (newStatus === 'SHIPPED' && !awbNumber) {
        const createRes = await fetch('/api/admin/shipping/nimbuspost/create-shipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        if (!createRes.ok) {
          const data = (await createRes.json().catch(() => ({}))) as { error?: string };
          alert(data.error || 'Failed to create shipment');
        }
        router.refresh();
        return;
      }

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

  const handleCreateShipment = async () => {
    setLoading('CREATE_SHIPMENT');
    try {
      const res = await fetch('/api/admin/shipping/nimbuspost/create-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string; awbFound?: boolean };
      if (!res.ok) {
        alert(data.error || 'Failed to create shipment');
      } else {
        alert(
          data.awbFound
            ? (data.message || 'Shipment created and AWB captured')
            : (data.message || 'Shipment created, AWB pending from Nimbus')
        );
      }
      router.refresh();
    } catch {
      alert('Failed to create shipment');
    } finally {
      setLoading(null);
    }
  };

  const handleCancelShipment = async () => {
    setLoading('CANCEL_SHIPMENT');
    try {
      const res = await fetch('/api/admin/shipping/nimbuspost/cancel-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error || 'Failed to cancel shipment');
      }
      router.refresh();
    } catch {
      alert('Failed to cancel shipment');
    } finally {
      setLoading(null);
    }
  };

  const available = ACTIONS.filter(a => a.show.includes(currentStatus));

  if (available.length === 0 && !awbNumber && currentStatus !== 'CONFIRMED') {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {!awbNumber && ['CONFIRMED', 'SHIPPED'].includes(currentStatus) && (
        <button
          onClick={handleCreateShipment}
          disabled={loading !== null}
          title="Create Nimbus shipment"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
        >
          {loading === 'CREATE_SHIPMENT'
            ? <FiLoader className="w-3.5 h-3.5 animate-spin" />
            : <FiTag className="w-3.5 h-3.5" />
          }
          Create Shipment
        </button>
      )}

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

      {trackingUrl && (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 transition-colors"
          title="Track shipment"
        >
          <FiExternalLink className="w-3.5 h-3.5" />
          Track
        </a>
      )}

      {labelUrl && (
        <a
          href={labelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
          title="Open label"
        >
          <FiExternalLink className="w-3.5 h-3.5" />
          Label
        </a>
      )}

      {shippingPartner === 'NIMBUSPOST' && awbNumber && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          AWB: {awbNumber}
        </span>
      )}

      {shippingPartner === 'NIMBUSPOST' && awbNumber && !['DELIVERED', 'CANCELLED'].includes(currentStatus) && (
        <button
          onClick={handleCancelShipment}
          disabled={loading !== null}
          title="Cancel Nimbus shipment"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
        >
          {loading === 'CANCEL_SHIPMENT'
            ? <FiLoader className="w-3.5 h-3.5 animate-spin" />
            : <FiSlash className="w-3.5 h-3.5" />
          }
          Cancel Shipment
        </button>
      )}
    </div>
  );
}
