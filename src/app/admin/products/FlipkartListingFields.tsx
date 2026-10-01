'use client';

import { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiShoppingBag, FiRefreshCw, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { deriveFlipkartAutofill, FLIPKART_FIELD_LABELS } from '@/lib/flipkartAutofill';
import { isFlipkartSupportedCategory, getRequiredFlipkartFields } from '@/lib/flipkart';

export interface FlipkartFormState {
  category: string; colour: string; gtin: string; hsnFlipkart: string; hsnMyntra: string; taxCode: string;
  materialCareDescription: string; topFabric: string; bottomFabric: string; fabricType: string;
  netQuantity: string; packageContains: string;
  lengthCm: string; breadthCm: string; heightCm: string; weightKg: string;
  fulfilmentBy: string; procurementType: string; procurementSlaDays: string;
  locationId: string; fulfillmentProfile: string; dispatchSlaHours: string;
  topType: string; bottomType: string; neck: string; sleeveLength: string;
  topPattern: string; bottomPattern: string; occasion: string; ageGroup: string;
  fashionType: string; season: string; year: string;
  shapeType: string; suitableFor: string; pockets: string; packOf: string; attachedDupatta: string;
  fit: string; sleeveStyle: string; topsLength: string;
  productDetails: string; styleNote: string; tags: string; searchKeywords: string;
}

export const EMPTY_FLIPKART_FORM: FlipkartFormState = {
  category: '', colour: '', gtin: '', hsnFlipkart: '', hsnMyntra: '', taxCode: 'GST_APPAREL',
  materialCareDescription: '', topFabric: '', bottomFabric: '', fabricType: '',
  netQuantity: '', packageContains: '',
  lengthCm: '', breadthCm: '', heightCm: '', weightKg: '',
  fulfilmentBy: 'Seller', procurementType: 'REGULAR', procurementSlaDays: '1',
  locationId: '', fulfillmentProfile: 'NON_FBF', dispatchSlaHours: '24',
  topType: '', bottomType: '', neck: '', sleeveLength: '',
  topPattern: '', bottomPattern: '', occasion: '', ageGroup: '',
  fashionType: '', season: '', year: '',
  shapeType: '', suitableFor: '', pockets: '', packOf: '', attachedDupatta: '',
  fit: '', sleeveStyle: '', topsLength: '',
  productDetails: '', styleNote: '', tags: '', searchKeywords: '',
};

interface Props {
  productId?: string; // enables "AI Fill" (needs a saved product so the server can read its photos)
  category: string;
  subcategory?: string;
  productName: string;
  productDescription: string;
  colors: { name: string }[];
  value: FlipkartFormState;
  onChange: (patch: Partial<FlipkartFormState>) => void;
  defaultOpen?: boolean;
}

type FieldStatus = 'review' | 'blocked' | undefined;

function Field({ label, status, required, children }: { label: string; status?: FieldStatus; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-gray-400 font-normal" title="Required by Flipkart for this category">*</span>}
        {status === 'review' && (
          <span className="text-amber-600 font-normal" title="Auto-filled with a best-effort guess — verify before export">⚠ verify</span>
        )}
        {status === 'blocked' && (
          <span className="text-red-600 font-normal" title="Could not be auto-filled — needs your input">● needs input</span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputClass = 'w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
const inputClassFor = (status: FieldStatus, required?: boolean) =>
  status === 'review' ? `${inputClass} border-amber-300 bg-amber-50`
    : status === 'blocked' ? `${inputClass} border-red-300 bg-red-50`
    : required ? `${inputClass} border-gray-400`
    : inputClass;

export default function FlipkartListingFields({ productId, category, subcategory, productName, productDescription, colors, value, onChange, defaultOpen }: Props) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [reviewFields, setReviewFields] = useState<Set<string>>(new Set());
  const [blockedFields, setBlockedFields] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<{ filled: number; review: string[]; blocked: string[] } | null>(null);
  const supported = isFlipkartSupportedCategory(category);
  const requiredFields = new Set(getRequiredFlipkartFields({ category, name: productName }).map((f) => f.field));

  const set = (field: keyof FlipkartFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ [field]: e.target.value });
  const statusFor = (field: keyof FlipkartFormState): FieldStatus =>
    reviewFields.has(field) ? 'review' : blockedFields.has(field) ? 'blocked' : undefined;
  const requiredFor = (field: keyof FlipkartFormState) => requiredFields.has(field);

  const handleAutofill = () => {
    const outcome = deriveFlipkartAutofill({ name: productName, description: productDescription, category, colors });

    const filteredPatch: Partial<FlipkartFormState> = {};
    let filledCount = 0;
    Object.entries(outcome.patch).forEach(([k, v]) => {
      const key = k as keyof FlipkartFormState;
      if (!value[key]) { filteredPatch[key] = v; filledCount += 1; }
    });
    onChange(filteredPatch);

    setReviewFields(new Set(outcome.reviewFields));
    setBlockedFields(new Set(outcome.blockedFields));
    setSummary({ filled: filledCount, review: outcome.reviewFields, blocked: outcome.blockedFields });
    setOpen(true);
  };

  // Unlike Fetch, AI Fill overwrites its fields — it exists to correct the
  // text-only guesses (e.g. "Straight" for an A-line kurta). Nothing is saved
  // until the admin clicks Save, and every AI-set field is flagged to verify.
  const handleAiFill = async () => {
    if (!productId) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/admin/flipkart/ai-fill', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAiError(data.error || 'AI Fill failed');
        return;
      }
      const patch: Partial<FlipkartFormState> = {};
      Object.entries(data.suggestion as Record<string, string>).forEach(([k, v]) => {
        if (v) patch[k as keyof FlipkartFormState] = v;
      });
      onChange(patch);
      const aiFields = Object.keys(patch);
      setReviewFields((prev) => new Set([...Array.from(prev), ...aiFields]));
      setBlockedFields((prev) => new Set(Array.from(prev).filter((f) => !aiFields.includes(f))));
      setSummary({ filled: aiFields.length, review: aiFields, blocked: [] });
      setOpen(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI Fill failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100">
      <div className="flex items-center justify-between p-6">
        <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1">
          <FiShoppingBag className="text-blue-600 w-5 h-5" />
          <h2 className="text-lg font-bold text-gray-900">Flipkart Listing Details</h2>
          <span className="text-xs text-gray-400 font-normal">(optional — only needed to list this product on Flipkart)</span>
          {open ? <FiChevronDown /> : <FiChevronRight />}
        </button>
        {supported && (
          <button
            type="button"
            onClick={handleAutofill}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-1.5 shrink-0"
            title="Auto-fill fields from this product's name, description and colours"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            Fetch
          </button>
        )}
        {supported && productId && (
          <button
            type="button"
            onClick={handleAiFill}
            disabled={aiLoading}
            className="ml-2 flex items-center gap-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-3 py-1.5 shrink-0 disabled:opacity-60"
            title="AI reads the name, description and photos and drafts Key Features, Search Keywords, Description, Colour, Neck, Sleeve and Shape — review before saving"
          >
            {aiLoading ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <span aria-hidden>✨</span>}
            {aiLoading ? 'AI working (up to 1 min)…' : 'AI Fill'}
          </button>
        )}
      </div>
      {aiError && <p className="mx-6 -mt-3 mb-3 text-sm text-red-600">{aiError}</p>}

      {open && (
        <div className="px-6 pb-6 space-y-5">
          {!supported && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Flipkart data currently only supported for &quot;Co Ord Sets&quot;, &quot;Summer Co-ord Sets&quot;, &quot;Suits&quot;, and &quot;Kurtis&quot;.
            </p>
          )}

          {summary && (
            <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 space-y-1">
              <p className="text-blue-800">Auto-filled {summary.filled} field{summary.filled === 1 ? '' : 's'}.</p>
              {summary.review.length > 0 && (
                <p className="text-amber-700 flex items-start gap-1">
                  <FiAlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Please verify: {summary.review.map(f => FLIPKART_FIELD_LABELS[f] || f).join(', ')}.</span>
                </p>
              )}
              {summary.blocked.length > 0 && (
                <p className="text-red-700">Couldn&apos;t determine — please fill in: {summary.blocked.map(f => FLIPKART_FIELD_LABELS[f] || f).join(', ')}.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Category" status={statusFor('category')}>
              <input className={inputClassFor(statusFor('category'))} value={value.category} onChange={set('category')} placeholder="Coordset" />
            </Field>
            <Field label="Colour" status={statusFor('colour')} required={requiredFor('colour')}>
              <input className={inputClassFor(statusFor('colour'), requiredFor('colour'))} value={value.colour} onChange={set('colour')} />
            </Field>
            <Field label="GTIN / EAN" status={statusFor('gtin')}>
              <input className={inputClassFor(statusFor('gtin'))} value={value.gtin} onChange={set('gtin')} />
            </Field>
            <Field label="HSN (Flipkart, 4-digit)" status={statusFor('hsnFlipkart')} required={requiredFor('hsnFlipkart')}>
              <input className={inputClassFor(statusFor('hsnFlipkart'), requiredFor('hsnFlipkart'))} value={value.hsnFlipkart} onChange={set('hsnFlipkart')} placeholder="6204" />
            </Field>
            <Field label="HSN (Myntra, 8-digit — disputed)" status={statusFor('hsnMyntra')}>
              <input className={inputClassFor(statusFor('hsnMyntra'))} value={value.hsnMyntra} onChange={set('hsnMyntra')} />
            </Field>
            <Field label="Tax Code">
              <input className={inputClass} value={value.taxCode} onChange={set('taxCode')} placeholder="GST_APPAREL" />
            </Field>
            <Field label="Material Care Description" status={statusFor('materialCareDescription')} required={requiredFor('materialCareDescription')}>
              <input className={inputClassFor(statusFor('materialCareDescription'), requiredFor('materialCareDescription'))} value={value.materialCareDescription} onChange={set('materialCareDescription')} />
            </Field>
            <Field label="Top Fabric" status={statusFor('topFabric')} required={requiredFor('topFabric')}>
              <input className={inputClassFor(statusFor('topFabric'), requiredFor('topFabric'))} value={value.topFabric} onChange={set('topFabric')} />
            </Field>
            <Field label="Bottom Fabric" status={statusFor('bottomFabric')} required={requiredFor('bottomFabric')}>
              <input className={inputClassFor(statusFor('bottomFabric'), requiredFor('bottomFabric'))} value={value.bottomFabric} onChange={set('bottomFabric')} />
            </Field>
            <Field label={category === 'Tops' ? 'Brand Fabric (dropdown value)' : 'Fabric (Ethnic Set, separate enum)'} status={statusFor('fabricType')} required={requiredFor('fabricType')}>
              <input className={inputClassFor(statusFor('fabricType'), requiredFor('fabricType'))} value={value.fabricType} onChange={set('fabricType')} placeholder="Pure Cotton" />
            </Field>
            <Field label="Net Quantity" status={statusFor('netQuantity')} required={requiredFor('netQuantity')}>
              <input className={inputClassFor(statusFor('netQuantity'), requiredFor('netQuantity'))} value={value.netQuantity} onChange={set('netQuantity')} />
            </Field>
            <Field label="Package Contains / Items Included" status={statusFor('packageContains')}>
              <input className={inputClassFor(statusFor('packageContains'))} value={value.packageContains} onChange={set('packageContains')} />
            </Field>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Logistics (account-level defaults)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Length (cm)" status={statusFor('lengthCm')}>
                <input className={inputClassFor(statusFor('lengthCm'))} value={value.lengthCm} onChange={set('lengthCm')} />
              </Field>
              <Field label="Breadth (cm)" status={statusFor('breadthCm')}>
                <input className={inputClassFor(statusFor('breadthCm'))} value={value.breadthCm} onChange={set('breadthCm')} />
              </Field>
              <Field label="Height (cm)" status={statusFor('heightCm')}>
                <input className={inputClassFor(statusFor('heightCm'))} value={value.heightCm} onChange={set('heightCm')} />
              </Field>
              <Field label="Weight (kg)" required={requiredFor('weightKg')}>
                <input className={inputClassFor(undefined, requiredFor('weightKg'))} value={value.weightKg} onChange={set('weightKg')} />
              </Field>
              <Field label="Fulfilment By" required={requiredFor('fulfilmentBy')}>
                <input className={inputClassFor(undefined, requiredFor('fulfilmentBy'))} value={value.fulfilmentBy} onChange={set('fulfilmentBy')} placeholder="Seller" />
              </Field>
              <Field label="Procurement Type" required={requiredFor('procurementType')}>
                <input className={inputClassFor(undefined, requiredFor('procurementType'))} value={value.procurementType} onChange={set('procurementType')} placeholder="REGULAR" />
              </Field>
              <Field label="Procurement SLA (days)" required={requiredFor('procurementSlaDays')}>
                <input className={inputClassFor(undefined, requiredFor('procurementSlaDays'))} value={value.procurementSlaDays} onChange={set('procurementSlaDays')} />
              </Field>
              <Field label="Location ID">
                <input className={inputClass} value={value.locationId} onChange={set('locationId')} title="Real API's warehouse/location identifier" />
              </Field>
              <Field label="Fulfillment Profile">
                <input className={inputClass} value={value.fulfillmentProfile} onChange={set('fulfillmentProfile')} placeholder="NON_FBF" />
              </Field>
              <Field label="Dispatch SLA (hours)">
                <input className={inputClass} value={value.dispatchSlaHours} onChange={set('dispatchSlaHours')} />
              </Field>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Descriptive</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Top Type" status={statusFor('topType')} required={requiredFor('topType')}>
                <input className={inputClassFor(statusFor('topType'), requiredFor('topType'))} value={value.topType} onChange={set('topType')} />
              </Field>
              <Field label="Bottom Type" status={statusFor('bottomType')} required={requiredFor('bottomType')}>
                <input className={inputClassFor(statusFor('bottomType'), requiredFor('bottomType'))} value={value.bottomType} onChange={set('bottomType')} />
              </Field>
              <Field label="Neck" status={statusFor('neck')}>
                <input className={inputClassFor(statusFor('neck'))} value={value.neck} onChange={set('neck')} placeholder="V Neck" />
              </Field>
              <Field label="Sleeve Length" status={statusFor('sleeveLength')} required={requiredFor('sleeveLength')}>
                <input className={inputClassFor(statusFor('sleeveLength'), requiredFor('sleeveLength'))} value={value.sleeveLength} onChange={set('sleeveLength')} />
              </Field>
              <Field label="Top Pattern" status={statusFor('topPattern')}>
                <input className={inputClassFor(statusFor('topPattern'))} value={value.topPattern} onChange={set('topPattern')} />
              </Field>
              <Field label="Bottom Pattern" status={statusFor('bottomPattern')}>
                <input className={inputClassFor(statusFor('bottomPattern'))} value={value.bottomPattern} onChange={set('bottomPattern')} />
              </Field>
              <Field label="Occasion" status={statusFor('occasion')} required={requiredFor('occasion')}>
                <input className={inputClassFor(statusFor('occasion'), requiredFor('occasion'))} value={value.occasion} onChange={set('occasion')} />
              </Field>
              <Field label="Ideal For / Age Group" status={statusFor('ageGroup')}>
                <input className={inputClassFor(statusFor('ageGroup'))} value={value.ageGroup} onChange={set('ageGroup')} placeholder="Women" />
              </Field>
              <Field label={category === 'Tops' ? 'Style Type' : 'Shape Type / Kurta Style Type'} status={statusFor('shapeType')} required={requiredFor('shapeType')}>
                <input className={inputClassFor(statusFor('shapeType'), requiredFor('shapeType'))} value={value.shapeType} onChange={set('shapeType')} placeholder="Straight" />
              </Field>
              <Field label="Suitable For" status={statusFor('suitableFor')} required={requiredFor('suitableFor')}>
                <input className={inputClassFor(statusFor('suitableFor'), requiredFor('suitableFor'))} value={value.suitableFor} onChange={set('suitableFor')} placeholder="Ethnic Wear" />
              </Field>
              {category === 'Tops' && (
                <>
                  <Field label="Fit (Top)" status={statusFor('fit')} required={requiredFor('fit')}>
                    <input className={inputClassFor(statusFor('fit'), requiredFor('fit'))} value={value.fit} onChange={set('fit')} placeholder="Regular" />
                  </Field>
                  <Field label="Sleeve Style (Top)" status={statusFor('sleeveStyle')} required={requiredFor('sleeveStyle')}>
                    <input className={inputClassFor(statusFor('sleeveStyle'), requiredFor('sleeveStyle'))} value={value.sleeveStyle} onChange={set('sleeveStyle')} placeholder="Regular Sleeves" />
                  </Field>
                  <Field label="Tops Length" status={statusFor('topsLength')}>
                    <input className={inputClassFor(statusFor('topsLength'))} value={value.topsLength} onChange={set('topsLength')} placeholder="Hip Length" />
                  </Field>
                </>
              )}
              <Field label="Pockets (Kurti)" status={statusFor('pockets')}>
                <input className={inputClassFor(statusFor('pockets'))} value={value.pockets} onChange={set('pockets')} />
              </Field>
              <Field label="Pack of (Kurti)" status={statusFor('packOf')}>
                <input className={inputClassFor(statusFor('packOf'))} value={value.packOf} onChange={set('packOf')} />
              </Field>
              <Field label="Attached Dupatta (Kurti)" status={statusFor('attachedDupatta')}>
                <input className={inputClassFor(statusFor('attachedDupatta'))} value={value.attachedDupatta} onChange={set('attachedDupatta')} />
              </Field>
              <Field label="Fashion Type" status={statusFor('fashionType')}>
                <input className={inputClassFor(statusFor('fashionType'))} value={value.fashionType} onChange={set('fashionType')} />
              </Field>
              <Field label="Season" status={statusFor('season')}>
                <input className={inputClassFor(statusFor('season'))} value={value.season} onChange={set('season')} />
              </Field>
              <Field label="Year">
                <input className={inputClass} value={value.year} onChange={set('year')} />
              </Field>
              <Field label="Tags" status={statusFor('tags')}>
                <input className={inputClassFor(statusFor('tags'))} value={value.tags} onChange={set('tags')} />
              </Field>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <Field label="Style Note / Description">
              <textarea className={inputClass} rows={3} value={value.styleNote} onChange={set('styleNote')} />
            </Field>
            <Field label="Product Details / Key Features">
              <textarea className={inputClass} rows={3} value={value.productDetails} onChange={set('productDetails')} />
            </Field>
            <Field label="Search Keywords" status={statusFor('searchKeywords')}>
              <input
                className={inputClassFor(statusFor('searchKeywords'))}
                value={value.searchKeywords}
                onChange={set('searchKeywords')}
                placeholder="Keyword one::Keyword two::Keyword three (max 5, :: separated)"
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
