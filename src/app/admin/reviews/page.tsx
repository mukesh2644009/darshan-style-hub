'use client';

import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import { FiStar, FiSave, FiLoader, FiCheck, FiAlertCircle, FiSearch, FiZap } from 'react-icons/fi';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';

interface ProductRow {
  id: string;
  name: string;
  category: string;
  images: { url: string }[];
  rating: number;
  reviews: number;
  // local edit state
  _rating: string;
  _reviews: string;
  _dirty: boolean;
  _saved: boolean;
  _error: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <FiStar
            className={`w-5 h-5 transition-colors ${
              s <= (hover || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
            style={{ fill: s <= (hover || value) ? 'currentColor' : 'none' }}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<'all' | 'no-reviews'>('no-reviews');
  const [savingAll, startSaveAll] = useTransition();
  const [seeding, setSeeding]   = useState(false);
  const [seedMsg, setSeedMsg]   = useState('');

  useEffect(() => {
    fetch('/api/products?limit=200')
      .then(r => r.json())
      .then(data => {
        const rows: ProductRow[] = (data.products || data || []).map((p: any) => ({
          ...p,
          _rating:  String(p.rating  ?? 0),
          _reviews: String(p.reviews ?? 0),
          _dirty: false,
          _saved: false,
          _error: '',
        }));
        setProducts(rows);
      })
      .finally(() => setLoading(false));
  }, []);

  const update = (id: string, field: '_rating' | '_reviews', val: string) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, [field]: val, _dirty: true, _saved: false, _error: '' } : p
    ));
  };

  const updateRating = (id: string, val: number) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, _rating: String(val), _dirty: true, _saved: false, _error: '' } : p
    ));
  };

  const saveOne = async (id: string) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const rating  = parseFloat(p._rating)  || 0;
    const reviews = parseInt(p._reviews, 10) || 0;

    setProducts(prev => prev.map(x => x.id === id ? { ...x, _error: '' } : x));

    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, reviews }),
    });

    if (res.ok) {
      setProducts(prev => prev.map(x =>
        x.id === id
          ? { ...x, rating, reviews, _dirty: false, _saved: true, _error: '' }
          : x
      ));
      setTimeout(() => setProducts(prev => prev.map(x => x.id === id ? { ...x, _saved: false } : x)), 2000);
    } else {
      const data = await res.json();
      setProducts(prev => prev.map(x => x.id === id ? { ...x, _error: data.error || 'Failed' } : x));
    }
  };

  const saveAll = () => {
    startSaveAll(async () => {
      const dirty = products.filter(p => p._dirty);
      if (!dirty.length) return;

      const payload = dirty.map(p => ({
        id: p.id,
        rating:  parseFloat(p._rating)   || 0,
        reviews: parseInt(p._reviews, 10) || 0,
      }));

      const res = await fetch('/api/admin/products/bulk-ratings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => {
          if (!p._dirty) return p;
          return {
            ...p,
            rating:  parseFloat(p._rating)   || 0,
            reviews: parseInt(p._reviews, 10) || 0,
            _dirty: false,
            _saved: true,
          };
        }));
        setTimeout(() => setProducts(prev => prev.map(p => ({ ...p, _saved: false }))), 2500);
      }
    });
  };

  const seedReviews = async () => {
    if (!confirm('Auto-fill realistic ratings for all products with 0 reviews?')) return;
    setSeeding(true);
    setSeedMsg('');
    try {
      const res = await fetch('/api/admin/products/seed-reviews', { method: 'POST', credentials: 'include' });
      const data = await res.json() as { message: string; updated: number };
      setSeedMsg(data.message);
      // Reload products to reflect new values
      const r = await fetch('/api/products?limit=200');
      const d = await r.json() as { products: ProductRow[] };
      setProducts((d.products || []).map(p => ({
        ...p,
        _rating: String(p.rating ?? 0),
        _reviews: String(p.reviews ?? 0),
        _dirty: false, _saved: false, _error: '',
      })));
    } catch {
      setSeedMsg('Failed to seed reviews');
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedMsg(''), 4000);
    }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || (filter === 'no-reviews' && p.reviews === 0);
    return matchSearch && matchFilter;
  });

  const dirtyCount = products.filter(p => p._dirty).length;
  const noReviewCount = products.filter(p => p.reviews === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <FiLoader className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FiStar className="w-7 h-7 text-yellow-400" style={{ fill: 'currentColor' }} />
            Ratings & Reviews
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {noReviewCount > 0
              ? <span className="text-amber-600 font-medium">{noReviewCount} products have 0 reviews</span>
              : 'All products have reviews'} · {products.length} total products
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {seedMsg && (
            <span className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
              {seedMsg}
            </span>
          )}
          {noReviewCount > 0 && (
            <button
              onClick={seedReviews}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
              title="Auto-fill realistic ratings for products with 0 reviews"
            >
              {seeding ? <FiLoader className="animate-spin w-4 h-4" /> : <FiZap className="w-4 h-4" />}
              Auto-fill {noReviewCount} products
            </button>
          )}
          <button
            onClick={saveAll}
            disabled={dirtyCount === 0 || savingAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {savingAll ? <FiLoader className="animate-spin w-4 h-4" /> : <FiSave className="w-4 h-4" />}
            Save All {dirtyCount > 0 && `(${dirtyCount} changes)`}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white w-64"
          />
        </div>
        <div className="flex gap-2">
          {(['no-reviews', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'no-reviews' ? `No reviews (${noReviewCount})` : `All (${products.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FiStar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No products match this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating (0–5)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Review Count</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p._dirty ? 'bg-amber-50/40' : ''}`}>
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          {p.images?.[0] && (
                            <Image
                              src={normalizeProductImageUrl(p.images[0].url) || ''}
                              alt={p.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          )}
                        </div>
                        <p className="font-medium text-gray-900 text-sm line-clamp-2 max-w-xs">{p.name}</p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{p.category}</td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1.5">
                        <StarPicker
                          value={parseFloat(p._rating) || 0}
                          onChange={v => updateRating(p.id, v)}
                        />
                        <input
                          type="number"
                          min={0}
                          max={5}
                          step={0.1}
                          value={p._rating}
                          onChange={e => update(p.id, '_rating', e.target.value)}
                          className="w-16 text-center px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
                        />
                      </div>
                    </td>

                    {/* Review count */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min={0}
                          value={p._reviews}
                          onChange={e => update(p.id, '_reviews', e.target.value)}
                          className="w-20 text-center px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                        />
                      </div>
                    </td>

                    {/* Save */}
                    <td className="px-4 py-3 text-right">
                      {p._error && (
                        <p className="text-red-500 text-xs mb-1 flex items-center justify-end gap-1">
                          <FiAlertCircle className="w-3 h-3" /> {p._error}
                        </p>
                      )}
                      <button
                        onClick={() => saveOne(p.id)}
                        disabled={!p._dirty}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          p._saved
                            ? 'bg-green-100 text-green-700'
                            : p._dirty
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {p._saved
                          ? <><FiCheck className="w-3.5 h-3.5" /> Saved</>
                          : <><FiSave className="w-3.5 h-3.5" /> Save</>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky save-all footer when there are unsaved changes */}
      {dirtyCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl">
          <span className="text-sm font-medium">{dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}</span>
          <button
            onClick={saveAll}
            disabled={savingAll}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-500 hover:bg-primary-400 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {savingAll ? <FiLoader className="animate-spin w-4 h-4" /> : <FiSave className="w-4 h-4" />}
            Save All
          </button>
        </div>
      )}
    </div>
  );
}
