'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiTrash2, FiLoader } from 'react-icons/fi';

interface Props {
  productId: string;
  productName: string;
}

export default function DeleteProductButton({ productId, productName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This will also delete all associated images.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (error) {
      alert('Error deleting product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
      title="Delete product"
    >
      {loading ? (
        <FiLoader className="w-4 h-4 animate-spin" />
      ) : (
        <FiTrash2 className="w-4 h-4" />
      )}
    </button>
  );
}
