'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiTrash2, FiLoader, FiAlertTriangle, FiX } from 'react-icons/fi';

interface Props {
  productId: string;
  productName: string;
}

export default function DeleteProductButton({ productId, productName }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete product');
      }
    } catch {
      setError('Error deleting product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
        title="Delete product"
      >
        <FiTrash2 className="w-4 h-4" />
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !loading && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <FiAlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <button
                onClick={() => !loading && setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete Product?</h3>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium text-gray-900">"{productName}"</span> will be permanently deleted including all images, sizes, and colors.
            </p>
            <p className="text-xs text-red-500 font-medium mb-5">This cannot be undone.</p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><FiLoader className="w-4 h-4 animate-spin" /> Deleting…</>
                ) : (
                  '🗑 Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
