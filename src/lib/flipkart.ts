import type { Product, ProductSize, ProductColor, FlipkartListingDetail } from '@prisma/client';
import { MYNTRA_BRAND, MYNTRA_BUSINESS_ADDRESS, MYNTRA_COUNTRY_OF_ORIGIN } from './myntra';
import { categorizeProductImages } from './productImageCategorization';
import { isKurtaSet, templateKeyFor } from './flipkartTemplates';
import { platformPrice } from './platformPricing';

// Categories whose *data* (DB fields, via deriveFlipkartAutofill) is grounded
// against a real reference — Co-Ord Sets (Flipkart_Coordset sheet) and Suits
// (a real, self-validated DSH_SU_04 bulk-template row). Safe for auto-fill,
// since writing to our own DB is reversible.
export function isFlipkartSupportedCategory(category: string): boolean {
  return category === 'Co Ord Sets' || category === 'Summer Co-ord Sets' || category === 'Suits' || category === 'Kurtis' || category === 'Tops';
}

// Categories whose Excel *column layout* we've actually built. Co-Ord matches the
// Flipkart_Coordset sheet's 51 columns; Suits matches Flipkart's real downloaded
// salwar_kurta_dupatta template, grounded through real QC failure/fix rounds
// (now live, 10/10 SKUs); Kurtis matches the real single-piece "kurta" template
// — but only for genuinely single-piece products (see isKurtaSet below).
export function isFlipkartExcelExportableCategory(category: string): boolean {
  return category === 'Co Ord Sets' || category === 'Summer Co-ord Sets' || category === 'Suits' || category === 'Kurtis' || category === 'Tops';
}

// The site's "Kurtis" category actually mixes true single-piece kurtis with
// 2-piece kurta+pant sets (no dupatta) — the real Flipkart "kurta" template has
// no bottom-garment fields at all, so sets go to the Ethnic Set template instead.
// Lives in flipkartTemplates.ts so the client-side admin table can use it too.
export { isKurtaSet, templateKeyFor };

export type ProductWithFlipkart = Product & {
  images: { url: string }[];
  sizes: ProductSize[];
  colors: ProductColor[];
  flipkartListingDetail: FlipkartListingDetail | null;
};

export interface MissingFlipkartField {
  field: string;
  label: string;
}

/**
 * The fields each category actually requires — independent of whether they're
 * currently filled (unlike validateFlipkartListing below, which filters this
 * down to what's still missing). Used both for export validation and for
 * marking "mandatory" fields in the admin UI review panel.
 * Co-Ord: colour, HSN, fabrics, material care (from the Flipkart_Coordset sheet).
 * Suits: HSN, colour, net quantity, package weight, plus fields confirmed
 * mandatory only through real Flipkart QC (not caught by Excel's own local
 * validation) — now live, 10/10 SKUs (2026-09-24).
 * Kurtis (single-piece): same account-level fields as Suits, best-effort,
 * not yet QC-tested.
 * Ethnic Set (kurta+bottom, no dupatta): real category confirmed 2026-09-24,
 * with a first real QC round's fixes applied (Fabric/Top Fabric/Bottom Fabric
 * are three separately-enumerated fields, Additional Garments is mandatory).
 * GTIN and the disputed Myntra-HSN column are never required.
 */
