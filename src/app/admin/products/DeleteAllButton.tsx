'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiTrash2, FiLoader, FiAlertTriangle } from 'react-icons/fi';

export default function DeleteAllButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteAll = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/products/delete-all', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'All products deleted successfully!');
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete products');
      }
    } catch (error) {
      alert('Error deleting products');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <FiAlertTriangle className="w-8 h-8" />
            <h3 className="text-xl font-bold">Delete All Products?</h3>
          </div>
          <p className="text-gray-600 mb-6">
            This will permanently delete ALL products, their images, sizes, and colors. 
            This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <FiTrash2 className="w-4 h-4" />
                  Yes, Delete All
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      <FiTrash2 className="w-5 h-5" />
      Delete All
    </button>
  );
}
