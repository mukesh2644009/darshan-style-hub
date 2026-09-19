'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FiPackage, FiEdit, FiEye, FiExternalLink, FiDownload, FiLoader, FiAlertTriangle, FiX,
  FiCheckCircle, FiMoreVertical,
} from 'react-icons/fi';
import WhatsAppShareButton from './WhatsAppShareButton';
import DeleteProductButton from './DeleteProductButton';

const CATEGORY_BADGE_CLASS: Record<string, string> = {
  'Suits': 'bg-purple-100 text-purple-800',
  'Co Ord Sets': 'bg-orange-100 text-orange-800',
  'Kurtis': 'bg-green-100 text-green-800',
  'Tops': 'bg-blue-100 text-blue-800',
  'Sarees': 'bg-pink-100 text-pink-800',
  'Western Dress': 'bg-teal-100 text-teal-800',
};
const categoryBadgeClass = (category: string) => CATEGORY_BADGE_CLASS[category] || 'bg-gray-100 text-gray-800';

interface ProductRow {
  id: string;
  sku: string;
  slug: string | null;
  name: string;
  subcategory: string;
  category: string;
  afNumber: string | null;
  price: number;
  originalPrice: number | null;
  featured: boolean;
  newArrival: boolean;
  images: { url: string }[];
  sizes: { id: string; size: string; quantity: number }[];
  colors: { id: string; name: string; hex: string }[];
}

interface MissingFieldsByProduct {
  productId: string;
  sku: string;
  name: string;
  missingFields: { field: string; label: string }[];
}

interface MyntraDetailsSummary {
  productId: string;
  sku: string;
  name: string;
  filledFields: number;
  filledMeasurementCells: number;
  reviewFields: string[];
  blockedFields: string[];
  skipped?: string;
}

interface Props {
  products: ProductRow[];
  totalCount: number;
  activeCategory: string;
}

/** Generic click-to-open, click-outside-to-close dropdown. Used for both the
 * per-row "Actions" menu and the top "Bulk Actions" menu. */
