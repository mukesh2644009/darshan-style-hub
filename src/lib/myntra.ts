import type { Product, ProductSize, ProductColor, MyntraListingDetail, MyntraSizeMeasurement } from '@prisma/client';
import { platformPrice } from './platformPricing';
import { MYNTRA_CO_ORDS_VALUES, MYNTRA_DRESSES_VALUES, MYNTRA_KURTA_SETS_VALUES } from './myntraValues';
import { MYNTRA_FIELD_LABELS } from './myntraAutofill';

const SIZE_RANK = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '3XL', '4XL', 'Free Size'];
const sizeRank = (size: string) => {
  const i = SIZE_RANK.indexOf(size);
  return i === -1 ? 999 : i;
};

// Store-wide constants — same for every product, so these are not stored as
// per-product fields on MyntraListingDetail.
export const MYNTRA_BRAND = 'Darshan Style Hub';
export const MYNTRA_BUSINESS_ADDRESS =
  'Darshan Style Hub, Plot Number B-11, Shri Ram Vihar-B, Shri Kishanpura, Sanganer, Jaipur, Rajasthan, 302017';
export const MYNTRA_COUNTRY_OF_ORIGIN = 'India';

// Image columns are left blank on purpose: Myntra rejects our Cloudinary links
// ("not from a white listed domain"), so photos are uploaded by hand on Myntra
// — get them in Myntra format via "Download Myntra Images". Flipkart unaffected.
const MYNTRA_NO_IMAGE = '';

export type MyntraSheetName = 'Co-Ords' | 'Sarees' | 'Dresses' | 'Kurta Sets';

/** Which Myntra bulk-upload sheet a product's category maps to, or null if unsupported. */
export function getMyntraSheetName(productCategory: string): MyntraSheetName | null {
  if (productCategory === 'Sarees') return 'Sarees';
  if (productCategory === 'Co Ord Sets' || productCategory === 'Summer Co-ord Sets') return 'Co-Ords';
  if (productCategory === 'Western Dress') return 'Dresses';
  if (productCategory === 'Suits') return 'Kurta Sets';
  return null;
}

export type ProductWithMyntra = Product & {
  images: { url: string }[];
  sizes: ProductSize[];
  colors: ProductColor[];
  myntraListingDetail: (MyntraListingDetail & { sizeMeasurements: MyntraSizeMeasurement[] }) | null;
};

export interface MissingMyntraField {
  field: string;
  label: string;
}

