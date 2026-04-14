'use client';

import { useState } from 'react';
import { FiX, FiLoader } from 'react-icons/fi';
import { RETURN_REASONS } from '@/lib/return-reasons';
import { buildReturnSupportWhatsAppUrl } from '@/lib/whatsapp-customer';

interface OrderForReturn {
  id: string;
  items: Array<{
    product: { name: string };
    quantity: number;
    size?: string | null;
    color?: string | null;
  }>;
}

interface Props {
  order: OrderForReturn;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnRequestModal({ order, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState<string>(RETURN_REASONS[0].value);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          details: details.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Something went wrong');
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const waUrl = buildReturnSupportWhatsAppUrl(order.id);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="return-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 id="return-modal-title" className="text-lg font-semibold text-gray-900">
            Request a return
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Order <span className="font-mono font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
          </p>

          <ul className="text-sm text-gray-700 space-y-1 border border-gray-100 rounded-lg p-3 bg-gray-50 max-h-32 overflow-y-auto">
            {order.items.map((item, i) => (
              <li key={i}>
                {item.product.name}
                {item.size ? ` · ${item.size}` : ''}
                {item.color ? ` · ${item.color}` : ''}
                {' × '}
                {item.quantity}
              </li>
            ))}
          </ul>

          <div>
            <label htmlFor="return-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <select
              id="return-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {RETURN_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="return-details" className="block text-sm font-medium text-gray-700 mb-1">
              Additional details <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="return-details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 2000))}
              placeholder="Tell us anything that helps us process your request faster."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">{details.length}/2000</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="rounded-lg bg-accent-50 border border-accent-100 p-3 text-sm text-gray-700">
            <p className="font-medium text-gray-900 mb-1">Need help?</p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              Chat with us on WhatsApp
            </a>
            {' '}for pickup instructions or exchanges.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {loading ? <FiLoader className="animate-spin w-5 h-5" /> : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