export function getRequiredFlipkartFields(product: { category: string; name: string }): MissingFlipkartField[] {
  const required: MissingFlipkartField[] = [];

  if (!isFlipkartExcelExportableCategory(product.category)) return required;

  const isSuit = product.category === 'Suits';
  const isEthnicSet = product.category === 'Kurtis' && isKurtaSet(product.name);
  const isKurti = product.category === 'Kurtis' && !isEthnicSet;
  const add = (field: string, label: string) => required.push({ field, label });

  add('colour', 'Colour');
  add('hsnFlipkart', 'HSN Code - Flipkart (4-digit)');
  add('weightKg', 'Weight (kg)');

  if (product.category === 'Tops') {
    // Blue (mandatory) header cells in Flipkart's own "top" template, read
    // via Excel 2026-09-30; package dims are purple (conditionally mandatory).
    add('lengthCm', 'Length (cm)');
    add('breadthCm', 'Breadth (cm)');
    add('heightCm', 'Height (cm)');
    add('fulfilmentBy', 'Fulfilment by');
    add('procurementType', 'Procurement type');
    add('procurementSlaDays', 'Procurement SLA (DAY)');
    add('occasion', 'Occasion');
    add('ageGroup', 'Ideal For');
    add('topPattern', 'Pattern');
    add('packOf', 'Pack of');
    add('fabricType', 'Brand Fabric');
    add('neck', 'Neck & Collar');
    add('fit', 'Fit');
    add('suitableFor', 'Suitable For');
    add('sleeveStyle', 'Sleeve Style');
    add('shapeType', 'Style Type');
    return required;
  }

  if (isSuit || isKurti || isEthnicSet) {
    add('netQuantity', 'Net Quantity');
    if (isSuit) add('topType', 'Top Type'); // no such column for single-piece Kurtis/Ethnic Set
    // Confirmed mandatory for Suits via a real Flipkart QC failure 2026-09-24
    // (Excel's own local validation doesn't catch these); applied to Kurtis
    // too as the best-effort starting point, pending its own real QC test.
    add('shapeType', isEthnicSet ? 'Kurta Style Type' : 'Shape Type');
    if (!isEthnicSet) add('suitableFor', 'Suitable For'); // no such column for Ethnic Set
    add('occasion', 'Occasion');
    add('sleeveLength', isEthnicSet ? 'Sleeve Length' : 'Sleeve');
    add('topFabric', isSuit ? 'Kurta Fabric' : isEthnicSet ? 'Top Fabric' : 'Fabric');
    add('fulfilmentBy', 'Fulfilment by');
    add('procurementType', 'Procurement type');
    add('procurementSlaDays', 'Procurement SLA (DAY)');
    // Confirmed mandatory for Suits via a real QC failure 2026-09-25 (left
    // blank, rejected) — real accepted value there is "Trouser", not "Pant".
    if (isSuit) add('bottomType', 'Bottom Type');
    if (isEthnicSet) {
      add('bottomType', 'Bottom Type');
      // Confirmed mandatory + a separate enum from Top/Bottom Fabric via real
      // QC failure 2026-09-24 (see FABRIC_TYPE_ENUM_MAP).
      add('fabricType', 'Fabric');
      add('bottomFabric', 'Bottom Fabric');
    }
  } else {
    // Co-ords: blue (mandatory) header cells in Flipkart's own "apparel_set"
    // template, read via Excel 2026-10-02; package dims are purple
    // (conditionally mandatory). "Type" is always "Co-ords" (fixed column).
    add('lengthCm', 'Length (cm)');
    add('breadthCm', 'Breadth (cm)');
    add('heightCm', 'Height (cm)');
    add('fulfilmentBy', 'Fulfilment by');
    add('procurementType', 'Procurement type');
    add('procurementSlaDays', 'Procurement SLA (DAY)');
    add('addOns', 'Add ons');
    add('topType', 'Top Type');
    add('bottomType', 'Bottom Type');
    add('occasion', 'Occasion');
    add('topPattern', 'Top Pattern Type');
    add('topFabric', 'Top Fabric');
    add('neck', 'Neck');
    add('sleeveStyle', 'Sleeve Style');
    add('bottomPattern', 'Bottom Pattern Type');
    add('bottomFabric', 'Bottom Fabric');
    add('printType', 'Print Type');
    add('ageGroup', 'Ideal For');
    add('netQuantity', 'Net Quantity');
    add('topLength', 'Top Length');
    add('sleeveLength', 'Sleeve Length');
    add('bottomLength', 'Bottom Length');
    add('packOf', 'Pack of');
  }

  return required;
}

export function validateFlipkartListing(product: ProductWithFlipkart): MissingFlipkartField[] {
  if (!isFlipkartExcelExportableCategory(product.category)) {
    return [{
      field: 'category',
      label: `Category "${product.category}" isn't supported for Flipkart Excel export yet (only Co Ord Sets, Summer Co-ord Sets, Suits, Kurtis, and Tops have a built column layout).`,
    }];
  }

  const d = product.flipkartListingDetail as unknown as Record<string, string | null | undefined>;
  const missing = getRequiredFlipkartFields(product).filter(({ field }) => !d?.[field] || !d[field]!.trim());

  if (product.sizes.length === 0) {
    missing.push({ field: 'sizes', label: 'Product has no sizes/variants defined' });
  }

  return missing;
}

interface RowContext {
  product: ProductWithFlipkart;
  size: ProductSize;
}

const str = (v: string | null | undefined): string => v || '';

