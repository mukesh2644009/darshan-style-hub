'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 px-4 py-16 bg-accent-50">
      <div className="text-center max-w-md">
        <h1 className="font-display text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 text-sm mb-6">
          {process.env.NODE_ENV === 'development' ? error.message : 'Please try again in a moment.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-primary-600 px-5 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-50"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
