'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiCheckCircle, FiXCircle, FiLoader, FiZap } from 'react-icons/fi';

interface Step { step: string; ok: boolean; detail: string }

async function call(url: string, init: RequestInit) {
  const res = await fetch(url, { credentials: 'include', ...init });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
const postJson = (url: string, body: unknown, method = 'POST') =>
  call(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// Shown after a product loaded from the sheet is created: runs the sheet
// "finish" step (Myntra photos → resizeimages, sheet row + category tab), then
// offers AI Fill All (Flipkart + Myntra details in one go).
export default function SheetFinishPanel({ productId, sku, tab, sNo, convertedFiles = [] }: {
  productId: string; sku: string; tab: string; sNo: string; convertedFiles?: string[];
}) {
  const [finishing, setFinishing] = useState(true);
  const [steps, setSteps] = useState<Step[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSteps, setAiSteps] = useState<Step[]>([]);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    postJson('/api/admin/sheet/finish', { tab, sNo, productId, convertedFiles })
      .then(({ ok, data }) => setSteps(ok ? data.steps : [{ step: 'Sheet / photo step', ok: false, detail: data.error || 'failed' }]))
      .catch((err) => setSteps([{ step: 'Sheet / photo step', ok: false, detail: String(err) }]))
      .finally(() => setFinishing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, tab, sNo]);

  const aiFillAll = async () => {
    setAiBusy(true);
    const out: Step[] = [];
    const push = (s: Step) => { out.push(s); setAiSteps([...out]); };
    const nonEmpty = (o: Record<string, string>) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v));

    // Rule-based defaults first (only fill empty fields), then AI on top.
    for (const p of ['flipkart', 'myntra'] as const) {
      const r = await postJson(`/api/admin/${p}/autofill`, { productIds: [productId] });
      push({ step: `${p === 'flipkart' ? 'Flipkart' : 'Myntra'} defaults`, ok: r.ok, detail: r.ok ? 'standard values + size chart filled' : r.data.error || `HTTP ${r.status}` });
    }
    for (const p of ['flipkart', 'myntra'] as const) {
      const label = p === 'flipkart' ? 'Flipkart' : 'Myntra';
      const ai = await postJson(`/api/admin/${p}/ai-fill`, { productId });
      if (!ai.ok) {
        push({ step: `${label} AI Fill`, ok: false, detail: ai.data.error || `HTTP ${ai.status}` });
        continue;
      }
      const patch = nonEmpty(ai.data.suggestion);
      const saved = await postJson(`/api/admin/${p}/detail`, { productId, patch }, 'PATCH');
      push({ step: `${label} AI Fill`, ok: saved.ok, detail: saved.ok ? `${Object.keys(patch).length} fields filled & saved` : saved.data.error || 'save failed' });
    }
    setAiBusy(false);
  };

  const row = (s: Step) => (
    <li key={s.step} className="flex items-start gap-2 text-sm">
      {s.ok ? <FiCheckCircle className="w-4 h-4 mt-0.5 text-green-600 shrink-0" /> : <FiXCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />}
      <span><span className="font-medium">{s.step}</span> — <span className="text-gray-600 break-all">{s.detail}</span></span>
    </li>
  );

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
        <FiCheckCircle className="w-5 h-5" /> {sku} created
      </h2>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Sheet & photos</h3>
        {finishing ? (
          <p className="flex items-center gap-2 text-sm text-gray-600"><FiLoader className="w-4 h-4 animate-spin" /> Converting photos for Myntra and updating the sheet…</p>
        ) : (
          <ul className="space-y-1">{steps.map(row)}</ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Flipkart & Myntra details</h3>
        <button
          type="button"
          onClick={aiFillAll}
          disabled={aiBusy}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium disabled:opacity-50"
        >
          {aiBusy ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiZap className="w-4 h-4" />}
          {aiBusy ? 'AI working (up to 2 min)…' : 'AI Fill All (Flipkart + Myntra)'}
        </button>
        {aiSteps.length > 0 && <ul className="space-y-1 mt-3">{aiSteps.map(row)}</ul>}
        <p className="text-xs text-gray-500 mt-2">
          Then open the product&apos;s Flipkart and Myntra panels from the Products list to check the ⚠ verify fields before exporting.
        </p>
      </div>

      <div className="flex gap-3">
        <Link href="/admin/products" className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
          Go to Products
        </Link>
        <a href="/admin/products/new" className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
          Add next product
        </a>
      </div>
    </div>
  );
}
