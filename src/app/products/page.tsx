'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiFilter, FiX, FiChevronDown, FiSearch } from 'react-icons/fi';
import ProductCard from '@/components/ProductCard';
import Breadcrumb from '@/components/Breadcrumb';
import { Product } from '@/lib/products';

interface Category {
  name: string;
  subcategories: string[];
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>(searchParam);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
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

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    if (selectedSubcategory !== 'All') {
      filtered = filtered.filter((p) => p.subcategory === selectedSubcategory);
    }
    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedSizes.length > 0) {
      filtered = filtered.filter((p) =>
        selectedSizes.some((s) => p.sizes.includes(s))
      );
    }
    if (selectedColors.length > 0) {
      filtered = filtered.filter((p) =>
        selectedColors.some((c) => p.colors.some((pc) => pc.name === c))
      );
    }

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
  }, [products, searchQuery, selectedCategory, selectedSubcategory, priceRange, selectedSizes, selectedColors, sortBy]);

  const subcategories = useMemo(() => {
    if (selectedCategory === 'All') return [];
    const category = categories.find((c) => c.name === selectedCategory);
    return category?.subcategories || [];
  }, [selectedCategory, categories]);

  const allSizes = useMemo(() => {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '3XL', '4XL'];
    const set = new Set<string>();
    products.forEach((p) => p.sizes.forEach((s) => set.add(s)));
    const sizes = Array.from(set);
    sizes.sort((a, b) => {
      const ai = sizeOrder.indexOf(a);
      const bi = sizeOrder.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
    return sizes;
  }, [products]);

  const allColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => p.colors.forEach((c) => map.set(c.name, c.hex)));
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedSubcategory !== 'All' ? 1 : 0) +
    (priceRange[1] < 50000 ? 1 : 0) +
    selectedSizes.length +
    selectedColors.length;

  const toggleSize = (s: string) =>
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleColor = (c: string) =>
    setSelectedColors((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedSubcategory('All');
    setPriceRange([0, 50000]);
    setSelectedSizes([]);
    setSelectedColors([]);
  };

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

  const pageTitle = searchQuery.trim()
    ? `Results for "${searchQuery}"`
    : selectedCategory !== 'All'
    ? selectedCategory
    : 'All Products';

  // Build breadcrumb items dynamically
  const breadcrumbItems = [
    { label: 'Products', href: '/products' },
    ...(selectedCategory !== 'All'
      ? [{ label: selectedCategory, href: `/products?category=${encodeURIComponent(selectedCategory)}` }]
      : []),
    ...(selectedSubcategory !== 'All' && selectedCategory !== 'All'
      ? [{ label: selectedSubcategory }]
      : []),
    ...(searchQuery.trim() ? [{ label: `"${searchQuery}"` }] : []),
  ];

  return (
    <div className="min-h-screen bg-accent-50">
      {/* Breadcrumb strip */}
      <div className="bg-white border-b border-accent-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-accent-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
            {pageTitle}
          </h1>
          {searchQuery.trim() ? (
            <div className="flex items-center gap-3">
              <p className="text-gray-600 text-sm">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-primary-600 underline hover:text-primary-700"
              >
                Clear search
              </button>
            </div>
          ) : (
            <p className="text-gray-600">Discover our curated collection of premium ethnic wear</p>
          )}

          {/* Inline search bar on the page */}
          <div className="relative mt-4 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-9 pr-9 py-2.5 rounded-full border border-accent-300 bg-accent-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-32">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>

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

              {/* Size Filter */}
              {allSizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {allSizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSize(s)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                          selectedSizes.includes(s)
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'border-gray-200 text-gray-700 hover:border-primary-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Filter */}
              {allColors.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Color</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {allColors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => toggleColor(c.name)}
                        title={c.name}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColors.includes(c.name)
                            ? 'border-primary-600 scale-110 shadow-md ring-2 ring-primary-300'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: c.hex || '#ccc' }}
                      />
                    ))}
                  </div>
                  {selectedColors.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedColors.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Clear Filters */}
              <button
                onClick={clearAllFilters}
                className="w-full py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSizes.map((s) => (
                  <button key={s} onClick={() => toggleSize(s)}
                    className="flex items-center gap-1 bg-primary-100 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-primary-200 transition-colors">
                    Size: {s} <FiX size={11} />
                  </button>
                ))}
                {selectedColors.map((c) => (
                  <button key={c} onClick={() => toggleColor(c)}
                    className="flex items-center gap-1 bg-primary-100 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-primary-200 transition-colors">
                    Color: {c} <FiX size={11} />
                  </button>
                ))}
                {priceRange[1] < 50000 && (
                  <button onClick={() => setPriceRange([0, 50000])}
                    className="flex items-center gap-1 bg-primary-100 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-primary-200 transition-colors">
                    Max ₹{priceRange[1].toLocaleString()} <FiX size={11} />
                  </button>
                )}
                <button onClick={clearAllFilters}
                  className="text-xs text-gray-500 underline px-1 hover:text-gray-700">
                  Clear all
                </button>
              </div>
            )}

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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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

              {/* Mobile Size Filter */}
              {allSizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {allSizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSize(s)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                          selectedSizes.includes(s)
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'border-gray-200 text-gray-700 hover:border-primary-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Color Filter */}
              {allColors.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Color</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {allColors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => toggleColor(c.name)}
                        title={c.name}
                        className={`w-9 h-9 rounded-full border-2 transition-all ${
                          selectedColors.includes(c.name)
                            ? 'border-primary-600 scale-110 shadow-md ring-2 ring-primary-300'
                            : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: c.hex || '#ccc' }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-accent-200">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full btn-primary"
              >
                Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