/** Validates every Myntra-mandatory field is filled for a product. Empty array = ready to export. */
export function validateMyntraListing(product: ProductWithMyntra): MissingMyntraField[] {
  const sheet = getMyntraSheetName(product.category);
  const missing: MissingMyntraField[] = [];

  if (!sheet) {
    return [{
      field: 'category',
      label: `Category "${product.category}" is not supported for Myntra export (only Co Ord Sets, Summer Co-ord Sets, Western Dress, Suits and Sarees are supported)`,
    }];
  }

  const d = product.myntraListingDetail;
  const req = (value: string | null | undefined, field: string, label: string) => {
    if (!value || !value.trim()) missing.push({ field, label });
  };

  req(d?.styleName, 'styleName', 'vendorArticleName (Style Name)');
  req(d?.articleType, 'articleType', 'articleType');
  req(d?.colourRemarks, 'colourRemarks', 'Brand Colour (Remarks)');
  req(d?.prominentColour, 'prominentColour', 'Prominent Colour');
  // GTIN: Myntra's template marks this yellow/mandatory, but a real submitted listing
  // (DSH_CS_03) went through with it blank — not enforcing it here to match that
  // confirmed real-world precedent. Left blank rather than defaulted, since a wrong
  // barcode is worse than an empty one.
  req(d?.hsnCode, 'hsnCode', 'HSN');
  req(d?.ageGroup, 'ageGroup', 'AgeGroup');
  req(d?.fashionType, 'fashionType', 'FashionType');
  req(d?.year, 'year', 'Year');
  req(d?.season, 'season', 'season');
  req(d?.materialCareDescription, 'materialCareDescription', 'materialCareDescription');
  req(d?.washCare, 'washCare', 'Wash Care');
  req(d?.netQuantityUnit, 'netQuantityUnit', 'Net Quantity Unit');
  req(d?.netQuantity, 'netQuantity', 'Net Quantity');

  if (sheet === 'Co-Ords') {
    req(d?.topFabric, 'topFabric', 'Top Fabric');
    req(d?.bottomFabric, 'bottomFabric', 'Bottom Fabric');
    req(d?.addOns, 'addOns', 'Add-Ons');
    req(d?.lining, 'lining', 'Lining');
    req(d?.numberOfPockets, 'numberOfPockets', 'Number of Pockets');
    req(d?.numberOfItems, 'numberOfItems', 'Number of Items');
    req(d?.packageContains, 'packageContains', 'Package Contains');

    for (const s of product.sizes) {
      const m = d?.sizeMeasurements.find((x) => x.size === s.size);
      const need = (val: number | null | undefined, name: string) => {
        if (val == null) missing.push({ field: `sizeMeasurements.${s.size}.${name}`, label: `${name} (Inches) for size "${s.size}"` });
      };
      need(m?.bust, 'Bust');
      need(m?.chest, 'Chest');
      need(m?.frontLength, 'Front Length');
      need(m?.garmentWaist, 'Garment Waist');
      need(m?.inseamLength, 'Inseam Length');
      need(m?.toFitWaist, 'To Fit Waist');
    }

    // Myntra rejects the whole style unless each measurement goes up (or stays
    // equal) from smaller to bigger size — the 2026-10-01 DSH_CS_04 failure.
    const sized = [...product.sizes].sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
    const MEASURES = [
      ['bust', 'Bust'], ['chest', 'Chest'], ['frontLength', 'Front Length'],
      ['garmentWaist', 'Garment Waist'], ['inseamLength', 'Inseam Length'], ['toFitWaist', 'To Fit Waist'],
    ] as const;
    for (const [key, name] of MEASURES) {
      for (let i = 1; i < sized.length; i++) {
        const prev = d?.sizeMeasurements.find((x) => x.size === sized[i - 1].size)?.[key];
        const cur = d?.sizeMeasurements.find((x) => x.size === sized[i].size)?.[key];
        if (prev != null && cur != null && cur < prev) {
          missing.push({ field: `sizeMeasurements.${sized[i].size}.${key}`, label: `${name}: size "${sized[i].size}" (${cur}) is smaller than "${sized[i - 1].size}" (${prev}) — Myntra needs it to go up with size` });
        }
      }
    }

    // Dropdown fields must hold one of Myntra's own template values — anything
    // else (e.g. "Crepe", "Georgette") is rejected at Myntra after upload.
    for (const [field, allowed] of Object.entries(MYNTRA_CO_ORDS_VALUES)) {
      const value = (d as Record<string, unknown> | null | undefined)?.[field];
      if (typeof value === 'string' && value.trim() && !allowed.includes(value)) {
        missing.push({ field, label: `${MYNTRA_FIELD_LABELS[field] || field}: "${value}" isn't a Myntra option — pick one from the dropdown` });
      }
    }
    if (/unknown/i.test(d?.materialCareDescription || '')) {
      missing.push({ field: 'materialCareDescription', label: 'materialCareDescription still says "Unknown" — fill in the fabric' });
    }
  } else if (sheet === 'Kurta Sets') {
    // Yellow (mandatory) header cells of Myntra's Kurta Sets template.
    req(d?.topFabric, 'topFabric', 'Top Fabric');
    req(d?.bottomFabric, 'bottomFabric', 'Bottom Fabric');
    req(d?.bottomClosure, 'bottomClosure', 'Bottom Closure');
    req(d?.waistband, 'waistband', 'Waistband');
    req(d?.weavePattern, 'weavePattern', 'Weave Pattern');
    req(d?.weaveType, 'weaveType', 'Weave Type');
    req(d?.dupattaFabric, 'dupattaFabric', 'Dupatta Fabric');
    req(d?.addOns, 'addOns', 'Add-Ons');
    req(d?.numberOfPockets, 'numberOfPockets', 'Number of Pockets');
    req(d?.numberOfItems, 'numberOfItems', 'Number of Items');
    req(d?.packageContains, 'packageContains', 'Package Contains');

    const MEASURES = [
      ['acrossShoulder', 'Across Shoulder'], ['bust', 'Bust'], ['chest', 'Chest'], ['frontLength', 'Front Length'],
      ['hips', 'Hips'], ['inseamLength', 'Inseam Length'], ['pyjamaWaist', 'Pyjama Waist'], ['toFitWaist', 'To Fit Waist'],
      ['garmentWaist', 'Waist'],
    ] as const;
    for (const s of product.sizes) {
      const m = d?.sizeMeasurements.find((x) => x.size === s.size);
      for (const [key, name] of MEASURES) {
        if (m?.[key] == null) missing.push({ field: `sizeMeasurements.${s.size}.${key}`, label: `${name} (Inches) for size "${s.size}"` });
      }
    }
    const sized = [...product.sizes].sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
    for (const [key, name] of MEASURES) {
      for (let i = 1; i < sized.length; i++) {
        const prev = d?.sizeMeasurements.find((x) => x.size === sized[i - 1].size)?.[key];
        const cur = d?.sizeMeasurements.find((x) => x.size === sized[i].size)?.[key];
        if (prev != null && cur != null && cur < prev) {
          missing.push({ field: `sizeMeasurements.${sized[i].size}.${key}`, label: `${name}: size "${sized[i].size}" (${cur}) is smaller than "${sized[i - 1].size}" (${prev}) — Myntra needs it to go up with size` });
        }
      }
    }
    for (const [field, allowed] of Object.entries(MYNTRA_KURTA_SETS_VALUES)) {
      const value = (d as Record<string, unknown> | null | undefined)?.[field];
      if (typeof value === 'string' && value.trim() && !allowed.includes(value)) {
        missing.push({ field, label: `${MYNTRA_FIELD_LABELS[field] || field}: "${value}" isn't a Myntra Kurta Sets option — pick one from the dropdown` });
      }
    }
    if (/unknown/i.test(d?.materialCareDescription || '')) {
      missing.push({ field: 'materialCareDescription', label: 'materialCareDescription still says "Unknown" — fill in the fabric' });
    }
  } else if (sheet === 'Dresses') {
    // Yellow (mandatory) header cells of Myntra's Dresses template, 2026-10-04.
    req(d?.fabric, 'fabric', 'Fabric');
    req(d?.fabricType, 'fabricType', 'Fabric Type');
    req(d?.knitOrWoven, 'knitOrWoven', 'Knit or Woven');
    req(d?.lining, 'lining', 'Lining');
    req(d?.closure, 'closure', 'Closure');
    req(d?.addOns, 'addOns', 'Add-Ons');
    req(d?.multipackSet, 'multipackSet', 'Multipack Set');
    req(d?.numberOfItems, 'numberOfItems', 'Number of Items');
    req(d?.packageContains, 'packageContains', 'Package Contains');

    const MEASURES = [
      ['bust', 'Bust'], ['chest', 'Chest'], ['frontLength', 'Front Length'], ['hips', 'Hips'], ['garmentWaist', 'Waist'],
    ] as const;
    for (const s of product.sizes) {
      const m = d?.sizeMeasurements.find((x) => x.size === s.size);
      for (const [key, name] of MEASURES) {
        if (m?.[key] == null) missing.push({ field: `sizeMeasurements.${s.size}.${key}`, label: `${name} (Inches) for size "${s.size}"` });
      }
    }
    // Same rule as Co-Ords: each measurement must go up (or stay) with size.
    const sized = [...product.sizes].sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
    for (const [key, name] of MEASURES) {
      for (let i = 1; i < sized.length; i++) {
        const prev = d?.sizeMeasurements.find((x) => x.size === sized[i - 1].size)?.[key];
        const cur = d?.sizeMeasurements.find((x) => x.size === sized[i].size)?.[key];
        if (prev != null && cur != null && cur < prev) {
          missing.push({ field: `sizeMeasurements.${sized[i].size}.${key}`, label: `${name}: size "${sized[i].size}" (${cur}) is smaller than "${sized[i - 1].size}" (${prev}) — Myntra needs it to go up with size` });
        }
      }
    }
    for (const [field, allowed] of Object.entries(MYNTRA_DRESSES_VALUES)) {
      const value = (d as Record<string, unknown> | null | undefined)?.[field];
      if (typeof value === 'string' && value.trim() && !allowed.includes(value)) {
        missing.push({ field, label: `${MYNTRA_FIELD_LABELS[field] || field}: "${value}" isn't a Myntra Dresses option — pick one from the dropdown` });
      }
    }
    if (/unknown/i.test(d?.materialCareDescription || '')) {
      missing.push({ field: 'materialCareDescription', label: 'materialCareDescription still says "Unknown" — fill in the fabric' });
    }
  } else {
    req(d?.sareeType, 'sareeType', 'Type');
    req(d?.sareeFabric, 'sareeFabric', 'Saree Fabric');
    req(d?.blouseFabric, 'blouseFabric', 'Blouse Fabric');
    req(d?.blouseIncluded, 'blouseIncluded', 'Blouse');
    req(d?.multipackSet, 'multipackSet', 'Multipack Set');
  }

  if (product.sizes.length === 0) {
    missing.push({ field: 'sizes', label: 'Product has no sizes/variants defined' });
  }

  return missing;
}

