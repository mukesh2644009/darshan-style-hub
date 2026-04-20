'use client';

import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f6f5f0] font-sans text-gray-900 antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-center text-sm text-gray-600">
            {process.env.NODE_ENV === 'development' ? error.message : 'Please refresh the page or try again later.'}
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[#ab372a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#8e3126]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
