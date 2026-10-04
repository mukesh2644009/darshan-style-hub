'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiX, FiLoader, FiCheckCircle, FiSave, FiDownload, FiImage } from 'react-icons/fi';
import MarketplaceCategoryHint from './MarketplaceCategoryHint';
import { marketplaceCategoryFor } from '@/lib/marketplaceCategories';
import MyntraListingFields, {
  type MyntraFormState,
  type SizeMeasurementForm,
  EMPTY_MYNTRA_FORM,
  EMPTY_SIZE_MEASUREMENT,
} from './MyntraListingFields';
import { platformPrice } from '@/lib/platformPricing';

interface Props {
  productId: string;
  onClose: () => void;
}

interface DetailResponse {
  sku: string;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  colors: { name: string }[];
  sizes: string[];
  imageUrl: string | null;
  myntra: Partial<Record<keyof MyntraFormState, string | null>> | null;
  measurements: ({ size: string } & Partial<Record<keyof SizeMeasurementForm, number | null>>)[];
}

const MEASUREMENT_FIELDS: (keyof SizeMeasurementForm)[] = ['bust', 'chest', 'frontLength', 'garmentWaist', 'hips', 'acrossShoulder', 'pyjamaWaist', 'inseamLength', 'toFitWaist'];

// Single-product Myntra review: same flow as the Flipkart panel — autofill
// runs first, then AI Fill / edit / Save. Multi-product selection still goes
// straight to the Myntra Excel export.
export default function MyntraReviewPanel({ productId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState<DetailResponse | null>(null);
  const [value, setValue] = useState<MyntraFormState>(EMPTY_MYNTRA_FORM);
  const [measurements, setMeasurements] = useState<Record<string, SizeMeasurementForm>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadingImages, setDownloadingImages] = useState(false);
  const [imagesSaved, setImagesSaved] = useState('');
  const myntraPrice = product ? platformPrice(product, 'myntra') : null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setSaved(false);

    // Autofill first (fills confidently-derivable fields + the shared co-ord
    // size chart, saving to the DB) so a new product doesn't open blank.
    fetch('/api/admin/myntra/autofill', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: [productId] }),
    })
      .catch(() => { /* non-fatal — the GET below still shows whatever's saved */ })
      .then(() => fetch(`/api/admin/myntra/detail?productId=${productId}`, { credentials: 'include' }))
      .then((res) => res!.json())
      .then((data: DetailResponse & { error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        setProduct(data);
        const merged = { ...EMPTY_MYNTRA_FORM };
        (Object.keys(EMPTY_MYNTRA_FORM) as (keyof MyntraFormState)[]).forEach((key) => {
          const v = data.myntra?.[key];
          if (v) merged[key] = v;
        });
        setValue(merged);
        const m: Record<string, SizeMeasurementForm> = {};
        for (const row of data.measurements) {
          m[row.size] = { ...EMPTY_SIZE_MEASUREMENT };
          for (const f of MEASUREMENT_FIELDS) m[row.size][f] = row[f] != null ? String(row[f]) : '';
        }
        setMeasurements(m);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [productId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/myntra/detail', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, patch: value, measurements }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Save failed');
        return;
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadImages = async () => {
    setDownloadingImages(true);
    setDownloadError('');
    setImagesSaved('');
    try {
      // Saved on this laptop in resizeimages\<sku>\ (replacing that folder's photos).
      const res = await fetch('/api/admin/myntra/images', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: [productId] }),
      });
      const data = await res.json().catch(() => ({}));
      const r = data.results?.[0] as { folder: string; count: number; replaced: number; error?: string } | undefined;
      if (!res.ok || !r || r.error) {
        setDownloadError(data.error || r?.error || 'Saving Myntra images failed');
        return;
      }
      setImagesSaved(`Saved ${r.count} photo(s) in ${r.folder}${r.replaced ? ` (replaced ${r.replaced} old)` : ''}`);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Image download failed');
    } finally {
      setDownloadingImages(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      const res = await fetch('/api/admin/myntra/export', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: [productId] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const missing = data.details?.[0]?.missingFields?.map((f: { label: string }) => f.label).join(', ');
        setDownloadError(missing ? `Still missing: ${missing}` : data.error || 'Download failed');
        return;
      }
      const blob = await res.blob();
      const match = (res.headers.get('Content-Disposition') || '').match(/filename="(.+)"/);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = match?.[1] || 'Myntra-Export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="px-6 py-4 bg-pink-50/50 border-b border-pink-100">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {product?.imageUrl && (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white">
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="48px" unoptimized />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              Review Myntra listing {product ? `— ${product.name.slice(0, 60)}` : ''}
            </h3>
            {product && myntraPrice && (
              <p className="text-xs text-gray-500">
                <span className="font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5">{product.sku}</span>
                {' '}· {product.category}
                {' '}· Site ₹{product.price.toLocaleString('en-IN')} → <b className="text-pink-700">Myntra ₹{myntraPrice.price.toLocaleString('en-IN')}</b>
                {' '}(MRP ₹{myntraPrice.mrp.toLocaleString('en-IN')}{myntraPrice.capped ? ', capped at MRP' : ''})
              </p>
            )}
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0" title="Close">
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <FiLoader className="w-4 h-4 animate-spin" /> Loading...
        </p>
      )}

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {product && !loading && (
        <>
          <div className="mb-3">
            <MarketplaceCategoryHint category={product.category} only="myntra" />
          </div>
          <MyntraListingFields
            productId={productId}
            defaultOpen
            category={product.category}
            subcategory={product.subcategory}
            productName={product.name}
            productDescription={product.description}
            colors={product.colors}
            sizes={product.sizes}
            value={value}
            onChange={(patch) => { setValue((prev) => ({ ...prev, ...patch })); setSaved(false); }}
            measurements={measurements}
            onMeasurementChange={(size, field, v) => {
              setMeasurements((prev) => ({ ...prev, [size]: { ...(prev[size] || EMPTY_SIZE_MEASUREMENT), [field]: v } }));
              setSaved(false);
            }}
          />

          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 text-white hover:bg-pink-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saving ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
              Save
            </button>
            {saved && (
              <>
                <span className="flex items-start gap-1.5 text-sm text-green-700">
                  <FiCheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Saved — next: Download Myntra Sheet, then on Myntra: Add Listing in Bulk → Article type{' '}
                    <b className="text-pink-800">{marketplaceCategoryFor(product?.category || '').myntra || 'not set up yet — ask before uploading'}</b>
                    {' '}→ Studio: Brand Owned Studio → upload the sheet.
                  </span>
                </span>
                {/* Unlike Flipkart, Myntra accepts our own file (columns match its template exactly). */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-pink-700 border border-pink-300 hover:bg-pink-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {downloading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiDownload className="w-4 h-4" />}
                  Download Myntra Sheet
                </button>
              </>
            )}
            {/* Photos as files (1080x1440 JPEG, <=500 KB) for uploading on Myntra by hand. */}
            <button
              type="button"
              onClick={handleDownloadImages}
              disabled={downloadingImages}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-pink-700 border border-pink-300 hover:bg-pink-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              {downloadingImages ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiImage className="w-4 h-4" />}
              Download Myntra Images
            </button>
          </div>
          {downloadError && <p className="text-sm text-red-600 mt-2">{downloadError}</p>}
          {imagesSaved && <p className="text-sm text-green-700 mt-2 break-all">✓ {imagesSaved}</p>}
        </>
      )}
    </div>
  );
}