// Column order/headers copied verbatim from Flipkart's own Co-ords template
// (C_apparel-set_ddeaa0ca6b304eb1_0110-1313FK_REQQVQYAA8XNK.xls, "apparel_set"
// sheet, 2026-10-02). Replaces the old layout copied from an internal
// "Flipkart_Coordset" sheet, which only matched 13 of Flipkart's columns.
// Allowed values: FLIPKART_CO_ORD_VALUES in flipkartAutofill.ts.
export const FLIPKART_CO_ORD_COLUMNS = [
  { header: 'Flipkart Serial Number', get: () => '' },
  { header: 'Catalog QC Status', get: () => '' },
  { header: 'QC Failed Reason (if any)', get: () => '' },
  { header: 'Flipkart Product Link', get: () => '' },
  { header: 'Product Data Status', get: () => '' },
  { header: 'Disapproval Reason (if any)', get: () => '' },
  { header: 'Seller SKU ID', get: ({ product, size }: RowContext) => `${product.sku}-${size.size}` },
  { header: 'Group ID', get: ({ product }: RowContext) => product.sku },
  { header: 'Parent Variant FSN', get: () => '' },
  { header: 'Listing Status', get: () => '' },
  { header: 'MRP (INR)', get: ({ product }: RowContext) => platformPrice(product, 'flipkart').mrp },
  { header: 'Your selling price (INR)', get: ({ product }: RowContext) => platformPrice(product, 'flipkart').price },
  { header: 'Fullfilment by', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.fulfilmentBy) },
  { header: 'Procurement type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.procurementType) },
  { header: 'Procurement SLA (DAY)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.procurementSlaDays) },
  { header: 'Stock', get: ({ size }: RowContext) => size.quantity },
  { header: 'Shipping provider', get: () => 'FLIPKART' },
  { header: 'Local handling fee (INR)', get: () => 0 }, // mandatory for Co-ords (QC 2026-10-02); live listings use 0
  { header: 'Zonal handling fee (INR)', get: () => 0 }, // mandatory for Co-ords (QC 2026-10-02); live listings use 0
  { header: 'National handling fee (INR)', get: () => 0 }, // mandatory for Co-ords (QC 2026-10-02); live listings use 0
  { header: 'Length (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.lengthCm) },
  { header: 'Breadth (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.breadthCm) },
  { header: 'Height (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.heightCm) },
  { header: 'Weight (KG)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.weightKg) },
  { header: 'HSN', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.hsnFlipkart) },
  { header: 'Luxury Cess', get: () => '' },
  { header: 'Country Of Origin', get: () => MYNTRA_COUNTRY_OF_ORIGIN },
  { header: 'Manufacturer Details', get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Packer Details', get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Importer Details', get: () => '' },
  { header: 'Tax Code', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.taxCode) },
  { header: 'Brand', get: () => MYNTRA_BRAND },
  { header: 'Type', get: () => 'Co-ords' },
  { header: 'Add ons', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.addOns) },
  { header: 'Top Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topType) },
  { header: 'Bottom Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.bottomType) },
  { header: 'Occasion', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.occasion) },
  { header: 'Top Pattern Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topPattern) },
  { header: 'Top Fabric', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topFabric) },
  { header: 'Neck', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.neck) },
  { header: 'Sleeve Style', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.sleeveStyle) },
  // Flipkart QC rule (2026-10-02, DSH_CS_02): Top Pattern Type must match
  // Bottom Pattern Type ("for bottom Solid, top should be Solid") — so the
  // set's main (top) pattern is sent for both.
  { header: 'Bottom Pattern Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topPattern || product.flipkartListingDetail?.bottomPattern) },
  { header: 'Bottom Fabric', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.bottomFabric) },
  { header: 'Print Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.printType) },
  { header: 'Ideal For', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.ageGroup) },
  { header: 'Style Code', get: ({ product }: RowContext) => product.sku },
  { header: 'Brand Color', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.colour) },
  { header: 'Brand Size', get: ({ size }: RowContext) => size.size },
  { header: 'Color', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.colour) },
  { header: 'Net Quantity', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.netQuantity) },
  { header: 'Top Length', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topLength) },
  { header: 'Sleeve Length', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.sleeveLength) },
  { header: 'Bottom Length', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.bottomLength) },
  { header: 'Pack of', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.packOf) },
  { header: 'Main Image URL', get: ({ product }: RowContext) => categorizeProductImages(product.images).front },
  { header: 'Other Image URL 1', get: ({ product }: RowContext) => categorizeProductImages(product.images).back },
  { header: 'Other Image URL 2', get: ({ product }: RowContext) => categorizeProductImages(product.images).side },
  { header: 'Other Image URL 3', get: ({ product }: RowContext) => categorizeProductImages(product.images).detail },
  { header: 'Other Image URL 4', get: ({ product }: RowContext) => categorizeProductImages(product.images).lookShot },
  { header: 'Other Image URL 5', get: () => '' },
  { header: 'Main Palette Image URL', get: () => '' },
  { header: 'Lining Material', get: () => '' },
  { header: 'Detail Placement', get: () => '' },
  { header: 'Top Closure', get: () => '' },
  { header: 'Bottom Closure', get: () => '' },
  { header: 'Waist Rise', get: () => '' },
  { header: 'Bottom Fit', get: () => '' },
  { header: 'Top Fit', get: () => '' },
  { header: 'Surface Styling', get: () => '' },
  { header: 'Belt Included', get: () => '' },
  { header: 'Video URL', get: () => '' },
  { header: 'Trend', get: () => '' },
  { header: 'Bust in Inch (inch)', get: () => '' },
  { header: 'Thigh in inch (inch)', get: () => '' },
  { header: 'Waist in inch (inch)', get: () => '' },
  { header: 'Hip in inch (inch)', get: () => '' },
  { header: 'Inside Leg in inch (inch)', get: () => '' },
  { header: 'Care Instructions', get: () => '' },
  { header: 'Ornamentation Type', get: () => '' },
  { header: 'Description', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.styleNote) },
  { header: 'Key Features', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.productDetails) },
  { header: 'EAN', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.gtin) },
  { header: 'Search Keywords', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.searchKeywords) },
  { header: 'Other Details', get: () => '' },
  { header: 'Supplier Image', get: () => '' },
];