function DropdownMenu({
  trigger,
  align = 'right',
  disabled,
  children,
}: {
  trigger: React.ReactNode;
  align?: 'left' | 'right';
  disabled?: boolean;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium text-gray-700"
      >
        {trigger}
      </button>
      {open && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export default function ProductsTable({ products, totalCount, activeCategory }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMissing, setBulkMissing] = useState<MissingFieldsByProduct[] | null>(null);

  // Myntra: one click both fetches/fills details AND generates the Excel. If a
  // mandatory field is still missing after the fill, the export step reports it
  // via the same missing-fields popup instead of downloading a broken file.
  const [myntraLoading, setMyntraLoading] = useState(false);
  const [myntraError, setMyntraError] = useState('');
  const [myntraSummary, setMyntraSummary] = useState<MyntraDetailsSummary[] | null>(null);

  const allSelected = products.length > 0 && products.every((p) => selected.has(p.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allSelected) return new Set();
      return new Set(products.map((p) => p.id));
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleMyntraAction = async () => {
    setMyntraLoading(true);
    setMyntraError('');
    setMyntraSummary(null);
    setBulkMissing(null);
    const productIds = Array.from(selected);

    try {
      // Step 1: fill whatever can be auto-filled from the product's own data.
      const detailsResponse = await fetch('/api/admin/myntra/autofill', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds }),
      });
      const detailsData = await detailsResponse.json().catch(() => ({}));
      if (!detailsResponse.ok) {
        setMyntraError(detailsData.error || 'Failed to fetch Myntra details');
        return;
      }
      setMyntraSummary(detailsData.results || []);

      // Step 2: immediately try to generate the Excel with whatever's now filled in.
      const exportResponse = await fetch('/api/admin/myntra/export', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds }),
      });

      if (exportResponse.status === 422) {
        const exportData = await exportResponse.json();
        setBulkMissing(exportData.details || []);
        return;
      }

      if (!exportResponse.ok) {
        const exportData = await exportResponse.json().catch(() => ({}));
        setMyntraError(exportData.error || 'Export failed');
        return;
      }

      const blob = await exportResponse.blob();
      const disposition = exportResponse.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] || 'Myntra-Export.xlsx';

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMyntraError(err instanceof Error ? err.message : 'Myntra export failed');
    } finally {
      setMyntraLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="px-6 py-3 bg-primary-50 border-b border-primary-100 space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm font-medium text-primary-800">{selected.size} selected</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleMyntraAction}
                disabled={myntraLoading}
                title="Fetches Myntra listing details for the selected products, then immediately generates the Excel"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 text-white hover:bg-pink-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {myntraLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiDownload className="w-4 h-4" />}
                Myntra
              </button>
              <button
                type="button"
                disabled
                title="Not built yet — needs a confirmed Flipkart bulk-template/API reference first"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium opacity-40 cursor-not-allowed"
              >
                <FiDownload className="w-4 h-4" />
                Flipkart
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear selection
              </button>
            </div>
          </div>

          {myntraError && (
            <p className="text-sm text-red-600">{myntraError}</p>
          )}

          {myntraSummary && (
            <div className="text-sm bg-white border border-primary-200 rounded-lg p-3 space-y-2">
              <p className="flex items-center gap-1.5 text-primary-800 font-medium">
                <FiCheckCircle className="w-4 h-4" />
                Fetched Myntra details for {myntraSummary.length} product{myntraSummary.length === 1 ? '' : 's'}.
              </p>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {myntraSummary.map((s) => (
                  <li key={s.productId} className="text-gray-700">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{s.sku}</span>{' '}
                    {s.skipped ? (
                      <span className="text-gray-500">— {s.skipped}</span>
                    ) : (
                      <>
                        filled {s.filledFields} field{s.filledFields === 1 ? '' : 's'}
                        {s.filledMeasurementCells > 0 && ` + ${s.filledMeasurementCells} measurement cell${s.filledMeasurementCells === 1 ? '' : 's'}`}
                        {s.blockedFields.length > 0 && (
                          <span className="text-red-600"> — still needs: {s.blockedFields.join(', ')}</span>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {products.length === 0 ? (
        <div className="p-12 text-center">
          <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {totalCount === 0 ? 'No products yet' : `No products in "${activeCategory}"`}
          </h3>
          <p className="text-gray-500">
            {totalCount === 0 ? (
              'Add your first product to get started.'
            ) : (
              <Link href="/admin/products" className="text-primary-600 hover:underline">Clear filter</Link>
            )}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    aria-label="Select all products"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sizes</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colors</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className={`hover:bg-gray-50 ${selected.has(product.id) ? 'bg-primary-50/40' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleOne(product.id)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      aria-label={`Select ${product.name}`}
                    />
                  </td>
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
                          <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-400 flex-col gap-0.5" title="No images uploaded">
                            <FiPackage className="w-4 h-4" />
                            <span className="text-[9px] font-bold leading-none">NO IMG</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{product.subcategory}</p>
                        {product.category === 'Sarees' && product.afNumber && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            🏷️ {product.afNumber}
                          </span>
                        )}
                        <a
                          href={`https://www.darshanstylehub.com/products/${product.slug || product.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                        >
                          <FiExternalLink className="w-3 h-3" />
                          /products/{product.slug || product.id}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${categoryBadgeClass(product.category)}`}>
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
                    <DropdownMenu trigger={<><FiMoreVertical className="w-4 h-4" /> Actions</>}>
                      {(close) => (
                        <>
                          <div onClick={close}>
                            <Link
                              href={`/admin/products/${product.sku || product.id}`}
                              className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <FiEdit className="w-4 h-4" />
                              Edit
                            </Link>
                          </div>
                          <div onClick={close}>
                            <WhatsAppShareButton
                              product={{
                                id: product.id,
                                slug: product.slug,
                                name: product.name,
                                price: product.price,
                                originalPrice: product.originalPrice,
                                category: product.category,
                              }}
                              asMenuItem
                            />
                          </div>
                          <div className="border-t border-gray-100 my-1" />
                          <DeleteProductButton
                            productId={product.id}
                            productName={product.name}
                            asMenuItem
                          />
                        </>
                      )}
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk export validation errors */}
      {bulkMissing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiAlertTriangle className="text-amber-500" />
                Some products aren&apos;t ready for Myntra export
              </h3>
              <button onClick={() => setBulkMissing(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            {bulkMissing.length === 0 ? (
              <p className="text-sm text-gray-600">None of the selected products&apos; categories are supported for Myntra export.</p>
            ) : (
              <div className="space-y-4">
                {bulkMissing.map((item) => (
                  <div key={item.productId}>
                    <p className="text-sm font-semibold text-gray-800 mb-1.5">{item.sku} — {item.name}</p>
                    {item.missingFields.length === 0 ? (
                      <p className="text-sm text-gray-500">Category not supported for Myntra export.</p>
                    ) : (
                      <ul className="space-y-1">
                        {item.missingFields.map((f) => (
                          <li key={f.field} className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                            {f.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
