'use client';

import { useState } from 'react';
import { FiX, FiLoader, FiCheck } from 'react-icons/fi';
import { RETURN_REASONS } from '@/lib/return-reasons';
import { buildReturnSupportWhatsAppUrl } from '@/lib/whatsapp-customer';

interface OrderForReturn {
  id: string;
  paymentMethod: string;
  items: Array<{
    product: {
      name: string;
      sizes: Array<{ size: string; quantity?: number }>;
      colors: Array<{ name: string; hex?: string }>;
    };
    quantity: number;
    size?: string | null;
    color?: string | null;
  }>;
}

interface Props {
  order: OrderForReturn;
  requestType: 'RETURN' | 'EXCHANGE';
  onClose: () => void;
  onSuccess: () => void;
}

const CONDITIONS = [
  { id: 'tags',       label: 'Original tags are intact and attached' },
  { id: 'packaging',  label: 'Item is in original packaging' },
  { id: 'unstitched', label: 'No stitching or alterations have been made' },
  { id: 'photo',      label: 'I agree to share photos for approval before pickup' },
];

export default function ReturnRequestModal({ order, requestType, onClose, onSuccess }: Props) {
  const isExchange = requestType === 'EXCHANGE';

  const [reason, setReason] = useState<string>(RETURN_REASONS[0].value);
  const [details, setDetails] = useState('');
  const [exchangeSize, setExchangeSize] = useState<string>('');
  const [exchangeColor, setExchangeColor] = useState<string>('');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Collect unique sizes and colors across all items (dedup by string value)
  const allSizes: string[] = Array.from(
    new Set(order.items.flatMap(i => (i.product.sizes ?? []).map(s => s.size).filter(Boolean)))
  );
  const colorMap = new Map<string, string | undefined>();
  order.items.forEach(i => {
    (i.product.colors ?? []).forEach(c => {
      if (c?.name && !colorMap.has(c.name)) colorMap.set(c.name, c.hex);
    });
  });
  const allColors: Array<{ name: string; hex?: string }> = Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));

  const allChecked = CONDITIONS.every(c => checked[c.id]);

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecked) {
      setError('Please confirm all conditions before submitting.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const exchangeDetails = isExchange
        ? [exchangeSize && `Size: ${exchangeSize}`, exchangeColor && `Colour: ${exchangeColor}`, details.trim()]
            .filter(Boolean).join(' · ')
        : details.trim();

      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          details: exchangeDetails || undefined,
          requestType,
          exchangeSize: exchangeSize || undefined,
          exchangeColor: exchangeColor || undefined,
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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="return-modal-title"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 id="return-modal-title" className="text-lg font-semibold text-gray-900">
              {isExchange ? 'Request an exchange' : 'Request a return'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Order <span className="font-mono font-medium text-gray-600">#{order.id.slice(0, 8).toUpperCase()}</span>
              &nbsp;·&nbsp;within 7-day window
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100" aria-label="Close">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Items summary */}
          <ul className="text-sm text-gray-700 space-y-1 border border-gray-100 rounded-xl p-3 bg-gray-50 max-h-28 overflow-y-auto">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                {item.product.name}
                {item.size ? ` · ${item.size}` : ''}
                {item.color ? ` · ${item.color}` : ''}
                {' × '}{item.quantity}
              </li>
            ))}
          </ul>

          {/* Reason */}
          <div>
            <label htmlFor="return-reason" className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for {isExchange ? 'exchange' : 'return'}
            </label>
            <select
              id="return-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {RETURN_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Exchange: size + color pickers */}
          {isExchange && (
            <div className="space-y-4">
              {allSizes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred size <span className="font-normal text-gray-400">(for exchange)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allSizes.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setExchangeSize(exchangeSize === s ? '' : s)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                          exchangeSize === s
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {allColors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred colour <span className="font-normal text-gray-400">(for exchange)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allColors.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setExchangeColor(exchangeColor === c.name ? '' : c.name)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                          exchangeColor === c.name
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                        }`}
                      >
                        {c.hex && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-gray-300"
                            style={{ backgroundColor: c.hex }}
                          />
                        )}
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details / additional notes */}
          <div>
            <label htmlFor="return-details" className="block text-sm font-medium text-gray-700 mb-1.5">
              {isExchange ? 'Any additional notes' : 'Additional details'}
              <span className="font-normal text-gray-400 ml-1">(optional)</span>
            </label>
            <textarea
              id="return-details"
              rows={2}
              value={details}
              onChange={e => setDetails(e.target.value.slice(0, 2000))}
              placeholder={isExchange ? 'e.g. same style but different size, any specific preference...' : 'Tell us anything that helps us process your request faster.'}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{details.length}/2000</p>
          </div>

          {/* Conditions checklist */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-800">Eligibility conditions</p>
              <p className="text-xs text-gray-500 mt-0.5">All must be confirmed to proceed</p>
            </div>
            <div className="divide-y divide-gray-100">
              {CONDITIONS.map(c => (
                <label
                  key={c.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${checked[c.id] ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    checked[c.id] ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'
                  }`}>
                    {checked[c.id] && <FiCheck className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm text-gray-700 leading-snug">{c.label}</span>
                  <input type="checkbox" className="sr-only" checked={!!checked[c.id]} onChange={() => toggle(c.id)} />
                </label>
              ))}
            </div>
          </div>

          {/* Fee notice */}
          {isExchange ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-800 flex items-start gap-2.5">
              <span className="text-base shrink-0">🎉</span>
              <div>
                <p className="font-semibold">Exchanges are free</p>
                <p className="text-xs mt-0.5">No pickup or handling fee for size / colour exchanges.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2.5">
              <span className="text-base shrink-0">🚚</span>
              <div>
                <p className="font-semibold">₹99 pickup fee applies</p>
                <p className="text-xs mt-0.5">A flat ₹99 pickup charge will be deducted from your refund once the return is approved.</p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          {/* WhatsApp help */}
          <div className="rounded-xl bg-accent-50 border border-accent-100 p-3 text-sm text-gray-700">
            <p className="font-medium text-gray-900 mb-1">Need help?</p>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">
              Chat with us on WhatsApp
            </a>
            {' '}{isExchange ? 'to confirm availability before requesting.' : 'for pickup scheduling.'}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !allChecked}
              className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition-colors"
            >
              {loading
                ? <><FiLoader className="animate-spin w-4 h-4" /> Submitting…</>
                : isExchange ? 'Submit exchange' : 'Submit return'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
