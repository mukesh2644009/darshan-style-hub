'use client';

import { useState } from 'react';
import { FiDownloadCloud, FiLoader, FiAlertTriangle } from 'react-icons/fi';

export interface SheetRow {
  tab: string;
  sNo: string;
  sku: string;
  sheetCategory: string;
  siteCategory: string;
  realPrice: number;
  sellingPrice: number;
  fabricSpec: string;
  rawDescription: string;
  bullets: string[];
  itemName: string;
  sizes: { size: string; quantity: number }[];
  siteDescription: string;
  sizeConverted: string;
  addedToSite: string;
}

// "Load from Sheet": pulls one row (tab + S.No) of the parent Google Sheet
// into the Add Product form. Works on the laptop admin only.
export default function SheetImportPanel({ onLoaded }: { onLoaded: (row: SheetRow) => void }) {
  const [tab, setTab] = useState('Sheet2');
  const [sNo, setSNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<SheetRow | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    setWarnings([]);
    try {
      const res = await fetch(`/api/admin/sheet/row?tab=${encodeURIComponent(tab)}&sno=${encodeURIComponent(sNo)}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not read the sheet');
        return;
      }
      const row = data.row as SheetRow;
      const w: string[] = [];
      if (data.existing) w.push(`SKU ${row.sku} already exists on the site ("${data.existing.name}") — saving will fail; change the SKU or edit that product instead.`);
      if (!row.siteCategory) w.push(`Category "${row.sheetCategory}" doesn't match a site category — pick one below.`);
      if (row.sizes.length === 0) w.push('No sizes found — fill the sheet\'s "Size" column like "S-10, M-10, L-10, XL-10, 2XL-10" (one per line is fine), or select sizes below.');
      if (!row.sku) w.push('SKU is empty in the sheet.');
      if (row.addedToSite.toLowerCase() === 'yes') w.push('Sheet says this row was already added to the site.');
      setWarnings(w);
      setLoaded(row);
      onLoaded(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the sheet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-emerald-100">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Load from Sheet</h2>
      <p className="text-sm text-gray-500 mb-4">
        Fill this form from the parent Google Sheet — enter the tab and S.No, then add photos and click AI Item Name.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sheet tab</label>
          <input
            type="text"
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            className="w-36 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">S.No</label>
          <input
            type="text"
            inputMode="numeric"
            value={sNo}
            onChange={(e) => setSNo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (sNo) load(); } }}
            placeholder="e.g. 6"
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading || !sNo || !tab}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
        >
          {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiDownloadCloud className="w-4 h-4" />}
          Load
        </button>
        {loaded && !error && (
          <span className="text-sm text-emerald-700">
            Loaded {loaded.sku || '(no SKU)'} — {loaded.sheetCategory} → {loaded.siteCategory || '?'}
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {warnings.map((w) => (
            <li key={w} className="flex items-start gap-1.5 text-sm text-amber-700">
              <FiAlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
