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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <div className="flex items-center gap-1.5">
        <div className="text-xs text-gray-600 truncate max-w-[120px]">
          {items[0]?.product?.name ?? '—'}
          {items.length > 1 && <span className="text-gray-400 ml-1">+{items.length - 1}</span>}
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors shrink-0"
          title="View items"
        >
          <FiEye className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-[300] w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
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
