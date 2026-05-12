'use client';

import { useState } from 'react';
import { FiLoader, FiWifi, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

type TestState = {
  type: 'idle' | 'success' | 'error';
  message: string;
};

export default function NimbusConnectionTestCard() {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<TestState>({ type: 'idle', message: '' });

  const handleTest = async () => {
    setLoading(true);
    setState({ type: 'idle', message: '' });
    try {
      const response = await fetch('/api/admin/shipping/nimbuspost/test-connection');
      const data = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string; error?: string };
      if (response.ok && data.success) {
        setState({ type: 'success', message: data.message || 'NimbusPost connection successful' });
      } else {
        setState({ type: 'error', message: data.error || 'NimbusPost connection failed' });
      }
    } catch {
      setState({ type: 'error', message: 'Network error while testing NimbusPost connection' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FiWifi className="w-5 h-5" />
        NimbusPost Integration
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Verify that <code>NIMBUSPOST_API_KEY</code> and API base URL are configured correctly.
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleTest}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 transition-colors text-sm font-medium"
        >
          {loading ? (
            <>
              <FiLoader className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <FiWifi className="w-4 h-4" />
              Test Nimbus API Connection
            </>
          )}
        </button>

        {state.type === 'success' && (
          <span className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <FiCheckCircle className="w-4 h-4" />
            {state.message}
          </span>
        )}

        {state.type === 'error' && (
          <span className="inline-flex items-center gap-1.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
            <FiAlertCircle className="w-4 h-4" />
            {state.message}
          </span>
        )}
      </div>
    </div>
  );
}

