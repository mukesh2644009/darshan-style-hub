'use client';

import { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiTag } from 'react-icons/fi';

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
  sizes: string[];
  value: MyntraFormState;
  onChange: (patch: Partial<MyntraFormState>) => void;
  measurements: Record<string, SizeMeasurementForm>;
  onMeasurementChange: (size: string, field: keyof SizeMeasurementForm, value: string) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputClass = 'w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

export default function MyntraListingFields({ category, sizes, value, onChange, measurements, onMeasurementChange }: Props) {
  const [open, setOpen] = useState(false);
  const coOrd = isCoOrdCategory(category);
  const saree = isSareeCategory(category);
  const supported = coOrd || saree;

  const set = (field: keyof MyntraFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange({ [field]: e.target.value });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-purple-100">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6"
      >
        <div className="flex items-center gap-2">
          <FiTag className="text-pink-600 w-5 h-5" />
          <h2 className="text-lg font-bold text-gray-900">Myntra Listing Details</h2>
          <span className="text-xs text-gray-400 font-normal">(optional — only needed to list this product on Myntra)</span>
        </div>
        {open ? <FiChevronDown /> : <FiChevronRight />}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5">
          {!supported && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Myntra export currently only supports the &quot;Co Ord Sets&quot;, &quot;Summer Co-ord Sets&quot; and &quot;Sarees&quot; categories.
              Fields below can still be filled in, but export will be blocked for this category.
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Style Name (vendorArticleName) *">
              <input className={inputClass} value={value.styleName} onChange={set('styleName')} placeholder="e.g. Black Embroidered Co-ord Set" />
            </Field>
            <Field label="Article Type *">
              <input className={inputClass} value={value.articleType} onChange={set('articleType')} placeholder={coOrd ? 'Co-Ords' : 'Sarees'} />
            </Field>
            <Field label="Is Standard Size on Label? *">
              <select className={inputClass} value={value.sizeLabelPresent} onChange={set('sizeLabelPresent')}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Brand Colour Remarks *">
              <input className={inputClass} value={value.colourRemarks} onChange={set('colourRemarks')} placeholder="e.g. Black" />
            </Field>
            <Field label="Prominent Colour *">
              <input className={inputClass} value={value.prominentColour} onChange={set('prominentColour')} placeholder="e.g. Black" />
            </Field>
            <Field label="GTIN / Barcode *">
              <input className={inputClass} value={value.gtin} onChange={set('gtin')} placeholder="e.g. 8901234567890" />
            </Field>
            <Field label="HSN Code *">
              <input className={inputClass} value={value.hsnCode} onChange={set('hsnCode')} placeholder="e.g. 62042300" />
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
            <Field label="Season *">
              <input className={inputClass} value={value.season} onChange={set('season')} placeholder="Winter" />
            </Field>
            <Field label="Net Quantity Unit *">
              <input className={inputClass} value={value.netQuantityUnit} onChange={set('netQuantityUnit')} placeholder="Pieces" />
            </Field>
            <Field label="Net Quantity *">
              <input className={inputClass} value={value.netQuantity} onChange={set('netQuantity')} placeholder="2" />
            </Field>
          </div>

          <div>
            <Field label="Material Care Description *">
              <textarea className={inputClass} rows={2} value={value.materialCareDescription} onChange={set('materialCareDescription')} placeholder="e.g. 100% Viscose, Dry Clean" />
            </Field>
          </div>
          <div>
            <Field label="Wash Care *">
              <input className={inputClass} value={value.washCare} onChange={set('washCare')} placeholder="Dry Clean" />
            </Field>
          </div>

          {coOrd && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Co-Ord Set Fields</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Top Fabric *">
                  <input className={inputClass} value={value.topFabric} onChange={set('topFabric')} placeholder="Viscose Rayon" />
                </Field>
                <Field label="Bottom Fabric *">
                  <input className={inputClass} value={value.bottomFabric} onChange={set('bottomFabric')} placeholder="Viscose Rayon" />
                </Field>
                <Field label="Add-Ons *">
                  <input className={inputClass} value={value.addOns} onChange={set('addOns')} placeholder="NA" />
                </Field>
                <Field label="Lining *">
                  <input className={inputClass} value={value.lining} onChange={set('lining')} placeholder="NA" />
                </Field>
                <Field label="Number of Pockets *">
                  <input className={inputClass} value={value.numberOfPockets} onChange={set('numberOfPockets')} placeholder="NA" />
                </Field>
                <Field label="Number of Items *">
                  <input className={inputClass} value={value.numberOfItems} onChange={set('numberOfItems')} placeholder="2" />
                </Field>
                <Field label="Package Contains *">
                  <input className={inputClass} value={value.packageContains} onChange={set('packageContains')} placeholder="1 Top, 1 Bottom" />
                </Field>
              </div>

              {sizes.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Per-Size Measurements (inches) *</h4>
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
                <Field label="Type *">
                  <input className={inputClass} value={value.sareeType} onChange={set('sareeType')} placeholder="e.g. Traditional" />
                </Field>
                <Field label="Saree Fabric *">
                  <input className={inputClass} value={value.sareeFabric} onChange={set('sareeFabric')} placeholder="Banarasi Silk" />
                </Field>
                <Field label="Blouse Fabric *">
                  <input className={inputClass} value={value.blouseFabric} onChange={set('blouseFabric')} placeholder="Silk" />
                </Field>
                <Field label="Blouse *">
                  <input className={inputClass} value={value.blouseIncluded} onChange={set('blouseIncluded')} placeholder="Unstitched Blouse Piece" />
                </Field>
                <Field label="Multipack Set *">
                  <input className={inputClass} value={value.multipackSet} onChange={set('multipackSet')} placeholder="1" />
                </Field>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
