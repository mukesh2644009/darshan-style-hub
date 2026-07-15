'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiCheck, FiX, FiLoader, FiExternalLink, FiTag, FiSlash,
  FiRefreshCw, FiChevronDown, FiTruck, FiFileText, FiAlertTriangle,
} from 'react-icons/fi';

type QuickOrderActionsProps = {
  orderId: string;
  currentStatus: string;
  shippingPartner?: string | null;
  awbNumber?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  isFailedPayment?: boolean;
};

export default function QuickOrderActions({
  orderId,
  currentStatus,
  shippingPartner,
  awbNumber,
  trackingUrl,
  labelUrl,
  isFailedPayment = false,
}: QuickOrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const dropRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [confirm, setConfirm] = useState<{ label: string; description: string; danger?: boolean; onConfirm: () => void } | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const openDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
    }
    setOpen(v => !v);
  };

  if (isFailedPayment) return <span className="text-xs text-gray-400">—</span>;

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus);
    setOpen(false);
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch { /* silent */ }
    finally { setLoading(null); }
  };

  const handleConfirm = () => {
    setOpen(false);
    setConfirm({
      label: 'Confirm Order',
      description: 'Mark this order as Confirmed? This will notify the customer that their order is being processed.',
      onConfirm: () => updateStatus('CONFIRMED'),
    });
  };

  const doCancelOrder = async () => {
    setLoading('CANCEL');
    try {
      if (shippingPartner === 'NIMBUSPOST') {
        await fetch('/api/admin/shipping/nimbuspost/cancel-shipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
      }
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      router.refresh();
    } catch { /* silent */ }
    finally { setLoading(null); }
  };

  const handleCancel = () => {
    setOpen(false);
    setConfirm({
      label: 'Cancel Order',
      description: shippingPartner === 'NIMBUSPOST'
        ? 'This will cancel the order AND cancel the NimbusPost shipment. This cannot be undone.'
        : 'This will permanently cancel the order. This cannot be undone.',
      danger: true,
      onConfirm: doCancelOrder,
    });
  };

  const handleCreateShipment = async () => {
    setLoading('CREATE_SHIPMENT');
    setOpen(false);
    try {
      const res = await fetch('/api/admin/shipping/nimbuspost/create-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string; awbFound?: boolean };
      alert(res.ok
        ? (data.awbFound ? (data.message || 'Shipment created') : (data.message || 'Shipment created, AWB pending'))
        : (data.error || 'Failed to create shipment'));
      router.refresh();
    } catch { alert('Failed to create shipment'); }
    finally { setLoading(null); }
  };

  const handleSyncAwb = async () => {
    setLoading('SYNC_AWB');
    setOpen(false);
    try {
      const manualAwb = window.prompt('Enter AWB from Nimbus app (or leave blank to auto-sync):') || '';
      const manualCourier = manualAwb ? (window.prompt('Enter courier name (e.g. XPRESSBEES_SURFACE):') || '') : '';
      const res = await fetch('/api/admin/shipping/nimbuspost/sync-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, awbNumber: manualAwb, courierName: manualCourier }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      alert(res.ok ? (data.message || 'Synced') : (data.error || 'Failed to sync'));
      router.refresh();
    } catch { alert('Failed to sync'); }
    finally { setLoading(null); }
  };

  const doCancelShipment = async () => {
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
    } catch { alert('Failed'); }
    finally { setLoading(null); }
  };

  const handleCancelShipment = () => {
    setOpen(false);
    setConfirm({
      label: 'Cancel Shipment',
      description: `This will cancel the NimbusPost shipment (AWB: ${awbNumber}). The order status will remain unchanged. Only do this if the courier has not yet picked up the package.`,
      danger: true,
      onConfirm: doCancelShipment,
    });
  };

  const isLoading = loading !== null;

  // Build dropdown menu items based on status
  const menuItems: { label: string; icon: React.ElementType; onClick: () => void; danger?: boolean; color?: string }[] = [];

  if (currentStatus === 'PENDING') {
    menuItems.push({ label: 'Confirm Order', icon: FiCheck, onClick: handleConfirm, color: 'text-blue-600' });
    menuItems.push({ label: 'Cancel Order', icon: FiX, onClick: handleCancel, danger: true });
  }

  if (currentStatus === 'CONFIRMED') {
    menuItems.push({ label: 'Create Shipment', icon: FiTag, onClick: handleCreateShipment, color: 'text-emerald-600' });
    menuItems.push({ label: 'Cancel Order', icon: FiX, onClick: handleCancel, danger: true });
  }

  if (currentStatus === 'SHIPPED') {
    if (trackingUrl) menuItems.push({ label: 'Track Shipment', icon: FiTruck, onClick: () => { window.open(trackingUrl, '_blank'); setOpen(false); }, color: 'text-sky-600' });
    if (awbNumber) menuItems.push({ label: 'Print Label', icon: FiExternalLink, onClick: () => { window.open(labelUrl || `/api/admin/shipping/nimbuspost/label?orderId=${orderId}`, '_blank'); setOpen(false); }, color: 'text-indigo-600' });
    if (shippingPartner === 'NIMBUSPOST') menuItems.push({ label: awbNumber ? 'Update AWB' : 'Sync AWB', icon: FiRefreshCw, onClick: handleSyncAwb, color: 'text-amber-600' });
    if (awbNumber) menuItems.push({ label: 'Cancel Shipment', icon: FiSlash, onClick: handleCancelShipment, danger: true });
    menuItems.push({ label: 'Cancel Order', icon: FiX, onClick: handleCancel, danger: true });
  }

  // Always add Print Invoice at the bottom
  menuItems.push({
    label: 'Print Invoice',
    icon: FiFileText,
    onClick: () => { window.open(`/api/admin/orders/invoice?orderId=${orderId}`, '_blank'); setOpen(false); },
    color: 'text-green-700',
  });

  // Shared confirmation modal
  const ConfirmModal = confirm ? (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !loading && setConfirm(null)}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${confirm.danger ? 'bg-red-100' : 'bg-blue-100'}`}>
            <FiAlertTriangle className={`w-5 h-5 ${confirm.danger ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <button onClick={() => setConfirm(null)} className="text-gray-400 hover:text-gray-600 p-1">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{confirm.label}?</h3>
        <p className="text-sm text-gray-600 mb-5">{confirm.description}</p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirm(null)}
            disabled={loading !== null}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => { confirm.onConfirm(); setConfirm(null); }}
            disabled={loading !== null}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 ${confirm.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Yes, {confirm.label}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (currentStatus === 'DELIVERED') {
    return (
      <>
        {ConfirmModal}
        <div className="flex items-center gap-1.5" ref={dropRef}>
          {awbNumber && trackingUrl && (
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 transition-colors">
              <FiTruck className="w-3 h-3" /> Track
            </a>
          )}
          <button
            ref={btnRef}
            onClick={openDropdown}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Actions <FiChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div
              style={{ position: 'fixed', top: dropPos.top, right: dropPos.right, zIndex: 9999 }}
              className="w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => { window.open(`/api/admin/orders/invoice?orderId=${orderId}`, '_blank'); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-left text-green-700 hover:bg-green-50 transition-colors"
              >
                <FiFileText className="w-3.5 h-3.5 shrink-0" />
                Print Invoice
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
    {ConfirmModal}
    <div className="flex items-center gap-2" ref={dropRef}>
      {/* AWB chip — always visible when present */}
      {awbNumber && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap" title={`AWB: ${awbNumber}`}>
          <FiTruck className="w-3 h-3" />
          AWB: {awbNumber}
        </span>
      )}

      {/* Actions dropdown — fixed position so it's never clipped by overflow-hidden */}
      <div className="relative">
        <button
          ref={btnRef}
          onClick={openDropdown}
          disabled={isLoading}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isLoading
            ? <FiLoader className="w-3.5 h-3.5 animate-spin" />
            : <>Actions <FiChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} /></>
          }
        </button>

        {open && (
          <div
            style={{ position: 'fixed', top: dropPos.top, right: dropPos.right, zIndex: 9999 }}
            className="w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-left transition-colors hover:bg-gray-50 ${
                  item.danger ? 'text-red-600 hover:bg-red-50' : (item.color || 'text-gray-700')
                } ${idx !== 0 ? 'border-t border-gray-50' : ''}`}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
