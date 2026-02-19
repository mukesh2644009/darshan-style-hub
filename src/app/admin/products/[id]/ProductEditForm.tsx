'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiSave, FiLoader, FiCheck } from 'react-icons/fi';

interface ProductSize {
  id: string;
  size: string;
  quantity: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  category: string;
  subcategory: string | null;
  featured: boolean;
  newArrival: boolean;
  sizes?: ProductSize[];
}

interface Props {
  product: Product;
}

export default function ProductEditForm({ product }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice || 0,
    category: product.category,
    subcategory: product.subcategory || '',
    featured: product.featured,
    newArrival: product.newArrival,
  });

  const [sizeQuantities, setSizeQuantities] = useState<Record<string, { id: string; quantity: number }>>(
    (product.sizes || []).reduce((acc, size) => ({
      ...acc,
      [size.size]: { id: size.id, quantity: size.quantity || 0 }
    }), {})
  );

  const updateSizeQuantity = (size: string, quantity: number) => {
    setSizeQuantities(prev => ({
      ...prev,
      [size]: { ...prev[size], quantity: Math.max(0, quantity) }
    }));
  };

  const getTotalQuantity = () => {
    return Object.values(sizeQuantities).reduce((sum, s) => sum + s.quantity, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Prepare sizes with quantities
    const sizesData = Object.entries(sizeQuantities).map(([size, data]) => ({
      id: data.id,
      size,
      quantity: data.quantity
    }));

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          sizes: sizesData,
        }),
      });

      if (response.ok) {
        setMessage('Product updated successfully!');
        router.refresh();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to update product');
      }
    } catch (error) {
      setMessage('Error updating product');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Suits', 'Kurtis'];
  const subcategories: Record<string, string[]> = {
    'Suits': ['Anarkali Suits', 'Salwar Suits', 'Palazzo Suits', 'Churidar Suits', 'Party Wear Suits', 'Designer Suits'],
    'Kurtis': ['Cotton Kurtis', 'Printed Kurtis', 'Embroidered Kurtis', 'Party Wear Kurtis', 'Casual Kurtis', 'Designer Kurtis'],
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU / Serial Number *
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              placeholder="e.g., DSH-SAR-001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Unique serial number for barcode generation</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory
              </label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select subcategory</option>
                {subcategories[formData.category]?.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">💰 Pricing</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="1"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-bold"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">This is the price customers will pay</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Original Price (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">If set higher than selling price, shows as discount</p>
          </div>
        </div>

        {formData.originalPrice > formData.price && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-800 text-sm font-medium">
              🏷️ Discount: {Math.round((1 - formData.price / formData.originalPrice) * 100)}% OFF
              <span className="text-green-600 ml-2">
                (Save ₹{(formData.originalPrice - formData.price).toLocaleString('en-IN')})
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Inventory / Stock */}
      {Object.keys(sizeQuantities).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Inventory / Stock</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              getTotalQuantity() === 0 ? 'bg-red-100 text-red-800' :
              getTotalQuantity() < 10 ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              Total Stock: {getTotalQuantity()} pcs
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(sizeQuantities).map(([size, data]) => (
              <div key={size} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                <span className="font-medium text-gray-800 min-w-[60px]">{size}:</span>
                <input
                  type="number"
                  min="0"
                  value={data.quantity}
                  onChange={(e) => updateSizeQuantity(size, parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                />
                <span className="text-sm text-gray-500">pcs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Flags */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Status</h2>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <div>
              <span className="font-medium text-gray-900">Featured Product</span>
              <p className="text-xs text-gray-500">Show on homepage featured section</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="newArrival"
              checked={formData.newArrival}
              onChange={handleChange}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <div>
              <span className="font-medium text-gray-900">New Arrival</span>
              <p className="text-xs text-gray-500">Show "New" badge on product</p>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <div>
          {message && (
            <p className={`text-sm font-medium ${
              message.includes('success') ? 'text-green-600' : 'text-red-600'
            }`}>
              {message.includes('success') && <FiCheck className="inline mr-1" />}
              {message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {loading ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FiSave className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

