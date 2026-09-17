import type { Product, ProductSize, ProductColor, MyntraListingDetail, MyntraSizeMeasurement } from '@prisma/client';
import { normalizeProductImageUrl } from './productImageUrl';

// Store-wide constants — same for every product, so these are not stored as
// per-product fields on MyntraListingDetail.
export const MYNTRA_BRAND = 'Darshan Style Hub';
export const MYNTRA_BUSINESS_ADDRESS =
  'Darshan Style Hub, Plot Number B-11, Shri Ram Vihar-B, Shri Kishanpura, Sanganer, Jaipur, Rajasthan, 302017';
export const MYNTRA_COUNTRY_OF_ORIGIN = 'India';

const SITE_BASE_URL = 'https://www.darshanstylehub.com';

export type MyntraSheetName = 'Co-Ords' | 'Sarees';

/** Which Myntra bulk-upload sheet a product's category maps to, or null if unsupported. */
export function getMyntraSheetName(productCategory: string): MyntraSheetName | null {
  if (productCategory === 'Sarees') return 'Sarees';
  if (productCategory === 'Co Ord Sets' || productCategory === 'Summer Co-ord Sets') return 'Co-Ords';
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
      label: `Category "${product.category}" is not supported for Myntra export (only Co Ord Sets, Summer Co-ord Sets and Sarees are supported)`,
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
  req(d?.gtin, 'gtin', 'GTIN');
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
}

function absoluteImageUrl(url: string | undefined): string {
  if (!url) return '';
  const normalized = normalizeProductImageUrl(url);
  if (!normalized) return '';
  return /^https?:\/\//i.test(normalized) ? normalized : `${SITE_BASE_URL}${normalized}`;
}

interface CategorizedImages {
  front: string;
  side: string;
  back: string;
  detail: string;
  lookShot: string;
  additional: string[];
}

/**
 * Myntra wants specific image angles (Front/Side/Back/Detail/Look Shot) in
 * fixed columns, but our own upload order doesn't guarantee that layout.
 * Filenames from the product photo shoot carry angle hints (e.g.
 * "..._back_side_photo_...", "..._detail_photo_...") — use those to place
 * each image in the right column, falling back to upload order only when no
 * filename gives a hint at all. "back" is checked before "side" so a file
 * like "back_side_photo" (a back-angle shot) lands in Back, not Side.
 */
function categorizeProductImages(images: { url: string }[]): CategorizedImages {
  const result: CategorizedImages = { front: '', side: '', back: '', detail: '', lookShot: '', additional: [] };
  const unmatched: string[] = [];

  for (const img of images) {
    const name = (img.url.split('/').pop() || '').toLowerCase();
    if (!result.back && /back/.test(name)) {
      result.back = img.url;
    } else if (!result.front && /(front|main)/.test(name)) {
      result.front = img.url;
    } else if (!result.side && /side/.test(name)) {
      result.side = img.url;
    } else if (!result.detail && /detail/.test(name)) {
      result.detail = img.url;
    } else if (!result.lookShot && /(lifestyle|look)/.test(name)) {
      result.lookShot = img.url;
    } else {
      unmatched.push(img.url);
    }
  }

  const anyKeywordMatched = result.front || result.side || result.back || result.detail || result.lookShot;
  if (!anyKeywordMatched && images.length > 0) {
    const urls = images.map((i) => i.url);
    const [first, second, third, fourth, fifth, ...rest] = urls;
    return { front: first || '', side: second || '', back: third || '', detail: fourth || '', lookShot: fifth || '', additional: rest };
  }

  if (!result.front && images.length > 0) result.front = images[0].url;

  result.additional = unmatched.filter((u) => u !== result.front);
  return result;
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
  { header: 'styleGroupId', mandatory: true, get: ({ product }) => product.sku },
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
  { header: 'MRP', mandatory: true, get: ({ product }) => product.originalPrice ?? product.price },
  { header: 'ISP', mandatory: true, get: ({ product }) => product.price },
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
  { header: 'Occasion', mandatory: false, get: () => '' },
  { header: 'Sleeve Length', mandatory: false, get: () => '' },
  { header: 'Neck', mandatory: false, get: () => '' },
  { header: 'Top Fabric', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.topFabric) },
  { header: 'Bottom Fabric', mandatory: true, get: ({ product }) => str(product.myntraListingDetail?.bottomFabric) },
  { header: 'Top Type', mandatory: false, get: () => '' },
  { header: 'Bottom Type', mandatory: false, get: () => '' },
  { header: 'Top Pattern', mandatory: false, get: () => '' },
  { header: 'Bottom Pattern', mandatory: false, get: () => '' },
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
  { header: 'Front Image', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).front) },
  { header: 'Side Image', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).side) },
  { header: 'Back Image', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).back) },
  { header: 'Detail Angle', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).detail) },
  { header: 'Look Shot Image', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).lookShot) },
  { header: 'Additional Image 1', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).additional[0]) },
  { header: 'Additional Image 2', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).additional[1]) },
];

// Column order/headers below are read directly from row 3 of Myntra's official
// "Sarees" bulk-upload template sheet — do not reorder.
export const SAREES_COLUMNS: MyntraColumn[] = [
  { header: 'styleId', mandatory: false, get: () => '' },
  { header: 'styleGroupId', mandatory: true, get: ({ product }) => product.sku },
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
  { header: 'MRP', mandatory: true, get: ({ product }) => product.originalPrice ?? product.price },
  { header: 'ISP', mandatory: true, get: ({ product }) => product.price },
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
  { header: 'Front Image', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).front) },
  { header: 'Side Image', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).side) },
  { header: 'Back Image', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).back) },
  { header: 'Detail Angle', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).detail) },
  { header: 'Look Shot Image', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).lookShot) },
  { header: 'Additional Image 1', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).additional[0]) },
  { header: 'Additional Image 2', mandatory: false, get: ({ product }) => absoluteImageUrl(categorizeProductImages(product.images).additional[1]) },
];

export const MYNTRA_SHEET_GROUP_LABELS: Record<MyntraSheetName, { col: number; label: string }[]> = {
  'Co-Ords': [
    { col: 1, label: 'Business (Information required for Style Creation/Legal Compliance/Order Tracking)' },
    { col: 34, label: 'Discoverability - Attributes required for Product Description and Cataloguing' },
    { col: 75, label: 'Sizing - Mandatory Measurements' },
    { col: 88, label: 'Imagery - Mandatory Image Angles' },
  ],
  Sarees: [
    { col: 1, label: 'Business (Information required for Style Creation/Legal Compliance/Order Tracking)' },
    { col: 34, label: 'Discoverability - Attributes required for Product Description and Cataloguing' },
    { col: 69, label: 'Sizing - Mandatory Measurements' },
    { col: 74, label: 'Imagery - Mandatory Image Angles' },
  ],
};

export function getMyntraColumns(sheet: MyntraSheetName): MyntraColumn[] {
  return sheet === 'Co-Ords' ? CO_ORDS_COLUMNS : SAREES_COLUMNS;
}
