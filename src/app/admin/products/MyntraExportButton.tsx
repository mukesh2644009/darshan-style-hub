'use client';

import { useState } from 'react';
import { FiDownload, FiLoader, FiAlertTriangle, FiX } from 'react-icons/fi';

interface MissingField {
  field: string;
  label: string;
}

interface Props {
  productId: string;
}

export default function MyntraExportButton({ productId }: Props) {
  const [loading, setLoading] = useState(false);
  const [missingFields, setMissingFields] = useState<MissingField[] | null>(null);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setMissingFields(null);

    try {
      const response = await fetch('/api/admin/myntra/export', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (response.status === 422) {
        const data = await response.json();
        setMissingFields(data.details?.[0]?.missingFields || []);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Export failed');
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] || 'Myntra-Export.xlsx';

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
        title="Export to Myntra bulk-upload format"
      >
        {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiDownload className="w-4 h-4" />}
        Export to Myntra
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {missingFields && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiAlertTriangle className="text-amber-500" />
                Missing Myntra Fields
              </h3>
              <button onClick={() => setMissingFields(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            {missingFields.length === 0 ? (
              <p className="text-sm text-gray-600">This product&apos;s category isn&apos;t supported for Myntra export.</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Fill in the &quot;Myntra Listing Details&quot; section below before exporting:
                </p>
                <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                  {missingFields.map((f) => (
                    <li key={f.field} className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      {f.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
