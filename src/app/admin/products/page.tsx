import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { FiPackage, FiEdit, FiPlus } from 'react-icons/fi';
import WhatsAppShareButton from './WhatsAppShareButton';

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
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <FiPlus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Sarees</p>
          <p className="text-2xl font-bold text-pink-600">
            {products.filter(p => p.category === 'Sarees').length}
          </p>
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
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
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
                        product.category === 'Sarees' ? 'bg-pink-100 text-pink-800' :
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
                      <div className="flex flex-wrap gap-1">
                        {product.sizes.slice(0, 3).map((size) => (
                          <span key={size.id} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                            {size.size}
                          </span>
                        ))}
                        {product.sizes.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                            +{product.sizes.length - 3}
                          </span>
                        )}
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
                            name: product.name,
                            price: product.price,
                            originalPrice: product.originalPrice,
                            category: product.category,
                          }}
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

