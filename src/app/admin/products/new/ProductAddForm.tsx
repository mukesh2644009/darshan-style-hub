'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiSave, FiLoader, FiCheck, FiPlus, FiX, FiImage } from 'react-icons/fi';

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];

const PRESET_COLORS = [
  { name: 'Red', hex: '#DC2626' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Beige', hex: '#D4A574' },
  { name: 'Maroon', hex: '#7F1D1D' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Peach', hex: '#FBBF77' },
  { name: 'Aqua', hex: '#06B6D4' },
];

export default function ProductAddForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    category: 'Kurtis',
    subcategory: '',
    featured: false,
    newArrival: true,
  });

  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const toggleSize = (size: string) => {
    setSizeQuantities(prev => {
      if (prev[size] !== undefined) {
        const updated = { ...prev };
        delete updated[size];
        return updated;
      } else {
        return { ...prev, [size]: 1 };
      }
    });
  };

  const updateSizeQuantity = (size: string, quantity: number) => {
    setSizeQuantities(prev => ({
      ...prev,
      [size]: Math.max(0, quantity)
    }));
  };

  const getTotalQuantity = () => {
    return Object.values(sizeQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const toggleColor = (color: { name: string; hex: string }) => {
    setSelectedColors(prev => 
      prev.some(c => c.name === color.name) 
        ? prev.filter(c => c.name !== color.name) 
        : [...prev, color]
    );
  };

  const addImageUrl = () => {
    setImageUrls(prev => [...prev, '']);
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const updateImageUrl = (index: number, value: string) => {
    setImageUrls(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Filter out empty image URLs
    const validImages = imageUrls.filter(url => url.trim() !== '');

    if (validImages.length === 0) {
      setMessage('Please add at least one product image');
      setMessageType('error');
      setLoading(false);
      return;
    }

    const selectedSizes = Object.keys(sizeQuantities);
    if (selectedSizes.length === 0) {
      setMessage('Please select at least one size');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (selectedColors.length === 0) {
      setMessage('Please select at least one color');
      setMessageType('error');
      setLoading(false);
      return;
    }

    // Prepare sizes with quantities
    const sizesWithQuantity = selectedSizes.map(size => ({
      size,
      quantity: sizeQuantities[size] || 0
    }));

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          images: validImages,
          sizes: sizesWithQuantity,
          colors: selectedColors,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Product created successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      } else {
        setMessage(data.error || 'Failed to create product');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error creating product');
      setMessageType('error');
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
              placeholder="e.g., DSH-KUR-001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Unique serial number (e.g., DSH-KUR-001 for Kurti)</p>
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
              placeholder="e.g., Fiona Aqua Designer Kurti"
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
              placeholder="Describe the product - fabric, style, occasion, etc."
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

      {/* Product Images */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          <FiImage className="inline mr-2" />
          Product Images
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Add image paths like: <code className="bg-gray-100 px-2 py-1 rounded">/products/kurtis/kurti-1/1.jpg</code>
        </p>
        <div className="space-y-3">
          {imageUrls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => updateImageUrl(index, e.target.value)}
                placeholder={`/products/kurtis/kurti-${index + 1}/1.jpg`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageUrl(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addImageUrl}
            className="inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add Another Image
          </button>
        </div>
      </div>

      {/* Sizes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Sizes & Inventory</h2>
          {getTotalQuantity() > 0 && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Total Stock: {getTotalQuantity()} pcs
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">Click a size to add it, then enter quantity</p>
        <div className="flex flex-wrap gap-3 mb-4">
          {AVAILABLE_SIZES.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                sizeQuantities[size] !== undefined
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              {size}
              {sizeQuantities[size] !== undefined && <FiCheck className="inline ml-2" />}
            </button>
          ))}
        </div>
        
        {Object.keys(sizeQuantities).length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quantity per Size:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(sizeQuantities).map(size => (
                <div key={size} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <span className="font-medium text-gray-800 min-w-[60px]">{size}:</span>
                  <input
                    type="number"
                    min="0"
                    value={sizeQuantities[size]}
                    onChange={(e) => updateSizeQuantity(size, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                  />
                  <span className="text-sm text-gray-500">pcs</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Available Colors</h2>
        <div className="flex flex-wrap gap-3">
          {PRESET_COLORS.map(color => (
            <button
              key={color.name}
              type="button"
              onClick={() => toggleColor(color)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                selectedColors.some(c => c.name === color.name)
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div 
                className="w-5 h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-sm font-medium text-gray-700">{color.name}</span>
              {selectedColors.some(c => c.name === color.name) && (
                <FiCheck className="text-primary-600" />
              )}
            </button>
          ))}
        </div>
        {selectedColors.length > 0 && (
          <p className="text-sm text-gray-500 mt-3">
            Selected: {selectedColors.map(c => c.name).join(', ')}
          </p>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Pricing</h2>
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
                value={formData.price || ''}
                onChange={handleChange}
                required
                min="0"
                step="1"
                placeholder="1999"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Original Price (₹) <span className="text-gray-400">(for discount)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice || ''}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="2999"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {formData.originalPrice > formData.price && formData.price > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-800 text-sm font-medium">
              Discount: {Math.round((1 - formData.price / formData.originalPrice) * 100)}% OFF
              <span className="text-green-600 ml-2">
                (Save ₹{(formData.originalPrice - formData.price).toLocaleString('en-IN')})
              </span>
            </p>
          </div>
        )}
      </div>

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
              <p className="text-xs text-gray-500">Show &quot;New&quot; badge on product</p>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-6">
        <div>
          {message && (
            <p className={`text-sm font-medium ${
              messageType === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {messageType === 'success' && <FiCheck className="inline mr-1" />}
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
              Creating...
            </>
          ) : (
            <>
              <FiSave className="w-5 h-5" />
              Create Product
            </>
          )}
        </button>
      </div>
    </form>
  );
}