// Column order/headers below are copied verbatim from Flipkart's own downloaded
// template (Flipkart-Bulk-Template-Salwar-Kurta-Dupatta.xls, salwar_kurta_dupatta
// sheet) — not a homemade sheet like Co-Ord's. Values are grounded against the
// real, self-validated ("0 error(s) found") filled row for DSH_SU_04
// (C_salwar-kurta-dupatta_...xls, downloaded 2026-09-24): that real row left
// Sleeve, Occasion, Pattern, Shape Type, Kurta/Dupatta/Salwar Fabric, Bottom Type,
// Search Keywords, and several other columns blank, so this layout leaves them
// blank too rather than guessing a value Flipkart's own validated example didn't need.
const hasDupatta = (packageContains: string | null | undefined) => /dupatta/i.test(packageContains || '');

export const FLIPKART_SUIT_COLUMNS = [
  { header: 'Flipkart Serial Number', get: () => '' },
  { header: 'Catalog QC Status', get: () => '' },
  { header: 'QC Failed Reason (if any)', get: () => '' },
  { header: 'Flipkart Product Link', get: () => '' },
  { header: 'Product Data Status', get: () => '' },
  { header: 'Disapproval Reason (if any)', get: () => '' },
  { header: 'Seller SKU ID', get: ({ product, size }: RowContext) => `${product.sku}-${size.size}` },
  { header: 'Group ID', get: ({ product }: RowContext) => product.sku },
  { header: 'Parent Variant FSN', get: () => '' },
  // Left blank, not 'ACTIVE' — the real, self-validated ("0 error(s) found")
  // DSH_SU_04 row left this column blank too; Flipkart sets it after approval,
  // you don't declare it upfront for a new listing.
  { header: 'Listing Status', get: () => '' },
  { header: 'MRP (INR)', get: ({ product }: RowContext) => platformPrice(product, 'flipkart').mrp },
  { header: 'Your selling price (INR)', get: ({ product }: RowContext) => platformPrice(product, 'flipkart').price },
  // Final confirmed values from a real submission that reached "10 Listings
  // Created, 0 Failed" 2026-09-24 — 'Seller' (self-ship; blank/'Flipkart' both
  // rejected), and Procurement type + SLA must both be set together once
  // Fulfilment by = 'Seller'.
  { header: 'Fullfilment by', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.fulfilmentBy) },
  { header: 'Procurement type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.procurementType) },
  { header: 'Procurement SLA (DAY)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.procurementSlaDays) },
  { header: 'Stock', get: ({ size }: RowContext) => size.quantity },
  { header: 'Shipping provider', get: () => 'FLIPKART' },
  { header: 'Local handling fee (INR)', get: () => '' },
  { header: 'Zonal handling fee (INR)', get: () => '' },
  { header: 'National handling fee (INR)', get: () => '' },
  { header: 'Length (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.lengthCm) },
  { header: 'Breadth (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.breadthCm) },
  { header: 'Height (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.heightCm) },
  { header: 'Weight (KG)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.weightKg) },
  { header: 'HSN', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.hsnFlipkart) },
  { header: 'Luxury Cess', get: () => '' },
  { header: 'Country Of Origin', get: () => MYNTRA_COUNTRY_OF_ORIGIN },
  { header: 'Manufacturer Details', get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Packer Details', get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Importer Details', get: () => '' },
  { header: 'Tax Code', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.taxCode) },
  { header: 'Minimum Order Quantity (MinOQ)', get: () => '' },
  { header: 'Brand', get: () => MYNTRA_BRAND },
  { header: 'Ideal For', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.ageGroup) },
  { header: 'Sleeve', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.sleeveLength) },
  {
    header: 'Type',
    get: ({ product }: RowContext) => hasDupatta(product.flipkartListingDetail?.packageContains)
      ? 'Kurta, Trouser/Pant & Dupatta Set'
      : 'Kurta & Trouser/Pant Set',
  },
  { header: 'Occasion', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.occasion) },
  { header: 'Pattern', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topPattern) },
  { header: 'Dupatta Included', get: ({ product }: RowContext) => hasDupatta(product.flipkartListingDetail?.packageContains) ? 'Yes' : 'No' },
  { header: 'Shape Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.shapeType) },
  { header: 'Kurta Fabric', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topFabric) },
  { header: 'Suitable For', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.suitableFor) },
  { header: 'Brand Size', get: ({ size }: RowContext) => size.size },
  { header: 'Brand Size - Measuring Unit', get: () => 'Regular' },
  { header: 'Style Code', get: ({ product }: RowContext) => product.sku },
  { header: 'Color', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.colour) },
  { header: 'Brand Color', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.colour) },
  { header: 'Main Image URL', get: ({ product }: RowContext) => categorizeProductImages(product.images).front },
  { header: 'Other Image URL 1', get: ({ product }: RowContext) => categorizeProductImages(product.images).back },
  { header: 'Other Image URL 2', get: ({ product }: RowContext) => categorizeProductImages(product.images).side },
  { header: 'Other Image URL 3', get: ({ product }: RowContext) => categorizeProductImages(product.images).detail },
  { header: 'Other Image URL 4', get: ({ product }: RowContext) => categorizeProductImages(product.images).lookShot },
  { header: 'Main Palette Image URL', get: () => '' },
  { header: 'Top Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topType) },
  // Confirmed mandatory via real QC failure 2026-09-25 (was hardcoded blank).
  { header: 'Bottom Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.bottomType) },
  { header: 'Neck', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.neck) },
  { header: 'Dupatta Fabric', get: () => '' },
  { header: 'Salwar Fabric', get: () => '' },
  { header: 'Secondary Color', get: () => '' },
  { header: 'Model Name', get: () => '' },
  { header: 'Fabric Care', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.materialCareDescription) },
  { header: 'Video URL', get: () => '' },
  { header: 'Pattern/Print Type', get: () => '' },
  { header: 'Sleeve Style', get: () => '' },
  { header: 'Surface Styling', get: () => '' },
  { header: 'Detail Placement', get: () => '' },
  { header: 'Ornamentation Type', get: () => '' },
  { header: 'Other Details', get: () => '' },
  { header: 'Description', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.styleNote) },
  { header: 'Search Keywords', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.searchKeywords) },
  { header: 'Key Features', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.productDetails) },
  { header: 'EAN/UPC', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.gtin) },
  { header: 'Net Quantity', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.netQuantity) },
  { header: 'Supplier Image', get: () => '' },
];

