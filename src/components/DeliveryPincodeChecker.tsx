'use client';

import { useState } from 'react';
import { FiMapPin, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

type Props = {
  variant?: 'compact' | 'full';
  /** Hide the inner title block (e.g. when the page already has an H1) */
  showTitle?: boolean;
  className?: string;
};

export default function DeliveryPincodeChecker({
  variant = 'full',
  showTitle = true,
  className = '',
}: Props) {
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    available: boolean;
    message: string;
    estimatedDaysHint?: string;
    locationHint?: string;
  } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    const p = pincode.replace(/\D/g, '').slice(0, 6);
    if (p.length !== 6) {
      setResult({ available: false, message: 'Enter a 6-digit pincode.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/delivery/pincode?pincode=${encodeURIComponent(p)}`);
      const data = await res.json();
      if (data.success) {
        setResult({
          available: data.available,
          message: data.message,
          estimatedDaysHint: data.estimatedDaysHint,
          locationHint: data.locationHint,
        });
      } else {
        setResult({ available: false, message: 'Could not check. Try again.' });
      }
    } catch {
      setResult({ available: false, message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const box =
    variant === 'compact'
      ? 'bg-accent-50 border border-accent-200 rounded-2xl p-4 sm:p-5'
      : 'bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8';

  return (
    <div className={`${box} ${className}`}>
      {showTitle && (
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <FiMapPin className="text-primary-600 w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-gray-900">
              Check delivery to your pincode
            </h3>
            {variant === 'full' && (
              <p className="text-gray-600 text-sm mt-1">
                We validate your pincode against India Post data and our delivery rules.
              </p>
            )}
          </div>
        </div>
      )}
      {!showTitle && variant === 'compact' && (
        <p className="text-gray-600 text-sm mb-3">Enter your 6-digit pincode to check serviceability.</p>
      )}

      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="e.g. 302022"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono tracking-wider"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors whitespace-nowrap"
        >
          {loading ? 'Checking…' : 'Check'}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 flex gap-3 p-4 rounded-xl text-sm ${
            result.available ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-amber-50 text-amber-900 border border-amber-200'
          }`}
        >
          {result.available ? (
            <FiCheckCircle className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
          ) : (
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          )}
          <div>
            <p className="font-medium">{result.message}</p>
            {result.available && result.locationHint && (
              <p className="mt-1 text-green-800/90">Area: {result.locationHint}</p>
            )}
            {result.estimatedDaysHint && (
              <p className="mt-1 text-green-800/90">{result.estimatedDaysHint}</p>
            )}
            <p className="mt-2 text-xs opacity-80">
              Final delivery timelines depend on courier and location — shown again at checkout.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
