'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiX, FiLoader, FiCheckCircle, FiSave } from 'react-icons/fi';
import FlipkartListingFields, { type FlipkartFormState, EMPTY_FLIPKART_FORM } from './FlipkartListingFields';
import { platformPrice, markupLabel } from '@/lib/platformPricing';

interface Props {
  productId: string;
  onClose: () => void;
}

interface DetailResponse {
  sku: string;
  category: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  colors: { name: string }[];
  imageUrl: string | null;
  flipkart: Partial<FlipkartFormState> | null;
}

export default function FlipkartReviewPanel({ productId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState<DetailResponse | null>(null);
  const [value, setValue] = useState<FlipkartFormState>(EMPTY_FLIPKART_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const flipkartPrice = product ? platformPrice(product, 'flipkart') : null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setSaved(false);

    // Run autofill first (fills every confidently-derivable + mandatory field
    // it can, persisting to the DB) so the panel opens already populated
    // instead of showing a blank form for a brand-new product — this was the
    // actual bug behind "many fields empty" (DSH_KP_03 had no saved record
    // yet, and this panel used to only read whatever was already saved).
    fetch('/api/admin/flipkart/autofill', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: [productId] }),
    })
      .catch(() => { /* non-fatal — the GET below still shows whatever's saved */ })
      .then(() => fetch(`/api/admin/flipkart/detail?productId=${productId}`, { credentials: 'include' }))
      .then((res) => res!.json())
      .then((data: DetailResponse & { error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        setProduct(data);
        const merged = { ...EMPTY_FLIPKART_FORM };
        (Object.keys(EMPTY_FLIPKART_FORM) as (keyof FlipkartFormState)[]).forEach((key) => {
          const v = data.flipkart?.[key];
          if (v) merged[key] = v;
        });
        setValue(merged);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [productId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/flipkart/detail', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, patch: value }),
      });
      const data = await res.json();
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

  return (
    <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {product?.imageUrl && (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white">
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="48px" unoptimized />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              Review Flipkart listing {product ? `— ${product.name.slice(0, 60)}` : ''}
            </h3>
            {product && (
              <p className="text-xs text-gray-500">
                <span className="font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5">{product.sku}</span>
                {' '}· {product.category}
                {' '}· Site ₹{product.price.toLocaleString('en-IN')} → <b className="text-blue-700">Flipkart ₹{flipkartPrice!.price.toLocaleString('en-IN')}</b>
                {' '}(MRP ₹{flipkartPrice!.mrp.toLocaleString('en-IN')}
                {flipkartPrice!.capped ? ', capped at MRP' : `, ${markupLabel('flipkart')}`})
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
          <FlipkartListingFields
            productId={productId}
            category={product.category}
            productName={product.name}
            productDescription={product.description}
            colors={product.colors}
            value={value}
            onChange={(patch) => { setValue((prev) => ({ ...prev, ...patch })); setSaved(false); }}
            defaultOpen
          />

          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saving ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
              Save
            </button>

            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <FiCheckCircle className="w-4 h-4" /> Saved — next: tick the product(s), then Get Flipkart Template
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
