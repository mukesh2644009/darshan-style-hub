'use client';

import { useState } from 'react';
import { FiLoader, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

type SyncState = { type: 'idle' | 'success' | 'error'; message: string };

export default function MetaCatalogSyncCard() {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<SyncState>({ type: 'idle', message: '' });

  const handleSync = async () => {
    setLoading(true);
    setState({ type: 'idle', message: '' });
    try {
      const res = await fetch('/api/admin/meta/sync-catalog', { method: 'POST' });
      const data = await res.json() as { message?: string; error?: string; totalVariants?: number };
      if (res.ok && !data.error) {
        setState({ type: 'success', message: data.message || `Synced ${data.totalVariants} items` });
      } else {
        setState({ type: 'error', message: data.error || 'Sync failed' });
      }
    } catch {
      setState({ type: 'error', message: 'Network error during sync' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        <span className="text-blue-600 font-bold text-xl">f</span>
        Meta Catalog Sync
      </h2>
      <p className="text-sm text-gray-500 mb-1">
        Push all products directly to your Meta (Facebook/Instagram) Commerce Catalog using the Catalog API.
      </p>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
        ⚙️ Requires <code>FACEBOOK_CATALOG_ID</code> and <code>FACEBOOK_ACCESS_TOKEN</code> in environment variables.
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSync}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm font-medium"
        >
          {loading ? (
            <><FiLoader className="w-4 h-4 animate-spin" /> Syncing…</>
          ) : (
            <><FiRefreshCw className="w-4 h-4" /> Sync All Products to Meta</>
          )}
        </button>

        {state.type === 'success' && (
          <span className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <FiCheckCircle className="w-4 h-4" /> {state.message}
          </span>
        )}
        {state.type === 'error' && (
          <span className="inline-flex items-center gap-1.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
            <FiAlertCircle className="w-4 h-4" /> {state.message}
          </span>
        )}
      </div>
    </div>
  );
}