// Column order/headers copied verbatim from Flipkart's own downloaded template
// (Flipkart-Bulk-Template-Kurta.xls, "kurta" sheet — single-piece garment, no
// bottom-garment columns at all). HSN/category/package dims confirmed from
// DSH-BEG-KPS's real live listing; other fields are best-effort, following the
// same pattern that got Suits to "10 Listings Created, 0 Failed" — not yet
// independently QC-tested for this category. Only used for true single-piece
// Kurtis (isKurtaSet excludes 2-piece kurta+pant sets).
export const FLIPKART_KURTI_COLUMNS = [
  { header: 'Flipkart Serial Number', get: () => '' },
  { header: 'Catalog QC Status', get: () => '' },
  { header: 'QC Failed Reason (if any)', get: () => '' },
  { header: 'Flipkart Product Link', get: () => '' },
  { header: 'Product Data Status', get: () => '' },
  { header: 'Disapproval Reason (if any)', get: () => '' },
  { header: 'Seller SKU ID', get: ({ product, size }: RowContext) => `${product.sku}-${size.size}` },
  { header: 'Group ID', get: ({ product }: RowContext) => product.sku },
  { header: 'Parent Variant FSN', get: () => '' },
  { header: 'Listing Status', get: () => '' },
  { header: 'MRP (INR)', get: ({ product }: RowContext) => platformPrice(product, 'flipkart').mrp },
  { header: 'Your selling price (INR)', get: ({ product }: RowContext) => platformPrice(product, 'flipkart').price },
  { header: 'Fullfilment by', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.fulfilmentBy) },
  { header: 'Procurement type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.procurementType) },
  { header: 'Procurement SLA (DAY)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.procurementSlaDays) },
  { header: 'Stock', get: ({ size }: RowContext) => size.quantity },
  { header: 'Shipping provider', get: () => 'FLIPKART' },
  { header: 'Local handling fee (INR)', get: () => '' },
  { header: 'Zonal handling fee (INR)', get: () => '' },
  { header: 'National handling fee (INR)', get: () => '' },
  { header: 'Length (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.lengthCm) },
  { header: 'Breadth (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.breadthCm) },
  { header: 'Height (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.heightCm) },
  { header: 'Weight (KG)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.weightKg) },
  { header: 'HSN', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.hsnFlipkart) },
  { header: 'Luxury Cess', get: () => '' },
  { header: 'Country Of Origin', get: () => MYNTRA_COUNTRY_OF_ORIGIN },
  { header: 'Manufacturer Details', get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Packer Details', get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Importer Details', get: () => '' },
  { header: 'Tax Code', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.taxCode) },
  { header: 'Minimum Order Quantity (MinOQ)', get: () => '' },
  { header: 'Brand', get: () => MYNTRA_BRAND },
  { header: 'Shape Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.shapeType) },
  { header: 'Length Type', get: () => '' },
  { header: 'Ideal For', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.ageGroup) },
  { header: 'Pattern', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topPattern) },
  { header: 'Occasion', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.occasion) },
  { header: 'Fabric', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topFabric) },
  { header: 'Pack of', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.packOf) },
  { header: 'Neck Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.neck) },
  { header: 'Sleeve Length', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.sleeveLength) },
  { header: 'Suitable For', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.suitableFor) },
  { header: 'Style Code', get: ({ product }: RowContext) => product.sku },
  { header: 'Brand Size', get: ({ size }: RowContext) => size.size },
  { header: 'Brand Size - Measuring Unit', get: () => 'Regular' },
  { header: 'Color', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.colour) },
  { header: 'Brand Color', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.colour) },
  { header: 'Main Image URL', get: ({ product }: RowContext) => categorizeProductImages(product.images).front },
  { header: 'Other Image URL 1', get: ({ product }: RowContext) => categorizeProductImages(product.images).back },
  { header: 'Other Image URL 2', get: ({ product }: RowContext) => categorizeProductImages(product.images).side },
  { header: 'Other Image URL 3', get: ({ product }: RowContext) => categorizeProductImages(product.images).detail },
  { header: 'Other Image URL 4', get: ({ product }: RowContext) => categorizeProductImages(product.images).lookShot },
  { header: 'Other Image URL 5', get: () => '' },
  { header: 'Main Palette Image URL', get: () => '' },
  { header: 'Pattern/Print Type', get: () => '' },
  { header: 'Style Type', get: () => '' },
  { header: 'Pattern Coverage', get: () => '' },
  { header: 'Ornamentation Type', get: () => '' },
  { header: 'Secondary Color', get: () => '' },
  { header: 'Fabric Care', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.materialCareDescription) },
  { header: 'Model Name', get: () => '' },
  { header: 'Fit', get: () => '' },
  { header: 'Pockets', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.pockets) },
  { header: 'Sleeve Style', get: () => '' },
  { header: 'Detail placement', get: () => '' },
  { header: 'Fabric Purity', get: () => '' },
  { header: 'Attached Dupatta', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.attachedDupatta) },
  { header: 'Surface Styling', get: () => '' },
  { header: 'EAN/UPC', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.gtin) },
  { header: 'Other Top Dimensions', get: () => '' },
  { header: 'Other Details', get: () => '' },
  { header: 'Description', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.styleNote) },
  { header: 'Search Keywords', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.searchKeywords) },
  { header: 'Key Features', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.productDetails) },
  { header: 'Video URL', get: () => '' },
  { header: 'Applique Type', get: () => '' },
  { header: 'Supplier Image', get: () => '' },
];

