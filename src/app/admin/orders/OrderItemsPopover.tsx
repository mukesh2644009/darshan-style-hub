'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FiEye, FiX } from 'react-icons/fi';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
  product?: {
    name: string;
    images: { url: string }[];
  } | null;
}

export default function OrderItemsPopover({ items }: { items: OrderItem[] }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const openPopover = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Show below the button; shift left if too close to right edge
      const left = Math.min(rect.left, window.innerWidth - 320 - 8);
      setDropPos({ top: rect.bottom + window.scrollY + 4, left });
    }
    setOpen(v => !v);
  };

  return (
    <div className="inline-block" ref={ref}>
      <div className="flex items-center gap-2">
        {/* Stacked thumbnail previews */}
        <div className="flex -space-x-2">
          {items.slice(0, 3).map((item, idx) => {
            const imgUrl = item.product?.images?.[0]?.url
              ? normalizeProductImageUrl(item.product.images[0].url)
              : null;
            return (
              <div
                key={item.id}
                className="w-9 h-10 rounded-md border-2 border-white bg-gray-100 overflow-hidden shrink-0 shadow-sm"
                style={{ zIndex: 10 - idx }}
              >
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt={item.product?.name || ''}
                    width={36}
                    height={40}
                    className="w-full h-full object-cover object-top"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-[8px]">?</div>
                )}
              </div>
            );
          })}
          {items.length > 3 && (
            <div className="w-9 h-10 rounded-md border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-500 shadow-sm" style={{ zIndex: 7 }}>
              +{items.length - 3}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="text-xs text-gray-700 font-medium truncate max-w-[100px] leading-tight">
            {items[0]?.product?.name ?? '—'}
          </div>
          {items.length > 1 && (
            <span className="text-[10px] text-gray-400">+{items.length - 1} more</span>
          )}
        </div>

        <button
          ref={btnRef}
          onClick={openPopover}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors shrink-0"
          title="View all items"
        >
          <FiEye className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, zIndex: 9999 }}
          className="w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {items.length} Item{items.length !== 1 ? 's' : ''}
            </p>
            <button onClick={() => setOpen(false)} className="p-0.5 hover:bg-gray-200 rounded text-gray-400">
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {items.map((item) => {
              const imageUrl = item.product?.images?.[0]?.url
                ? normalizeProductImageUrl(item.product.images[0].url)
                : null;
              return (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                  {/* Image */}
                  <div className="w-14 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.product?.name || ''}
                        width={56}
                        height={64}
                        className="w-full h-full object-cover object-top"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                    )}
                  </div>
                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                      {item.product?.name || 'Product'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.size && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          Size: {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {item.color}
                        </span>
                      )}
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mt-1">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
