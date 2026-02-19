import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { FiPackage, FiEdit, FiPlus, FiEye } from 'react-icons/fi';
import WhatsAppShareButton from './WhatsAppShareButton';
import DeleteAllButton from './DeleteAllButton';
import DeleteProductButton from './DeleteProductButton';
import BackfillSlugsButton from './BackfillSlugsButton';

async function getProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      images: true,
      sizes: true,
      colors: true,
    },
  });
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <BackfillSlugsButton />
          <DeleteAllButton />
          <Link 
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Suits</p>
          <p className="text-2xl font-bold text-purple-600">
            {products.filter(p => p.category === 'Suits').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Kurtis</p>
          <p className="text-2xl font-bold text-orange-600">
            {products.filter(p => p.category === 'Kurtis').length}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500">Add your first product to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sizes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colors
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <FiPackage />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{product.subcategory}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        product.category === 'Suits' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">₹{product.price.toLocaleString('en-IN')}</p>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <p className="text-sm text-gray-500 line-through">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const totalStock = product.sizes.reduce((sum, s) => sum + (s.quantity || 0), 0);
                        return (
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            totalStock === 0 ? 'bg-red-100 text-red-800' :
                            totalStock < 10 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {totalStock} pcs
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative group inline-block">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                          <span className="text-sm text-gray-700">{product.sizes.length} sizes</span>
                          <FiEye className="w-4 h-4 text-gray-500" />
                        </button>
                        <div className="absolute z-50 left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-3 hidden group-hover:block">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Size / Quantity</p>
                          <div className="space-y-1.5">
                            {product.sizes.map((size) => (
                              <div key={size.id} className="flex justify-between items-center text-sm">
                                <span className="font-medium text-gray-800">{size.size}</span>
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  (size.quantity || 0) === 0 ? 'bg-red-100 text-red-700' :
                                  (size.quantity || 0) < 5 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {size.quantity || 0} pcs
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t mt-2 pt-2 flex justify-between items-center text-sm font-bold">
                            <span className="text-gray-800">Total</span>
                            <span className="text-primary-600">
                              {product.sizes.reduce((sum, s) => sum + (s.quantity || 0), 0)} pcs
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {product.colors.slice(0, 3).map((color) => (
                          <div
                            key={color.id}
                            className="w-5 h-5 rounded-full border border-gray-200"
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        ))}
                        {product.colors.length > 3 && (
                          <span className="text-xs text-gray-500 ml-1">
                            +{product.colors.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {product.featured && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                            Featured
                          </span>
                        )}
                        {product.newArrival && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                            New
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors text-sm font-medium"
                        >
                          <FiEdit className="w-4 h-4" />
                          Edit
                        </Link>
                        <WhatsAppShareButton 
                          product={{
                            id: product.id,
                            slug: product.slug,
                            name: product.name,
                            price: product.price,
                            originalPrice: product.originalPrice,
                            category: product.category,
                          }}
                        />
                        <DeleteProductButton 
                          productId={product.id}
                          productName={product.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