interface RowContext {
  product: ProductWithMyntra;
  size: ProductSize;
  // Sequential per-style number within this export batch (1, 2, 3, ...) — confirmed
  // from a real submitted template that this is a plain incrementing integer, not
  // the SKU. Same value across every size row of one style.
  styleGroupId: number;
}

export interface MyntraColumn {
  header: string;
  mandatory: boolean;
  get: (ctx: RowContext) => string | number;
}

const num = (v: number | null | undefined): string | number => (v == null ? '' : v);
const str = (v: string | null | undefined): string => v || '';

// Column order/headers below are read directly from row 3 of Myntra's official
// "Co-Ords" bulk-upload template sheet — do not reorder.
export const CO_ORDS_COLUMNS: MyntraColumn[] = [
  { header: 'styleId', mandatory: false, get: () => '' },
  { header: 'styleGroupId', mandatory: true, get: ({ styleGroupId }) => styleGroupId },
  { header: 'vendorSkuCode', mandatory: false, get: ({ product, size }) => `${product.sku}-${size.size}` },
  { header: 'vendorArticleNumber', mandatory: true, get: ({ product }) => product.sku },
  { header: 'vendorArticleName', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.styleName) },
  { header: 'brand', mandatory: true, get: () => MYNTRA_BRAND },
  { header: 'Manufacturer Name and Address with Pincode', mandatory: true, get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Packer Name and Address with Pincode', mandatory: true, get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Importer Name and Address with Pincode', mandatory: false, get: () => '' },
  { header: 'Country Of Origin', mandatory: true, get: () => MYNTRA_COUNTRY_OF_ORIGIN },
  { header: 'Country Of Origin2', mandatory: false, get: () => '' },
  { header: 'Country Of Origin3', mandatory: false, get: () => '' },
  { header: 'Country Of Origin4', mandatory: false, get: () => '' },
  { header: 'Country Of Origin5', mandatory: false, get: () => '' },
  { header: 'articleType', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.articleType) },
  { header: 'Brand Size', mandatory: true, get: ({ size }) => size.size },
  { header: 'Standard Size', mandatory: true, get: ({ size }) => size.size },
  { header: 'is Standard Size present on Label', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.sizeLabelPresent) || 'Yes' },
  { header: 'Brand Colour (Remarks)', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.colourRemarks) },
  { header: 'GTIN', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.gtin) },
  { header: 'HSN', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.hsnCode) },
  { header: 'SKUCode', mandatory: false, get: () => '' },
  { header: 'MRP', mandatory: true, get: ({ product }) => platformPrice(product, 'myntra').mrp },
  { header: 'ISP', mandatory: true, get: ({ product }) => platformPrice(product, 'myntra').price },
  { header: 'AgeGroup', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.ageGroup) || 'Adults-Women' },
  { header: 'Prominent Colour', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.prominentColour) || product.colors[0]?.name || '' },
  { header: 'Second Prominent Colour', mandatory: false, get: ({ product }) => product.colors[1]?.name || '' },
  { header: 'Third Prominent Colour', mandatory: false, get: ({ product }) => product.colors[2]?.name || '' },
  { header: 'FashionType', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.fashionType) || 'Fashion' },
  { header: 'Usage', mandatory: false, get: () => '' },
  { header: 'Year', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.year) },
  { header: 'season', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.season) },
  { header: 'AI Label', mandatory: false, get: () => '' },
  { header: 'List View Name', mandatory: false, get: () => '' },
  { header: 'Product Details', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.productDetails) },
  { header: 'styleNote', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.styleNote) },
  { header: 'materialCareDescription', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.materialCareDescription) },
  { header: 'sizeAndFitDescription', mandatory: false, get: () => '' },
  { header: 'productDisplayName', mandatory: false, get: ({ product }) => product.name },
  { header: 'tags', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.tags) },
  { header: 'addedDate', mandatory: false, get: () => '' },
  { header: 'Color Variant GroupId', mandatory: false, get: () => '' },
  { header: 'Occasion', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.occasion) },
  { header: 'Sleeve Length', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.sleeveLength) },
  { header: 'Neck', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.neck) },
  { header: 'Top Fabric', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.topFabric) },
  { header: 'Bottom Fabric', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.bottomFabric) },
  { header: 'Top Type', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.topType) },
  { header: 'Bottom Type', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.bottomType) },
  { header: 'Top Pattern', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.topPattern) },
  { header: 'Bottom Pattern', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.bottomPattern) },
  { header: 'Bottom Closure', mandatory: false, get: () => '' },
  { header: 'Add-Ons', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.addOns) },
  { header: 'Wash Care', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.washCare) },
  { header: 'Character', mandatory: false, get: () => '' },
  { header: 'Lining', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.lining) },
  { header: 'Number of Pockets', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.numberOfPockets) },
  { header: 'Trends', mandatory: false, get: () => '' },
  { header: 'Sustainable', mandatory: false, get: () => '' },
  { header: 'Number of Items', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.numberOfItems) },
  { header: 'Top Closure', mandatory: false, get: () => '' },
  { header: 'Net Quantity Unit', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.netQuantityUnit) || 'Pieces' },
  { header: 'Theme', mandatory: false, get: () => '' },
  { header: 'Stitch', mandatory: false, get: () => '' },
  { header: 'Theme 1', mandatory: false, get: () => '' },
  { header: 'Top Hemline', mandatory: false, get: () => '' },
  { header: 'Bottom Hemline', mandatory: false, get: () => '' },
  { header: 'Sleeve Styling', mandatory: false, get: () => '' },
  { header: 'Collection Name', mandatory: false, get: () => '' },
  { header: 'Package Contains', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.packageContains) },
  { header: 'BIS Expiry Date', mandatory: false, get: () => '' },
  { header: 'BIS Certificate Image URL', mandatory: false, get: () => '' },
  { header: 'BIS Certificate Number', mandatory: false, get: () => '' },
  { header: 'Net Quantity', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.netQuantity) },
  { header: 'Bust ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.bust) },
  { header: 'Chest ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.chest) },
  { header: 'Front Length ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.frontLength) },
  { header: 'Garment Waist ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.garmentWaist) },
  { header: 'Inseam Length ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.inseamLength) },
  { header: 'To Fit Waist ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.toFitWaist) },
  { header: 'Across Shoulder ( Inches )', mandatory: false, get: () => '' },
  { header: 'Outseam Length ( Inches )', mandatory: false, get: () => '' },
  { header: 'Rise ( Inches )', mandatory: false, get: () => '' },
  { header: 'Sleeve-Length ( Inches )', mandatory: false, get: () => '' },
  { header: 'To Fit Bust ( Inches )', mandatory: false, get: () => '' },
  { header: 'To Fit Chest ( Inches )', mandatory: false, get: () => '' },
  { header: 'To Fit Hip ( Inches )', mandatory: false, get: () => '' },
  { header: 'Front Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Side Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Back Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Detail Angle', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Look Shot Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Additional Image 1', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Additional Image 2', mandatory: false, get: () => MYNTRA_NO_IMAGE },
];

// Column order/headers below are read directly from row 3 of Myntra's official
// "Sarees" bulk-upload template sheet — do not reorder.
export const SAREES_COLUMNS: MyntraColumn[] = [
  { header: 'styleId', mandatory: false, get: () => '' },
  { header: 'styleGroupId', mandatory: true, get: ({ styleGroupId }) => styleGroupId },
  { header: 'vendorSkuCode', mandatory: false, get: ({ product, size }) => `${product.sku}-${size.size}` },
  { header: 'vendorArticleNumber', mandatory: true, get: ({ product }) => product.sku },
  { header: 'vendorArticleName', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.styleName) },
  { header: 'brand', mandatory: true, get: () => MYNTRA_BRAND },
  { header: 'Manufacturer Name and Address with Pincode', mandatory: true, get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Packer Name and Address with Pincode', mandatory: true, get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Importer Name and Address with Pincode', mandatory: false, get: () => '' },
  { header: 'Country Of Origin', mandatory: true, get: () => MYNTRA_COUNTRY_OF_ORIGIN },
  { header: 'Country Of Origin2', mandatory: false, get: () => '' },
  { header: 'Country Of Origin3', mandatory: false, get: () => '' },
  { header: 'Country Of Origin4', mandatory: false, get: () => '' },
  { header: 'Country Of Origin5', mandatory: false, get: () => '' },
  { header: 'articleType', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.articleType) },
  { header: 'Brand Size', mandatory: true, get: ({ size }) => size.size },
  { header: 'Standard Size', mandatory: true, get: ({ size }) => size.size },
  { header: 'is Standard Size present on Label', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.sizeLabelPresent) || 'Yes' },
  { header: 'Brand Colour (Remarks)', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.colourRemarks) },
  { header: 'GTIN', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.gtin) },
  { header: 'HSN', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.hsnCode) },
  { header: 'SKUCode', mandatory: false, get: () => '' },
  { header: 'MRP', mandatory: true, get: ({ product }) => platformPrice(product, 'myntra').mrp },
  { header: 'ISP', mandatory: true, get: ({ product }) => platformPrice(product, 'myntra').price },
  { header: 'AgeGroup', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.ageGroup) || 'Adults-Women' },
  { header: 'Prominent Colour', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.prominentColour) || product.colors[0]?.name || '' },
  { header: 'Second Prominent Colour', mandatory: false, get: ({ product }) => product.colors[1]?.name || '' },
  { header: 'Third Prominent Colour', mandatory: false, get: ({ product }) => product.colors[2]?.name || '' },
  { header: 'FashionType', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.fashionType) || 'Fashion' },
  { header: 'Usage', mandatory: false, get: () => '' },
  { header: 'Year', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.year) },
  { header: 'season', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.season) },
  { header: 'AI Label', mandatory: false, get: () => '' },
  { header: 'List View Name', mandatory: false, get: () => '' },
  { header: 'Product Details', mandatory: false, get: () => '' },
  { header: 'styleNote', mandatory: false, get: () => '' },
  { header: 'materialCareDescription', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.materialCareDescription) },
  { header: 'sizeAndFitDescription', mandatory: false, get: () => '' },
  { header: 'productDisplayName', mandatory: false, get: ({ product }) => product.name },
  { header: 'tags', mandatory: false, get: () => '' },
  { header: 'addedDate', mandatory: false, get: () => '' },
  { header: 'Color Variant GroupId', mandatory: false, get: () => '' },
  { header: 'Type', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.sareeType) },
  { header: 'Saree Fabric', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.sareeFabric) },
  { header: 'Blouse Fabric', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.blouseFabric) },
  { header: 'Blouse', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.blouseIncluded) },
  { header: 'Pattern', mandatory: false, get: () => '' },
  { header: 'Print or Pattern Type', mandatory: false, get: () => '' },
  { header: 'Ornamentation', mandatory: false, get: () => '' },
  { header: 'Border', mandatory: false, get: () => '' },
  { header: 'Occasion', mandatory: false, get: () => '' },
  { header: 'Wash Care', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.washCare) },
  { header: 'Trends', mandatory: false, get: () => '' },
  { header: 'Sustainable', mandatory: false, get: () => '' },
  { header: 'Main Trend', mandatory: false, get: () => '' },
  { header: 'Multipack Set', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.multipackSet) },
  { header: 'Net Quantity Unit', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.netQuantityUnit) || 'Pieces' },
  { header: 'Theme', mandatory: false, get: () => '' },
  { header: 'Stitch', mandatory: false, get: () => '' },
  { header: 'Theme 1', mandatory: false, get: () => '' },
  { header: 'Technique', mandatory: false, get: () => '' },
  { header: 'Care for me', mandatory: false, get: () => '' },
  { header: 'Where-to-wear', mandatory: false, get: () => '' },
  { header: 'Style Tip', mandatory: false, get: () => '' },
  { header: 'BIS Expiry Date', mandatory: false, get: () => '' },
  { header: 'BIS Certificate Image URL', mandatory: false, get: () => '' },
  { header: 'BIS Certificate Number', mandatory: false, get: () => '' },
  { header: 'Net Quantity', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.netQuantity) },
  { header: 'Bust ( Inches )', mandatory: false, get: () => '' },
  { header: 'Hip ( Inches )', mandatory: false, get: () => '' },
  { header: 'Outseam Length ( Inches )', mandatory: false, get: () => '' },
  { header: 'To Fit Waist ( Inches )', mandatory: false, get: () => '' },
  { header: 'Waist ( Inches )', mandatory: false, get: () => '' },
  { header: 'Front Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Side Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Back Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Detail Angle', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Look Shot Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Additional Image 1', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Additional Image 2', mandatory: false, get: () => MYNTRA_NO_IMAGE },
];

