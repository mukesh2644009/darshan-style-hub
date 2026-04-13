'use client';

import { useState } from 'react';
import { FiTrash2, FiX, FiAlertTriangle } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface DeleteCustomerButtonProps {
  customerId: string;
  customerName: string;
  orderCount: number;
}

export default function DeleteCustomerButton({ customerId, customerName, orderCount }: DeleteCustomerButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setShowConfirm(false);
        router.refresh();
      } else {
        alert(data.error || 'Failed to delete customer');
      }
    } catch (error) {
      alert('Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Delete customer"
      >
        <FiTrash2 size={18} />
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <FiX size={20} />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Customer?</h3>
              
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <strong>{customerName}</strong>?
              </p>

              {orderCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800">
                    ⚠️ This customer has <strong>{orderCount} order(s)</strong> which will also be deleted.
                  </p>
                </div>
              )}

              <p className="text-sm text-red-600 mb-6">
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
