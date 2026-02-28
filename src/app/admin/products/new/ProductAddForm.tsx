'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiSave, FiLoader, FiCheck, FiPlus, FiX, FiImage, FiUploadCloud, FiTrash2 } from 'react-icons/fi';

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
    category: 'Co Ord Sets',
    subcategory: '',
    featured: false,
    newArrival: true,
  });

  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedImagePaths, setUploadedImagePaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (newFiles.length === 0) return;

    setImageFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleImageSelect(e.dataTransfer.files);
  };

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

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    setUploading(true);
    const uploadFormData = new FormData();
    imageFiles.forEach(file => uploadFormData.append('images', file));
    uploadFormData.append('category', formData.category);

    const slug = formData.name
      ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : '';
    uploadFormData.append('productFolder', slug || `product-${Date.now()}`);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Upload failed — server returned an invalid response. If on Vercel, file uploads to filesystem are not supported. Upload images locally and push via git.');
      }
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploading(false);
      return data.images;
    } catch (err) {
      setUploading(false);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (imageFiles.length === 0 && uploadedImagePaths.length === 0) {
      setMessage('Please upload at least one product image');
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

    const sizesWithQuantity = selectedSizes.map(size => ({
      size,
      quantity: sizeQuantities[size] || 0
    }));

    try {
      setMessage('Uploading images...');
      setMessageType('success');
      const imagePaths = imageFiles.length > 0 ? await uploadImages() : [];
      const allImages = [...uploadedImagePaths, ...imagePaths];

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: allImages,
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
      setMessage(error instanceof Error ? error.message : 'Error creating product');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Suits', 'Co Ord Sets'];
  const subcategories: Record<string, string[]> = {
    'Suits': ['Anarkali Suits', 'Salwar Suits', 'Palazzo Suits', 'Churidar Suits', 'Party Wear Suits', 'Designer Suits'],
    'Co Ord Sets': ['Printed Co Ord Sets', 'Embroidered Co Ord Sets', 'Party Wear Co Ord Sets', 'Casual Co Ord Sets', 'Cotton Co Ord Sets', 'Designer Co Ord Sets'],
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
          Upload images from your phone or computer. They&apos;ll be saved automatically in the <strong>{formData.category.toLowerCase()}</strong> folder.
        </p>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <FiUploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">Drag & drop images here</p>
          <p className="text-gray-400 text-sm mt-1">or</p>
          <label className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors">
            <FiPlus className="w-4 h-4" />
            Choose Files
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageSelect(e.target.files)}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-400 mt-3">JPG, PNG, WebP — Max 5MB per image</p>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''} selected
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    width={200}
                    height={160}
                    className="w-full h-40 object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
                    {imageFiles[index]?.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
          disabled={loading || uploading}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            loading || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {loading || uploading ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              {uploading ? 'Uploading Images...' : 'Creating...'}
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
