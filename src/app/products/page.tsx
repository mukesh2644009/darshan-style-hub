'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/products';

interface Category {
  name: string;
  subcategories: string[];
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch products and categories
  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);
        
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        
        if (productsData.success) {
          setProducts(productsData.products);
        }
        if (categoriesData.success) {
          setCategories(categoriesData.categories);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Update category when URL param changes
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by subcategory
    if (selectedSubcategory !== 'All') {
      filtered = filtered.filter((p) => p.subcategory === selectedSubcategory);
    }

    // Filter by price
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered = filtered.filter((p) => p.newArrival).concat(
          filtered.filter((p) => !p.newArrival)
        );
        break;
      default:
        filtered = filtered.filter((p) => p.featured).concat(
          filtered.filter((p) => !p.featured)
        );
    }

    return filtered;
  }, [products, selectedCategory, selectedSubcategory, priceRange, sortBy]);

  const subcategories = useMemo(() => {
    if (selectedCategory === 'All') return [];
    const category = categories.find((c) => c.name === selectedCategory);
    return category?.subcategories || [];
  }, [selectedCategory, categories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50">
      {/* Header */}
      <div className="bg-white border-b border-accent-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {selectedCategory === 'All' ? 'All Products' : selectedCategory}
          </h1>
          <p className="text-gray-600">
            Discover our curated collection of premium ethnic wear
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-32">
              <h2 className="font-display text-xl font-bold mb-6">Filters</h2>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Category</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedSubcategory('All');
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === 'All'
                        ? 'bg-primary-100 text-primary-700'
                        : 'hover:bg-accent-100'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setSelectedSubcategory('All');
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === cat.name
                          ? 'bg-primary-100 text-primary-700'
                          : 'hover:bg-accent-100'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories */}
              {subcategories.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Subcategory</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedSubcategory('All')}
                      className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedSubcategory === 'All'
                          ? 'bg-primary-100 text-primary-700'
                          : 'hover:bg-accent-100'
                      }`}
                    >
                      All
                    </button>
                    {subcategories.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubcategory(sub)}
                        className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedSubcategory === sub
                            ? 'bg-primary-100 text-primary-700'
                            : 'hover:bg-accent-100'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="1000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full accent-primary-600"
                  />
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>₹0</span>
                    <span>₹{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedSubcategory('All');
                  setPriceRange([0, 50000]);
                }}
                className="w-full py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing <span className="font-medium">{filteredProducts.length}</span> products
              </p>

              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-accent-300 hover:border-primary-500 transition-colors"
                >
                  <FiFilter size={18} />
                  Filters
                </button>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 bg-white rounded-full border border-accent-300 hover:border-primary-500 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters</p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedSubcategory('All');
                    setPriceRange([0, 50000]);
                  }}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {isFilterOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white z-50 lg:hidden shadow-2xl animate-slideInRight">
            <div className="flex items-center justify-between p-4 border-b border-accent-200">
              <h2 className="font-display text-xl font-bold">Filters</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 hover:bg-accent-100 rounded-full transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100vh-130px)]">
              {/* Mobile Categories */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Category</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedSubcategory('All');
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === 'All'
                        ? 'bg-primary-100 text-primary-700'
                        : 'hover:bg-accent-100'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setSelectedSubcategory('All');
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === cat.name
                          ? 'bg-primary-100 text-primary-700'
                          : 'hover:bg-accent-100'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Price Range */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="1000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full accent-primary-600"
                />
                <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                  <span>₹0</span>
                  <span>₹{priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-accent-200">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
