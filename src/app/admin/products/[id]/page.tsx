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

          {/* Available Sizes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Available Sizes</h2>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <span
                  key={size.id}
                  className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700"
                >
                  {size.size}
                </span>
              ))}
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

