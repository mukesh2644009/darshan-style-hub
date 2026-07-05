'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore, CartItem } from '@/store/cartStore';

function RecoverCartInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restoreCart = useCartStore((s) => s.restoreCart);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) {
      setStatus('error');
      return;
    }

    fetch(`/api/abandoned-cart?id=${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { items: CartItem[] }) => {
        if (data.items?.length) {
          restoreCart(data.items);
          router.replace('/checkout');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [searchParams, restoreCart, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      {status === 'loading' ? (
        <>
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-lg font-medium text-gray-800">Restoring your cart…</p>
          <p className="text-sm text-gray-500 mt-1">Please wait, taking you to checkout.</p>
        </>
      ) : (
        <>
          <p className="text-lg font-medium text-gray-800">This cart link has expired.</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">The items may no longer be available.</p>
          <a href="/products" className="btn-primary">Continue Shopping</a>
        </>
      )}
    </div>
  );
}

export default function RecoverCartPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <RecoverCartInner />
    </Suspense>
  );
}