// Column order/headers below are read directly from row 3 of Myntra's official
// "Dresses" bulk-upload template sheet (Myntra-Sku-Template-2026-10-04.xlsx, v13) —
// do not reorder. mandatory = yellow header cells. Images stay blank (uploaded by hand).
export const DRESSES_COLUMNS: MyntraColumn[] = [
  { header: 'styleId', mandatory: false, get: () => '' },
  { header: 'styleGroupId', mandatory: true, get: ({ styleGroupId }) => styleGroupId },
  { header: 'vendorSkuCode', mandatory: false, get: ({ product, size }) => `${product.sku}-${size.size}` },
  { header: 'vendorArticleNumber', mandatory: true, get: ({ product }) => product.sku },
  { header: 'vendorArticleName', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.styleName) },
  { header: 'brand', mandatory: true, get: () => MYNTRA_BRAND },
  { header: 'Manufacturer Name and Address with Pincode', mandatory: true, get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Packer Name and Address with Pincode', mandatory: true, get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Importer Name and Address with Pincode', mandatory: false, get: () => '' },
  { header: 'Country Of Origin', mandatory: true, get: () => MYNTRA_COUNTRY_OF_ORIGIN },
  { header: 'Country Of Origin2', mandatory: false, get: () => '' },
  { header: 'Country Of Origin3', mandatory: false, get: () => '' },
  { header: 'Country Of Origin4', mandatory: false, get: () => '' },
  { header: 'Country Of Origin5', mandatory: false, get: () => '' },
  { header: 'articleType', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.articleType) || 'Dresses' },
  { header: 'Brand Size', mandatory: true, get: ({ size }) => size.size },
  { header: 'Standard Size', mandatory: true, get: ({ size }) => size.size },
  { header: 'is Standard Size present on Label', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.sizeLabelPresent) || 'Yes' },
  { header: 'Brand Colour (Remarks)', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.colourRemarks) },
  { header: 'GTIN', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.gtin) },
  { header: 'HSN', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.hsnCode) },
  { header: 'SKUCode', mandatory: false, get: () => '' },
  { header: 'MRP', mandatory: true, get: ({ product }) => platformPrice(product, 'myntra').mrp },
  { header: 'ISP', mandatory: true, get: ({ product }) => platformPrice(product, 'myntra').price },
  { header: 'AgeGroup', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.ageGroup) || 'Adults-Women' },
  { header: 'Prominent Colour', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.prominentColour) },
  { header: 'Second Prominent Colour', mandatory: false, get: () => '' },
  { header: 'Third Prominent Colour', mandatory: false, get: () => '' },
  { header: 'FashionType', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.fashionType) || 'Fashion' },
  { header: 'Usage', mandatory: false, get: () => '' },
  { header: 'Year', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.year) },
  { header: 'season', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.season) },
  { header: 'AI Label', mandatory: false, get: () => '' },
  { header: 'List View Name', mandatory: false, get: () => '' },
  { header: 'Product Details', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.productDetails) },
  { header: 'styleNote', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.styleNote) },
  { header: 'materialCareDescription', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.materialCareDescription) },
  { header: 'sizeAndFitDescription', mandatory: false, get: () => '' },
  { header: 'productDisplayName', mandatory: false, get: ({ product }) => product.name },
  { header: 'tags', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.tags) },
  { header: 'addedDate', mandatory: false, get: () => '' },
  { header: 'Color Variant GroupId', mandatory: false, get: () => '' },
  { header: 'Fabric', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.fabric) },
  { header: 'Occasion', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.occasion) },
  { header: 'Shape', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.dressShape) },
  { header: 'Neck', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.neck) },
  { header: 'Pattern', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.topPattern) },
  { header: 'Fabric 2', mandatory: false, get: () => '' },
  { header: 'Fabric 3', mandatory: false, get: () => '' },
  { header: 'Length', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.dressLength) },
  { header: 'Sleeve Length', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.sleeveLength) },
  { header: 'Knit or Woven', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.knitOrWoven) },
  { header: 'Hemline', mandatory: false, get: () => '' },
  { header: 'Print or Pattern Type', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.printType) },
  { header: 'Surface Styling', mandatory: false, get: () => '' },
  { header: 'Body Shape ID', mandatory: false, get: () => '' },
  { header: 'Main Trend', mandatory: false, get: () => '' },
  { header: 'Sleeve Styling', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.sleeveStyling) },
  { header: 'Transparency', mandatory: false, get: () => '' },
  { header: 'Fabric Type', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.fabricType) },
  { header: 'Lining', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.lining) },
  { header: 'Wash Care', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.washCare) },
  { header: 'Body or Garment Size', mandatory: false, get: () => '' },
  { header: 'Closure', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.closure) },
  { header: 'Add-Ons', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.addOns) },
  { header: 'Stitch', mandatory: false, get: () => '' },
  { header: 'Character', mandatory: false, get: () => '' },
  { header: 'Sustainable', mandatory: false, get: () => '' },
  { header: 'Number of Pockets', mandatory: false, get: () => '' },
  { header: 'Multipack Set', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.multipackSet) },
  { header: 'Number of Items', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.numberOfItems) },
  { header: 'Net Quantity Unit', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.netQuantityUnit) || 'Pieces' },
  { header: 'Theme', mandatory: false, get: () => '' },
  { header: 'Theme 1', mandatory: false, get: () => '' },
  { header: 'Type', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.dressType) },
  { header: 'Fit', mandatory: false, get: () => '' },
  { header: 'Weave Type', mandatory: false, get: () => '' },
  { header: 'Technique', mandatory: false, get: () => '' },
  { header: 'Contact Brand or Retailer for pre-sales product queries', mandatory: false, get: () => '' },
  { header: 'Where-to-wear', mandatory: false, get: () => '' },
  { header: 'Style Tip', mandatory: false, get: () => '' },
  { header: 'Care for me', mandatory: false, get: () => '' },
  { header: 'Collection Name', mandatory: false, get: () => '' },
  { header: 'Package Contains', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.packageContains) },
  { header: 'BIS Expiry Date', mandatory: false, get: () => '' },
  { header: 'BIS Certificate Image URL', mandatory: false, get: () => '' },
  { header: 'BIS Certificate Number', mandatory: false, get: () => '' },
  { header: 'Net Quantity', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.netQuantity) },
  { header: 'Bust ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.bust) },
  { header: 'Chest ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.chest) },
  { header: 'Front Length ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.frontLength) },
  { header: 'Hips ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.hips) },
  { header: 'Waist ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.garmentWaist) },
  { header: 'Across Shoulder ( Inches )', mandatory: false, get: () => '' },
  { header: 'Sleeve-Length ( Inches )', mandatory: false, get: () => '' },
  { header: 'To Fit Bust ( Inches )', mandatory: false, get: () => '' },
  { header: 'To Fit Hip ( Inches )', mandatory: false, get: () => '' },
  { header: 'To Fit Waist ( Inches )', mandatory: false, get: () => '' },
  { header: 'Front Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Side Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Back Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Detail Angle', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Look Shot Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Additional Image 1', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Additional Image 2', mandatory: false, get: () => MYNTRA_NO_IMAGE },
];

// Column order/headers below are read directly from row 3 of Myntra's official
// "Kurta Sets" bulk-upload template sheet (v13) — do not reorder. mandatory = yellow
// header cells. Same layout as the accepted DSH_SU_04/05 upload (job 1695788).
export const KURTA_SETS_COLUMNS: MyntraColumn[] = [
  { header: 'styleId', mandatory: false, get: () => '' },
  { header: 'styleGroupId', mandatory: true, get: ({ styleGroupId }) => styleGroupId },
  { header: 'vendorSkuCode', mandatory: false, get: ({ product, size }) => `${product.sku}-${size.size}` },
  { header: 'vendorArticleNumber', mandatory: true, get: ({ product }) => product.sku },
  { header: 'vendorArticleName', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.styleName) },
  { header: 'brand', mandatory: true, get: () => MYNTRA_BRAND },
  { header: 'Manufacturer Name and Address with Pincode', mandatory: true, get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Packer Name and Address with Pincode', mandatory: true, get: () => MYNTRA_BUSINESS_ADDRESS },
  { header: 'Importer Name and Address with Pincode', mandatory: false, get: () => '' },
  { header: 'Country Of Origin', mandatory: true, get: () => MYNTRA_COUNTRY_OF_ORIGIN },
  { header: 'Country Of Origin2', mandatory: false, get: () => '' },
  { header: 'Country Of Origin3', mandatory: false, get: () => '' },
  { header: 'Country Of Origin4', mandatory: false, get: () => '' },
  { header: 'Country Of Origin5', mandatory: false, get: () => '' },
  { header: 'articleType', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.articleType) || 'Kurta Sets' },
  { header: 'Brand Size', mandatory: true, get: ({ size }) => size.size },
  { header: 'Standard Size', mandatory: true, get: ({ size }) => size.size },
  { header: 'is Standard Size present on Label', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.sizeLabelPresent) || 'Yes' },
  { header: 'Brand Colour (Remarks)', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.colourRemarks) },
  { header: 'GTIN', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.gtin) },
  { header: 'HSN', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.hsnCode) },
  { header: 'SKUCode', mandatory: false, get: () => '' },
  { header: 'MRP', mandatory: true, get: ({ product }) => platformPrice(product, 'myntra').mrp },
  { header: 'ISP', mandatory: true, get: ({ product }) => platformPrice(product, 'myntra').price },
  { header: 'AgeGroup', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.ageGroup) || 'Adults-Women' },
  { header: 'Prominent Colour', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.prominentColour) },
  { header: 'Second Prominent Colour', mandatory: false, get: () => '' },
  { header: 'Third Prominent Colour', mandatory: false, get: () => '' },
  { header: 'FashionType', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.fashionType) || 'Fashion' },
  { header: 'Usage', mandatory: false, get: () => '' },
  { header: 'Year', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.year) },
  { header: 'season', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.season) },
  { header: 'AI Label', mandatory: false, get: () => '' },
  { header: 'List View Name', mandatory: false, get: () => '' },
  { header: 'Product Details', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.productDetails) },
  { header: 'styleNote', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.styleNote) },
  { header: 'materialCareDescription', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.materialCareDescription) },
  { header: 'sizeAndFitDescription', mandatory: false, get: () => '' },
  { header: 'productDisplayName', mandatory: false, get: ({ product }) => product.name },
  { header: 'tags', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.tags) },
  { header: 'addedDate', mandatory: false, get: () => '' },
  { header: 'Color Variant GroupId', mandatory: false, get: () => '' },
  { header: 'Top Type', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.topType) },
  { header: 'Bottom Type', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.bottomType) },
  { header: 'Dupatta', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.dupatta) },
  { header: 'Top Pattern', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.topPattern) },
  { header: 'Top Fabric', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.topFabric) },
  { header: 'Top Design Styling', mandatory: false, get: () => '' },
  { header: 'Top Hemline', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.topHemline) },
  { header: 'Top Length', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.topLength) },
  { header: 'Top Shape', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.topShape) },
  { header: 'Neck', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.neck) },
  { header: 'Sleeve Length', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.sleeveLength) },
  { header: 'Sleeve Styling', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.sleeveStyling) },
  { header: 'Slit Detail', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.slitDetail) },
  { header: 'Bottom Fabric', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.bottomFabric) },
  { header: 'Bottom Pattern', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.bottomPattern) },
  { header: 'Bottom Closure', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.bottomClosure) },
  { header: 'Waistband', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.waistband) },
  { header: 'Print or Pattern Type', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.printType) },
  { header: 'Occasion', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.occasion) },
  { header: 'Technique', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.technique) },
  { header: 'Ornamentation', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.ornamentation) },
  { header: 'Weave Pattern', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.weavePattern) },
  { header: 'Weave Type', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.weaveType) },
  { header: 'Pattern Coverage', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.patternCoverage) },
  { header: 'Dupatta Fabric', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.dupattaFabric) },
  { header: 'Dupatta Pattern', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.dupattaPattern) },
  { header: 'Dupatta Border', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.dupattaBorder) },
  { header: 'Wash Care', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.washCare) },
  { header: 'Body or Garment Size', mandatory: false, get: () => 'Garment Measurements in' },
  { header: 'Stitch', mandatory: false, get: ({ product }) => str(product.myntraListingDetail?.stitch) || 'Ready to Wear' },
  { header: 'Add-Ons', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.addOns) },
  { header: 'Sustainable', mandatory: false, get: () => 'Regular' },
  { header: 'Main Trend', mandatory: false, get: () => '' },
  { header: 'Character', mandatory: false, get: () => '' },
  { header: 'Number of Pockets', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.numberOfPockets) },
  { header: 'Number of Items', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.numberOfItems) },
  { header: 'Net Quantity Unit', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.netQuantityUnit) || 'Pieces' },
  { header: 'Theme', mandatory: false, get: () => 'NA' },
  { header: 'Theme 1', mandatory: false, get: () => 'NA' },
  { header: 'Style Tip', mandatory: false, get: () => '' },
  { header: 'Where-to-wear', mandatory: false, get: () => '' },
  { header: 'Package Contains', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.packageContains) },
  { header: 'BIS Expiry Date', mandatory: false, get: () => '' },
  { header: 'BIS Certificate Image URL', mandatory: false, get: () => '' },
  { header: 'BIS Certificate Number', mandatory: false, get: () => '' },
  { header: 'Net Quantity', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.netQuantity) },
  { header: 'Across Shoulder ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.acrossShoulder) },
  { header: 'Bust ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.bust) },
  { header: 'Chest ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.chest) },
  { header: 'Front Length ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.frontLength) },
  { header: 'Hips ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.hips) },
  { header: 'Inseam Length ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.inseamLength) },
  { header: 'Pyjama Waist ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.pyjamaWaist) },
  { header: 'To Fit Waist ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.toFitWaist) },
  { header: 'Waist ( Inches )', mandatory: true, get: ({ product, size }) => num(product.myntraListingDetail?.sizeMeasurements.find(m => m.size === size.size)?.garmentWaist) },
  { header: 'Outseam Length ( Inches )', mandatory: false, get: () => '' },
  { header: 'Sleeve-Length ( Inches )', mandatory: false, get: () => '' },
  { header: 'To Fit Bust ( Inches )', mandatory: false, get: () => '' },
  { header: 'To Fit Chest ( Inches )', mandatory: false, get: () => '' },
  { header: 'Front Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Side Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Back Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Detail Angle', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Look Shot Image', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Additional Image 1', mandatory: false, get: () => MYNTRA_NO_IMAGE },
  { header: 'Additional Image 2', mandatory: false, get: () => MYNTRA_NO_IMAGE },
];

export const MYNTRA_SHEET_GROUP_LABELS: Record<MyntraSheetName, { col: number; label: string }[]> = {
  'Co-Ords': [
    { col: 1, label: 'Business (Information required for Style Creation/Legal Compliance/Order Tracking)' },
    { col: 34, label: 'Discoverability - Attributes required for Product Description and Cataloguing' },
    { col: 75, label: 'Sizing - Mandatory Measurements' },
    { col: 88, label: 'Imagery - Mandatory Image Angles' },
  ],
  'Kurta Sets': [
    { col: 1, label: 'Business (Information required for Style Creation/Legal Compliance/Order Tracking)' },
    { col: 34, label: 'Discoverability - Attributes required for Product Description and Cataloguing' },
    { col: 89, label: 'Sizing - Mandatory Measurements' },
    { col: 102, label: 'Imagery - Mandatory Image Angles' },
  ],
  Dresses: [
    { col: 1, label: 'Business (Information required for Style Creation/Legal Compliance/Order Tracking)' },
    { col: 34, label: 'Discoverability - Attributes required for Product Description and Cataloguing' },
    { col: 89, label: 'Sizing - Mandatory Measurements' },
    { col: 99, label: 'Imagery - Mandatory Image Angles' },
  ],
  Sarees: [
    { col: 1, label: 'Business (Information required for Style Creation/Legal Compliance/Order Tracking)' },
    { col: 34, label: 'Discoverability - Attributes required for Product Description and Cataloguing' },
    { col: 69, label: 'Sizing - Mandatory Measurements' },
    { col: 74, label: 'Imagery - Mandatory Image Angles' },
  ],
};

export function getMyntraColumns(sheet: MyntraSheetName): MyntraColumn[] {
  return sheet === 'Co-Ords' ? CO_ORDS_COLUMNS : sheet === 'Dresses' ? DRESSES_COLUMNS : sheet === 'Kurta Sets' ? KURTA_SETS_COLUMNS : SAREES_COLUMNS;
}
