'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiLink, FiLoader, FiCheck } from 'react-icons/fi';

export default function BackfillSlugsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleBackfill = async (force = false) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/products/backfill-slugs${force ? '?force=true' : ''}`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Slugs generated!');
        router.refresh();
      } else {
        setMessage(data.error || 'Failed');
      }
    } catch (error) {
      setMessage('Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleBackfill(false)}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
        title="Generate SEO-friendly URLs for products missing slugs"
      >
        {loading ? (
          <FiLoader className="w-4 h-4 animate-spin" />
        ) : (
          <FiLink className="w-4 h-4" />
        )}
        Generate SEO Slugs
      </button>
      <button
        onClick={() => handleBackfill(true)}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        title="Regenerate slugs for ALL products (fix broken URLs)"
      >
        Force Regenerate
      </button>
      {message && (
        <span className="text-sm text-green-600 flex items-center gap-1">
          <FiCheck /> {message}
        </span>
      )}
    </div>
  );
}
