import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FiPlus } from 'react-icons/fi';
import DeleteAllButton from './DeleteAllButton';
import BackfillSlugsButton from './BackfillSlugsButton';
import ProductsTable from './ProductsTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

const CATEGORY_BADGE_CLASS: Record<string, string> = {
  'Suits': 'bg-purple-100 text-purple-800',
  'Co Ord Sets': 'bg-orange-100 text-orange-800',
  'Kurtis': 'bg-green-100 text-green-800',
  'Tops': 'bg-blue-100 text-blue-800',
  'Sarees': 'bg-pink-100 text-pink-800',
  'Western Dress': 'bg-teal-100 text-teal-800',
};
const categoryBadgeClass = (category: string) => CATEGORY_BADGE_CLASS[category] || 'bg-gray-100 text-gray-800';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const products = await getProducts();
  const activeCategory = searchParams?.category || '';
  const filteredProducts = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;
  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const categoryEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

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
          <a 
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            Add Product
          </a>
        </div>
      </div>

      {/* Stats */}
      {(() => {
        const colors = ['text-purple-600', 'text-orange-600', 'text-green-600', 'text-blue-600', 'text-pink-600', 'text-yellow-600', 'text-red-600', 'text-indigo-600'];
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 col-span-2 md:col-span-1">
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            {(() => {
              const noImage = products.filter(p => p.images.length === 0).length;
              return noImage > 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg shadow-sm p-4 col-span-2 md:col-span-1">
                  <p className="text-sm text-red-600 font-medium">⚠️ No Images</p>
                  <p className="text-2xl font-bold text-red-700">{noImage}</p>
                  <p className="text-xs text-red-500">products missing images</p>
                </div>
              ) : null;
            })()}
            {categoryEntries.map(([cat, count], i) => (
              <div key={cat} className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-500 truncate">{cat}</p>
                <p className={`text-2xl font-bold ${colors[i % colors.length]}`}>{count}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Category filter */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Link
          href="/admin/products"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !activeCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({products.length})
        </Link>
        {categoryEntries.map(([cat, count]) => (
          <Link
            key={cat}
            href={`/admin/products?category=${encodeURIComponent(cat)}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat ? 'bg-primary-600 text-white' : `${categoryBadgeClass(cat)} hover:opacity-75`
            }`}
          >
            {cat} ({count})
          </Link>
        ))}
      </div>

      {/* Products Grid */}
      <ProductsTable products={filteredProducts} totalCount={products.length} activeCategory={activeCategory} />
    </div>
  );
}

