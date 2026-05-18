'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FiSave, FiLoader, FiCheck, FiSearch, FiAlertCircle, FiTag } from 'react-icons/fi';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';

const CATEGORIES = ['Suits', 'Kurtis', 'Co Ord Sets', 'Tops'];

const SUBCATEGORIES: Record<string, string[]> = {
  Suits: ['Designer Suits', 'Salwar Suits', 'Party Wear Suits', 'Casual Suits', 'Anarkali Suits', 'Printed Suits'],
  Kurtis: ['Printed Kurti', 'Cotton Kurti', 'Party Wear Kurti', 'Casual Kurti', 'Embroidered Kurti'],
  'Co Ord Sets': ['Casual Co Ord Sets', 'Designer Co Ord Sets', 'Printed Co Ord Sets', 'Party Wear Co Ord Sets'],
  Tops: ['Casual Tops', 'Printed Tops', 'Party Tops'],
};

interface ProductRow {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  images: { url: string }[];
  _category: string;
  _subcategory: string;
  _dirty: boolean;
  _saved: boolean;
  _saving: boolean;
  _error: string;
}

export default function BulkCategoryPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [savingAll, setSavingAll] = useState(false);
  const [allSavedMsg, setAllSavedMsg] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setRows(
            data.products.map((p: ProductRow) => ({
              ...p,
              _category: p.category,
              _subcategory: p.subcategory || '',
              _dirty: false,
              _saved: false,
              _saving: false,
              _error: '',
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function updateRow(id: string, field: '_category' | '_subcategory', value: string) {
    setRows(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value, _dirty: true, _saved: false, _error: '' };
        if (field === '_category') updated._subcategory = '';
        return updated;
      })
    );
  }

  async function saveRow(id: string) {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    setRows(prev => prev.map(r => r.id === id ? { ...r, _saving: true, _error: '' } : r));
    try {
      const res = await fetch('/api/admin/products/bulk-category', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ id, category: row._category, subcategory: row._subcategory }]),
      });
      if (res.ok) {
        setRows(prev => prev.map(r => r.id === id ? { ...r, _saving: false, _dirty: false, _saved: true, category: row._category, subcategory: row._subcategory } : r));
      } else {
        setRows(prev => prev.map(r => r.id === id ? { ...r, _saving: false, _error: 'Save failed' } : r));
      }
    } catch {
      setRows(prev => prev.map(r => r.id === id ? { ...r, _saving: false, _error: 'Network error' } : r));
    }
  }

  async function saveAll() {
    const dirty = rows.filter(r => r._dirty);
    if (!dirty.length) return;
    setSavingAll(true);
    setAllSavedMsg('');
    try {
      const res = await fetch('/api/admin/products/bulk-category', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dirty.map(r => ({ id: r.id, category: r._category, subcategory: r._subcategory }))),
      });
      if (res.ok) {
        setRows(prev => prev.map(r =>
          r._dirty ? { ...r, _dirty: false, _saved: true, category: r._category, subcategory: r._subcategory } : r
        ));
        setAllSavedMsg(`${dirty.length} product${dirty.length > 1 ? 's' : ''} saved!`);
        setTimeout(() => setAllSavedMsg(''), 3000);
      }
    } finally {
      setSavingAll(false);
    }
  }

  const filtered = rows.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || r.category === filterCat;
    return matchSearch && matchCat;
  });

  const dirtyCount = rows.filter(r => r._dirty).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <FiLoader className="animate-spin w-8 h-8 text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiTag className="w-6 h-6 text-primary-600" />
            Fix Product Categories
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Change category & subcategory for any product. Click Save on each row or use Save All.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {allSavedMsg && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <FiCheck className="w-4 h-4" /> {allSavedMsg}
            </span>
          )}
          <button
            onClick={saveAll}
            disabled={savingAll || dirtyCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savingAll ? <FiLoader className="animate-spin w-4 h-4" /> : <FiSave className="w-4 h-4" />}
            Save All {dirtyCount > 0 && `(${dirtyCount})`}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary-500 bg-white"
        >
          <option value="All">All Categories</option>
          {Array.from(new Set(rows.map(r => r.category))).sort().map(c => (
            <option key={c} value={c}>{c} ({rows.filter(r => r.category === c).length})</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Showing <strong>{filtered.length}</strong> of {rows.length} products
        {dirtyCount > 0 && <span className="ml-2 text-amber-600 font-medium">· {dirtyCount} unsaved change{dirtyCount > 1 ? 's' : ''}</span>}
      </p>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"></th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-52">Subcategory</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(row => (
              <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${row._dirty ? 'bg-amber-50/40' : ''}`}>
                {/* Thumbnail */}
                <td className="px-4 py-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {row.images?.[0] ? (
                      <Image
                        src={normalizeProductImageUrl(row.images[0].url)}
                        alt={row.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                    )}
                  </div>
                </td>

                {/* Name */}
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 line-clamp-2 leading-snug">{row.name}</p>
                  {row._dirty && (
                    <span className="text-[10px] text-amber-600 font-medium">● unsaved</span>
                  )}
                </td>

                {/* Category dropdown */}
                <td className="px-4 py-3">
                  <select
                    value={row._category}
                    onChange={e => updateRow(row.id, '_category', e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-sm focus:outline-none focus:border-primary-500 transition-colors ${
                      row._category !== row.category ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </td>

                {/* Subcategory dropdown */}
                <td className="px-4 py-3">
                  <select
                    value={row._subcategory}
                    onChange={e => updateRow(row.id, '_subcategory', e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-sm focus:outline-none focus:border-primary-500 transition-colors ${
                      row._subcategory !== (row.subcategory || '') ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <option value="">— none —</option>
                    {(SUBCATEGORIES[row._category] || []).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>

                {/* Save button */}
                <td className="px-4 py-3 text-right">
                  {row._error && (
                    <span title={row._error} className="text-red-500 mr-2">
                      <FiAlertCircle className="w-4 h-4 inline" />
                    </span>
                  )}
                  {row._saved && !row._dirty && (
                    <span className="text-green-500 mr-2">
                      <FiCheck className="w-4 h-4 inline" />
                    </span>
                  )}
                  <button
                    onClick={() => saveRow(row.id)}
                    disabled={!row._dirty || row._saving}
                    className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {row._saving ? <FiLoader className="animate-spin w-3 h-3 inline" /> : 'Save'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
