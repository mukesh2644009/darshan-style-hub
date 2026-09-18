'use client';

import { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiTag, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import { deriveMyntraAutofill, deriveCoOrdSizeMeasurements, MYNTRA_FIELD_LABELS } from '@/lib/myntraAutofill';

export interface MyntraFormState {
  styleName: string;
  articleType: string;
  sizeLabelPresent: string;
  colourRemarks: string;
  prominentColour: string;
  gtin: string;
  hsnCode: string;
  ageGroup: string;
  fashionType: string;
  year: string;
  season: string;
  materialCareDescription: string;
  washCare: string;
  netQuantityUnit: string;
  netQuantity: string;
  // Co-Ord Set specific
  topFabric: string;
  bottomFabric: string;
  addOns: string;
  lining: string;
  numberOfPockets: string;
  numberOfItems: string;
  packageContains: string;
  // Saree specific
  sareeType: string;
  sareeFabric: string;
  blouseFabric: string;
  blouseIncluded: string;
  multipackSet: string;
}

export const EMPTY_MYNTRA_FORM: MyntraFormState = {
  styleName: '',
  articleType: '',
  sizeLabelPresent: 'Yes',
  colourRemarks: '',
  prominentColour: '',
  gtin: '',
  hsnCode: '',
  ageGroup: 'Adults-Women',
  fashionType: 'Fashion',
  year: '',
  season: '',
  materialCareDescription: '',
  washCare: '',
  netQuantityUnit: 'Pieces',
  netQuantity: '',
  topFabric: '',
  bottomFabric: '',
  addOns: '',
  lining: '',
  numberOfPockets: '',
  numberOfItems: '',
  packageContains: '',
  sareeType: '',
  sareeFabric: '',
  blouseFabric: '',
  blouseIncluded: '',
  multipackSet: '',
};

export interface SizeMeasurementForm {
  bust: string;
  chest: string;
  frontLength: string;
  garmentWaist: string;
  inseamLength: string;
  toFitWaist: string;
}

export const EMPTY_SIZE_MEASUREMENT: SizeMeasurementForm = {
  bust: '', chest: '', frontLength: '', garmentWaist: '', inseamLength: '', toFitWaist: '',
};

function isCoOrdCategory(category: string) {
  return category === 'Co Ord Sets' || category === 'Summer Co-ord Sets';
}
function isSareeCategory(category: string) {
  return category === 'Sarees';
}

interface Props {
  category: string;
  subcategory?: string;
  productName: string;
  productDescription: string;
  colors: { name: string }[];
  sizes: string[];
  value: MyntraFormState;
  onChange: (patch: Partial<MyntraFormState>) => void;
  measurements: Record<string, SizeMeasurementForm>;
  onMeasurementChange: (size: string, field: keyof SizeMeasurementForm, value: string) => void;
}

type FieldStatus = 'review' | 'blocked' | undefined;

function Field({ label, status, children }: { label: string; status?: FieldStatus; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
        {label}
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

const inputClass = 'w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
const inputClassFor = (status: FieldStatus) =>
  status === 'review'
    ? `${inputClass} border-amber-300 bg-amber-50`
    : status === 'blocked'
      ? `${inputClass} border-red-300 bg-red-50`
      : inputClass;

export default function MyntraListingFields({ category, subcategory, productName, productDescription, colors, sizes, value, onChange, measurements, onMeasurementChange }: Props) {
  const [open, setOpen] = useState(false);
  const [reviewFields, setReviewFields] = useState<Set<string>>(new Set());
  const [blockedFields, setBlockedFields] = useState<Set<string>>(new Set());
  const [autofillSummary, setAutofillSummary] = useState<{ filled: number; review: string[]; blocked: string[]; measurementsFilled: number } | null>(null);
  const coOrd = isCoOrdCategory(category);
  const saree = isSareeCategory(category);
  const supported = coOrd || saree;

  const set = (field: keyof MyntraFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange({ [field]: e.target.value });
  const statusFor = (field: keyof MyntraFormState): FieldStatus =>
    reviewFields.has(field) ? 'review' : blockedFields.has(field) ? 'blocked' : undefined;

  const handleAutofill = () => {
    const outcome = deriveMyntraAutofill({
      name: productName,
      description: productDescription,
      category,
      subcategory,
      colors,
    });

    // Only fill fields that are currently empty — never clobber something the admin already typed.
    const filteredPatch: Partial<MyntraFormState> = {};
    let filledCount = 0;
    Object.entries(outcome.patch).forEach(([k, v]) => {
      const key = k as keyof MyntraFormState;
      if (!value[key]) {
        filteredPatch[key] = v;
        filledCount += 1;
      }
    });
    onChange(filteredPatch);

    // Per-size measurements: fill only empty cells, from the shared co-ord size chart.
    let measurementsFilled = 0;
    if (coOrd) {
      const suggestions = deriveCoOrdSizeMeasurements(sizes);
      for (const s of suggestions) {
        const current = measurements[s.size] || EMPTY_SIZE_MEASUREMENT;
        (['bust', 'chest', 'frontLength', 'garmentWaist', 'inseamLength', 'toFitWaist'] as (keyof SizeMeasurementForm)[]).forEach((field) => {
          if (!current[field]) {
            onMeasurementChange(s.size, field, s[field]);
            measurementsFilled += 1;
          }
        });
      }
    }

    setReviewFields(new Set(outcome.reviewFields));
    setBlockedFields(new Set(outcome.blockedFields));
    setAutofillSummary({ filled: filledCount, review: outcome.reviewFields, blocked: outcome.blockedFields, measurementsFilled });
    setOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-purple-100">
      <div className="flex items-center justify-between p-6">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 flex-1"
        >
          <FiTag className="text-pink-600 w-5 h-5" />
          <h2 className="text-lg font-bold text-gray-900">Myntra Listing Details</h2>
          <span className="text-xs text-gray-400 font-normal">(optional — only needed to list this product on Myntra)</span>
          {open ? <FiChevronDown /> : <FiChevronRight />}
        </button>
        {supported && (
          <button
            type="button"
            onClick={handleAutofill}
            className="flex items-center gap-1.5 text-sm font-medium text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg px-3 py-1.5 shrink-0"
            title="Auto-fill fields from this product's name, description and colours"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            Fetch
          </button>
        )}
      </div>

      {open && (
        <div className="px-6 pb-6 space-y-5">
          {!supported && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Myntra export currently only supports the &quot;Co Ord Sets&quot;, &quot;Summer Co-ord Sets&quot; and &quot;Sarees&quot; categories.
              Fields below can still be filled in, but export will be blocked for this category.
            </p>
          )}

          {autofillSummary && (
            <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 space-y-1">
              <p className="text-blue-800">
                Auto-filled {autofillSummary.filled} field{autofillSummary.filled === 1 ? '' : 's'} from the product&apos;s name/description
                {autofillSummary.measurementsFilled > 0 && ` + ${autofillSummary.measurementsFilled} size-measurement cell${autofillSummary.measurementsFilled === 1 ? '' : 's'} from the shared co-ord size chart`}.
              </p>
              {autofillSummary.review.length > 0 && (
                <p className="text-amber-700 flex items-start gap-1">
                  <FiAlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Please verify (best-effort guess): {autofillSummary.review.map(f => MYNTRA_FIELD_LABELS[f] || f).join(', ')}.</span>
                </p>
              )}
              {autofillSummary.blocked.length > 0 && (
                <p className="text-red-700">
                  Couldn&apos;t determine — please fill these in: {autofillSummary.blocked.map(f => MYNTRA_FIELD_LABELS[f] || f).join(', ')}
                  {coOrd ? ', and per-size measurements' : ''}.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Style Name (vendorArticleName) *" status={statusFor('styleName')}>
              <input className={inputClassFor(statusFor('styleName'))} value={value.styleName} onChange={set('styleName')} placeholder="e.g. Black Embroidered Co-ord Set" />
            </Field>
            <Field label="Article Type *" status={statusFor('articleType')}>
              <input className={inputClassFor(statusFor('articleType'))} value={value.articleType} onChange={set('articleType')} placeholder={coOrd ? 'Co-Ords' : 'Sarees'} />
            </Field>
            <Field label="Is Standard Size on Label? *">
              <select className={inputClass} value={value.sizeLabelPresent} onChange={set('sizeLabelPresent')}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Brand Colour Remarks *" status={statusFor('colourRemarks')}>
              <input className={inputClassFor(statusFor('colourRemarks'))} value={value.colourRemarks} onChange={set('colourRemarks')} placeholder="e.g. Black" />
            </Field>
            <Field label="Prominent Colour *" status={statusFor('prominentColour')}>
              <input className={inputClassFor(statusFor('prominentColour'))} value={value.prominentColour} onChange={set('prominentColour')} placeholder="e.g. Black" />
            </Field>
            <Field label="GTIN / Barcode *" status={statusFor('gtin')}>
              <input className={inputClassFor(statusFor('gtin'))} value={value.gtin} onChange={set('gtin')} placeholder="e.g. 8901234567890" />
            </Field>
            <Field label="HSN Code *" status={statusFor('hsnCode')}>
              <input className={inputClassFor(statusFor('hsnCode'))} value={value.hsnCode} onChange={set('hsnCode')} placeholder="e.g. 62042300" />
            </Field>
            <Field label="Age Group *">
              <input className={inputClass} value={value.ageGroup} onChange={set('ageGroup')} placeholder="Adults-Women" />
            </Field>
            <Field label="Fashion Type *">
              <input className={inputClass} value={value.fashionType} onChange={set('fashionType')} placeholder="Fashion" />
            </Field>
            <Field label="Year *">
              <input className={inputClass} value={value.year} onChange={set('year')} placeholder="2026" />
            </Field>
            <Field label="Season *" status={statusFor('season')}>
              <input className={inputClassFor(statusFor('season'))} value={value.season} onChange={set('season')} placeholder="Winter" />
            </Field>
            <Field label="Net Quantity Unit *">
              <input className={inputClass} value={value.netQuantityUnit} onChange={set('netQuantityUnit')} placeholder="Pieces" />
            </Field>
            <Field label="Net Quantity *" status={statusFor('netQuantity')}>
              <input className={inputClassFor(statusFor('netQuantity'))} value={value.netQuantity} onChange={set('netQuantity')} placeholder="2" />
            </Field>
          </div>

          <div>
            <Field label="Material Care Description *" status={statusFor('materialCareDescription')}>
              <textarea className={inputClassFor(statusFor('materialCareDescription'))} rows={2} value={value.materialCareDescription} onChange={set('materialCareDescription')} placeholder="e.g. 100% Viscose, Dry Clean" />
            </Field>
          </div>
          <div>
            <Field label="Wash Care *" status={statusFor('washCare')}>
              <input className={inputClassFor(statusFor('washCare'))} value={value.washCare} onChange={set('washCare')} placeholder="Dry Clean" />
            </Field>
          </div>

          {coOrd && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Co-Ord Set Fields</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Top Fabric *" status={statusFor('topFabric')}>
                  <input className={inputClassFor(statusFor('topFabric'))} value={value.topFabric} onChange={set('topFabric')} placeholder="Viscose Rayon" />
                </Field>
                <Field label="Bottom Fabric *" status={statusFor('bottomFabric')}>
                  <input className={inputClassFor(statusFor('bottomFabric'))} value={value.bottomFabric} onChange={set('bottomFabric')} placeholder="Viscose Rayon" />
                </Field>
                <Field label="Add-Ons *" status={statusFor('addOns')}>
                  <input className={inputClassFor(statusFor('addOns'))} value={value.addOns} onChange={set('addOns')} placeholder="NA" />
                </Field>
                <Field label="Lining *" status={statusFor('lining')}>
                  <input className={inputClassFor(statusFor('lining'))} value={value.lining} onChange={set('lining')} placeholder="NA" />
                </Field>
                <Field label="Number of Pockets *" status={statusFor('numberOfPockets')}>
                  <input className={inputClassFor(statusFor('numberOfPockets'))} value={value.numberOfPockets} onChange={set('numberOfPockets')} placeholder="NA" />
                </Field>
                <Field label="Number of Items *" status={statusFor('numberOfItems')}>
                  <input className={inputClassFor(statusFor('numberOfItems'))} value={value.numberOfItems} onChange={set('numberOfItems')} placeholder="2" />
                </Field>
                <Field label="Package Contains *" status={statusFor('packageContains')}>
                  <input className={inputClassFor(statusFor('packageContains'))} value={value.packageContains} onChange={set('packageContains')} placeholder="1 Top, 1 Bottom" />
                </Field>
              </div>

              {sizes.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Per-Size Measurements (inches) *
                    {autofillSummary && autofillSummary.measurementsFilled > 0 ? (
                      <span className="text-amber-600 font-normal text-xs" title="Filled from the shared co-ord size chart (DSH_CS_03) — verify against this garment's actual cut">⚠ from shared size chart — verify</span>
                    ) : (
                      <span className="text-red-600 font-normal text-xs" title="Real tape-measure data, or click Fetch to pull the shared co-ord size chart">● needs input</span>
                    )}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-2 py-2 text-left">Size</th>
                          <th className="px-2 py-2 text-left">Bust</th>
                          <th className="px-2 py-2 text-left">Chest</th>
                          <th className="px-2 py-2 text-left">Front Length</th>
                          <th className="px-2 py-2 text-left">Garment Waist</th>
                          <th className="px-2 py-2 text-left">Inseam Length</th>
                          <th className="px-2 py-2 text-left">To Fit Waist</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizes.map((size) => {
                          const m = measurements[size] || EMPTY_SIZE_MEASUREMENT;
                          return (
                            <tr key={size} className="border-t border-gray-100">
                              <td className="px-2 py-1.5 font-medium text-gray-800">{size}</td>
                              {(['bust', 'chest', 'frontLength', 'garmentWaist', 'inseamLength', 'toFitWaist'] as (keyof SizeMeasurementForm)[]).map((field) => (
                                <td key={field} className="px-2 py-1.5">
                                  <input
                                    type="number"
                                    step="0.1"
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                    value={m[field]}
                                    onChange={(e) => onMeasurementChange(size, field, e.target.value)}
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {saree && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Saree Fields</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Type *" status={statusFor('sareeType')}>
                  <input className={inputClassFor(statusFor('sareeType'))} value={value.sareeType} onChange={set('sareeType')} placeholder="e.g. Traditional" />
                </Field>
                <Field label="Saree Fabric *" status={statusFor('sareeFabric')}>
                  <input className={inputClassFor(statusFor('sareeFabric'))} value={value.sareeFabric} onChange={set('sareeFabric')} placeholder="Banarasi Silk" />
                </Field>
                <Field label="Blouse Fabric *" status={statusFor('blouseFabric')}>
                  <input className={inputClassFor(statusFor('blouseFabric'))} value={value.blouseFabric} onChange={set('blouseFabric')} placeholder="Silk" />
                </Field>
                <Field label="Blouse *" status={statusFor('blouseIncluded')}>
                  <input className={inputClassFor(statusFor('blouseIncluded'))} value={value.blouseIncluded} onChange={set('blouseIncluded')} placeholder="Unstitched Blouse Piece" />
                </Field>
                <Field label="Multipack Set *" status={statusFor('multipackSet')}>
                  <input className={inputClassFor(statusFor('multipackSet'))} value={value.multipackSet} onChange={set('multipackSet')} placeholder="1" />
                </Field>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
