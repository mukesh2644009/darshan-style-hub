import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiPackage } from 'react-icons/fi';
import ProductEditForm from './ProductEditForm';

async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      sizes: true,
      colors: true,
    },
  });
}

export default async function ProductEditPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-1">Update product details and pricing</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Edit Form */}
        <div className="lg:col-span-2">
          <ProductEditForm product={product} />
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-6">
          {/* Product Image Preview */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Current Image</h2>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <FiPackage className="w-16 h-16" />
                </div>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Product ID</span>
                <span className="font-mono text-gray-900">{product.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="text-gray-900">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subcategory</span>
                <span className="text-gray-900">{product.subcategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rating</span>
                <span className="text-gray-900">⭐ {product.rating} ({product.reviews} reviews)</span>
              </div>
            </div>
          </div>

          {/* Stock Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Stock Summary</h2>
            <div className="space-y-2">
              {product.sizes.map((size) => (
                <div
                  key={size.id}
                  className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium text-gray-700">{size.size}</span>
                  <span className={`px-2 py-0.5 rounded text-sm ${
                    (size.quantity || 0) === 0 ? 'bg-red-100 text-red-800' :
                    (size.quantity || 0) < 5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {size.quantity || 0} pcs
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-primary-600">
                  {product.sizes.reduce((sum, s) => sum + (s.quantity || 0), 0)} pcs
                </span>
              </div>
            </div>
          </div>

          {/* Available Colors */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Available Colors</h2>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((color) => (
                <div key={color.id} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-sm text-gray-700">{color.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