// Column order/headers copied verbatim from Flipkart's own downloaded template
// (Flipkart-Bulk-Template-Top.xls, "top" sheet, 2026-09-24). Allowed values
// come from its Index sheet (FLIPKART_TOP_VALUES in flipkartAutofill.ts).
// Not yet QC-tested — expect a real QC round to correct something.
export const FLIPKART_TOP_COLUMNS = [
  { header: 'Flipkart Serial Number', get: () => '' },
  { header: 'Catalog QC Status', get: () => '' },
  { header: 'QC Failed Reason (if any)', get: () => '' },
  { header: 'Flipkart Product Link', get: () => '' },
  { header: 'Product Data Status', get: () => '' },
  { header: 'Disapproval Reason (if any)', get: () => '' },
  { header: 'Seller SKU ID', get: ({ product, size }: RowContext) => `${product.sku}-${size.size}` },
  { header: 'Group ID', get: ({ product }: RowContext) => product.sku },
  { header: 'Parent Variant FSN', get: () => '' },
  { header: 'Listing Status', get: () => '' },
  { header: 'MRP (INR)', get: ({ product }: RowContext) => platformPrice(product, 'flipkart').mrp },
  { header: 'Your selling price (INR)', get: ({ product }: RowContext) => platformPrice(product, 'flipkart').price },
  { header: 'Fullfilment by', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.fulfilmentBy) },
  { header: 'Procurement type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.procurementType) },
  { header: 'Procurement SLA (DAY)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.procurementSlaDays) },
  { header: 'Stock', get: ({ size }: RowContext) => size.quantity },
  { header: 'Shipping provider', get: () => 'FLIPKART' },
  { header: 'Local handling fee (INR)', get: () => '' },
  { header: 'Zonal handling fee (INR)', get: () => '' },
  { header: 'National handling fee (INR)', get: () => '' },
  { header: 'Length (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.lengthCm) },
  { header: 'Breadth (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.breadthCm) },
  { header: 'Height (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.heightCm) },
  { header: 'Weight (KG)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.weightKg) },
  { header: 'HSN', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.hsnFlipkart) },
  { header: 'Luxury Cess', get: () => '' },
  { header: 'Country Of Origin', get: () => MYNTRA_COUNTRY_OF_ORIGIN },
  { header: 'Manufacturer Details', get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Packer Details', get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Importer Details', get: () => '' },
  { header: 'Tax Code', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.taxCode) },
  { header: 'Minimum Order Quantity (MinOQ)', get: () => '' },
  { header: 'Brand', get: () => MYNTRA_BRAND },
  { header: 'Occasion', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.occasion) },
  { header: 'Ideal For', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.ageGroup) },
  { header: 'Pattern', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topPattern) },
  { header: 'Pack of', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.packOf) },
  { header: 'Brand Fabric', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.fabricType) },
  { header: 'Neck & Collar', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.neck) },
  { header: 'Fit', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.fit) },
  { header: 'Suitable For', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.suitableFor) },
  { header: 'Sleeve Style', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.sleeveStyle) },
  { header: 'Style Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.shapeType) },
  { header: 'Style Code', get: ({ product }: RowContext) => product.sku },
  { header: 'Brand Size', get: ({ size }: RowContext) => size.size },
  { header: 'Color', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.colour) },
  { header: 'Brand Color', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.colour) },
  { header: 'Main Image URL', get: ({ product }: RowContext) => categorizeProductImages(product.images).front },
  { header: 'Other Image URL 1', get: ({ product }: RowContext) => categorizeProductImages(product.images).back },
  { header: 'Other Image URL 2', get: ({ product }: RowContext) => categorizeProductImages(product.images).side },
  { header: 'Other Image URL 3', get: ({ product }: RowContext) => categorizeProductImages(product.images).detail },
  { header: 'Other Image URL 4', get: ({ product }: RowContext) => categorizeProductImages(product.images).lookShot },
  { header: 'Main Palette Image URL', get: () => '' },
  { header: 'Detail Placement', get: () => '' },
  { header: 'Sleeve Length', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.sleeveLength) },
  { header: 'Tops Length', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topsLength) },
  { header: 'Secondary Color', get: () => '' },
  { header: 'Fabric Care', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.materialCareDescription) },
  { header: 'Model Name', get: () => '' },
  { header: 'Belt Included', get: () => '' },
  { header: 'Video URL', get: () => '' },
  { header: 'Pattern Coverage', get: () => '' },
  { header: 'Transparency', get: () => '' },
  { header: 'Attached Dupatta', get: () => '' },
  { header: 'Bottom Hem', get: () => '' },
  { header: 'Ornamentation Type', get: () => '' },
  { header: 'Other Details', get: () => '' },
  { header: 'Description', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.styleNote) },
  { header: 'Search Keywords', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.searchKeywords) },
  { header: 'Key Features', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.productDetails) },
  { header: 'Product Title', get: () => '' },
  { header: 'EAN/UPC', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.gtin) },
  { header: 'Applique Type', get: () => '' },
  { header: 'Surface Styling', get: () => '' },
  { header: 'Supplier Image', get: () => '' },
];

// Column order/headers copied verbatim from Flipkart's own downloaded template
// (C_ethnic-set_ddeaa0ca6b304eb1_2409-2107FK_REQVH3IO38X3Y.xls, "ethnic_set"
// sheet) — for kurta+bottom combos with no dupatta (e.g. "Kurta and Palazzo
// Set"), confirmed 2026-09-24 as a real, distinct Flipkart category via Seller
// Hub's category browser. No live reference listing exists yet for this
// category (unlike Suit/Kurti) — more provisional than those, expect a real
// QC round to correct it. Only used for products isKurtaSet() flags as sets.
export const FLIPKART_ETHNIC_SET_COLUMNS = [
  { header: 'Flipkart Serial Number', get: () => '' },
  { header: 'Catalog QC Status', get: () => '' },
  { header: 'QC Failed Reason (if any)', get: () => '' },
  { header: 'Flipkart Product Link', get: () => '' },
  { header: 'Product Data Status', get: () => '' },
  { header: 'Disapproval Reason (if any)', get: () => '' },
  { header: 'Seller SKU ID', get: ({ product, size }: RowContext) => `${product.sku}-${size.size}` },
  { header: 'Group ID', get: ({ product }: RowContext) => product.sku },
  { header: 'Parent Variant FSN', get: () => '' },
  { header: 'Listing Status', get: () => '' },
  { header: 'MRP (INR)', get: ({ product }: RowContext) => platformPrice(product, 'flipkart').mrp },
  { header: 'Your selling price (INR)', get: ({ product }: RowContext) => platformPrice(product, 'flipkart').price },
  { header: 'Fullfilment by', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.fulfilmentBy) },
  { header: 'Procurement type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.procurementType) },
  { header: 'Procurement SLA (DAY)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.procurementSlaDays) },
  { header: 'Stock', get: ({ size }: RowContext) => size.quantity },
  { header: 'Shipping provider', get: () => 'FLIPKART' },
  { header: 'Local handling fee (INR)', get: () => '' },
  { header: 'Zonal handling fee (INR)', get: () => '' },
  { header: 'National handling fee (INR)', get: () => '' },
  { header: 'Length (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.lengthCm) },
  { header: 'Breadth (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.breadthCm) },
  { header: 'Height (CM)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.heightCm) },
  { header: 'Weight (KG)', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.weightKg) },
  { header: 'HSN', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.hsnFlipkart) },
  { header: 'Luxury Cess', get: () => '' },
  { header: 'Country Of Origin', get: () => MYNTRA_COUNTRY_OF_ORIGIN },
  { header: 'Manufacturer Details', get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Packer Details', get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Importer Details', get: () => '' },
  { header: 'Tax Code', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.taxCode) },
  { header: 'Minimum Order Quantity (MinOQ)', get: () => '' },
  { header: 'Brand', get: () => MYNTRA_BRAND },
  { header: 'Items Included', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.packageContains) },
  { header: 'Ideal For', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.ageGroup) },
  { header: 'Sleeve Length', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.sleeveLength) },
  { header: 'Pattern', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topPattern) },
  // A separate enum from Top/Bottom Fabric below — confirmed via real QC
  // failure 2026-09-24 (see ETHNIC_SET_FABRIC_TYPE_MAP in flipkartAutofill.ts).
  { header: 'Fabric', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.fabricType) },
  { header: 'Top Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topType) },
  { header: 'Bottom Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.bottomType) },
  // Mandatory (confirmed via real QC failure 2026-09-24) — "NA" when nothing
  // extra beyond kurta+bottom is included, else the dupatta if there is one.
  {
    header: 'Additional Garments',
    get: ({ product }: RowContext) => /dupatta/i.test(product.flipkartListingDetail?.packageContains || '') ? 'Dupatta' : 'NA',
  },
  { header: 'Brand Size', get: ({ size }: RowContext) => size.size },
  { header: 'Brand Size - Measuring Unit', get: () => 'Regular' },
  { header: 'Style Code', get: ({ product }: RowContext) => product.sku },
  { header: 'Color', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.colour) },
  { header: 'Brand Color', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.colour) },
  { header: 'Main Image URL', get: ({ product }: RowContext) => categorizeProductImages(product.images).front },
  { header: 'Other Image URL 1', get: ({ product }: RowContext) => categorizeProductImages(product.images).back },
  { header: 'Other Image URL 2', get: ({ product }: RowContext) => categorizeProductImages(product.images).side },
  { header: 'Other Image URL 3', get: ({ product }: RowContext) => categorizeProductImages(product.images).detail },
  { header: 'Other Image URL 4', get: ({ product }: RowContext) => categorizeProductImages(product.images).lookShot },
  { header: 'Other Image URL 5', get: () => '' },
  { header: 'Main Palette Image URL', get: () => '' },
  { header: 'Occasion', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.occasion) },
  { header: 'Top Fabric', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.topFabric) },
  { header: 'Bottom Fabric', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.bottomFabric) },
  { header: 'Kurta Style Type', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.shapeType) },
  { header: 'Ornamentation Type', get: () => '' },
  { header: 'Fabric Care', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.materialCareDescription) },
  { header: 'Lining Material', get: () => '' },
  { header: 'Knit Type', get: () => '' },
  { header: 'Neck', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.neck) },
  { header: 'Video URL', get: () => '' },
  { header: 'Pattern/Print Type', get: () => '' },
  { header: 'Sleeve Style', get: () => '' },
  { header: 'Detail Placement', get: () => '' },
  { header: 'Surface Styling', get: () => '' },
  {
    header: 'Dupatta Included',
    get: ({ product }: RowContext) => /dupatta/i.test(product.flipkartListingDetail?.packageContains || '') ? 'Yes' : 'No',
  },
  { header: 'Net Quantity', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.netQuantity) },
  { header: 'Co-ord Set', get: () => 'No' },
  { header: 'EAN/UPC', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.gtin) },
  { header: 'EAN/UPC - Measuring Unit', get: () => '' },
  { header: 'Other Details', get: () => '' },
  { header: 'Description', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.styleNote) },
  { header: 'Search Keywords', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.searchKeywords) },
  { header: 'Key Features', get: ({ product }: RowContext) => str(product.flipkartListingDetail?.productDetails) },
  { header: 'Top Length', get: () => '' },
  { header: 'Fit', get: () => '' },
  { header: 'Lining', get: () => '' },
  { header: 'Waistband', get: () => '' },
  { header: 'Design', get: () => '' },
  { header: 'Supplier Image', get: () => '' },
];

export interface RowValueContext {
  product: ProductWithFlipkart;
  size: ProductSize;
}
export interface FlipkartColumn {
  header: string;
  get: (ctx: RowValueContext) => string | number;
}

export function columnsAndSheetFor(templateKey: string): { columns: FlipkartColumn[]; sheetName: string } {
  if (templateKey === 'Suits') return { columns: FLIPKART_SUIT_COLUMNS, sheetName: 'salwar_kurta_dupatta' };
  if (templateKey === 'Kurtis:single') return { columns: FLIPKART_KURTI_COLUMNS, sheetName: 'kurta' };
  if (templateKey === 'Kurtis:set') return { columns: FLIPKART_ETHNIC_SET_COLUMNS, sheetName: 'ethnic_set' };
  if (templateKey === 'Tops') return { columns: FLIPKART_TOP_COLUMNS, sheetName: 'top' };
  return { columns: FLIPKART_CO_ORD_COLUMNS, sheetName: 'apparel_set' };
}
