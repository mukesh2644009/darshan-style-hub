// Heuristic auto-fill for the Myntra Listing Details form. Pure string logic only
// (no DB/server imports) so it can run client-side from the admin product form.
//
// Every field this derives falls into one of three buckets:
//  - filled with no flag:  safe, low-stakes defaults (Age Group, Fashion Type, Year, ...)
//  - filled + reviewFields: a best-effort guess from the product's name/description —
//    right most of the time, but must be checked against Myntra's own allowed values
//    (e.g. articleType/season are controlled-vocabulary dropdowns on Myntra's side;
//    getting the exact string wrong fails their upload even though our own validation
//    would consider the field "filled").
//  - left blank + blockedFields: things we have no source of truth for at all
//    (GTIN, HSN, construction details, wash instructions, tape measurements) — these
//    are never guessed, only flagged, because a wrong GTIN/HSN has real consequences.

export interface MyntraAutofillInput {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  colors: { name: string }[];
}

export interface MyntraAutofillOutcome {
  patch: Record<string, string>;
  reviewFields: string[];
  blockedFields: string[];
}

// Values confirmed from a real submitted Myntra template for a sibling product
// (DSH_CS_03 — same peplum-top/wide-leg-pants block, same S–XXL size run).
// HSN is the tax/customs classification code and stays constant across this whole
// garment category regardless of colour.
const CO_ORD_COMMON_HSN = '62042300';
const FABRIC_VOCAB: Record<string, string> = {
  Viscose: 'Viscose Rayon',
  Rayon: 'Viscose Rayon',
  Cotton: 'Pure Cotton',
};
// Wash Care confirmed business-side for Viscose Rayon items: Hand Wash, not Dry Clean
// (corrected after the DSH_CS_03 reference file's "Dry Clean" was flagged as wrong).
const FABRIC_WASH_CARE: Record<string, string> = {
  'Viscose Rayon': 'Hand Wash',
};

// Same reference product's per-size measurement grid (inches). Co-ord sets across
// this catalog share one tailoring block, so this is a strong starting point —
// always flagged for review since it's not a direct measurement of this SKU.
const CO_ORD_SIZE_CHART: Record<string, { bust: number; chest: number; frontLength: number; garmentWaist: number; inseamLength: number; toFitWaist: number }> = {
  XS: { bust: 34, chest: 34, frontLength: 26, garmentWaist: 26, inseamLength: 28, toFitWaist: 26 },
  S: { bust: 36, chest: 36, frontLength: 27, garmentWaist: 28, inseamLength: 28, toFitWaist: 28 },
  M: { bust: 38, chest: 38, frontLength: 28, garmentWaist: 30, inseamLength: 28, toFitWaist: 30 },
  L: { bust: 40, chest: 40, frontLength: 29, garmentWaist: 32, inseamLength: 28, toFitWaist: 32 },
  XL: { bust: 42, chest: 42, frontLength: 30, garmentWaist: 34, inseamLength: 28, toFitWaist: 34 },
  XXL: { bust: 44, chest: 44, frontLength: 31, garmentWaist: 36, inseamLength: 28, toFitWaist: 36 },
  XXXL: { bust: 46, chest: 46, frontLength: 32, garmentWaist: 38, inseamLength: 28, toFitWaist: 38 },
  'Free Size': { bust: 38, chest: 38, frontLength: 28, garmentWaist: 30, inseamLength: 28, toFitWaist: 30 },
};

export interface CoOrdSizeMeasurementSuggestion {
  size: string;
  bust: string; chest: string; frontLength: string; garmentWaist: string; inseamLength: string; toFitWaist: string;
}

/** Suggests per-size measurements from the shared co-ord tailoring block. Always review-flagged. */
export function deriveCoOrdSizeMeasurements(sizes: string[]): CoOrdSizeMeasurementSuggestion[] {
  return sizes
    .filter((s) => CO_ORD_SIZE_CHART[s])
    .map((s) => {
      const m = CO_ORD_SIZE_CHART[s];
      return {
        size: s,
        bust: String(m.bust), chest: String(m.chest), frontLength: String(m.frontLength),
        garmentWaist: String(m.garmentWaist), inseamLength: String(m.inseamLength), toFitWaist: String(m.toFitWaist),
      };
    });
}

const KNOWN_COLORS = [
  'Off White', 'Olive Green', 'Mehendi Green', 'Navy Blue', 'Royal Blue', 'Teal Blue',
  'Hot Pink', 'Fuchsia Pink', 'Rust Coral', 'Golden', 'Rust', 'Maroon', 'Mauve', 'Mustard',
  'Indigo', 'Coral', 'Peach', 'Cream', 'Beige', 'Lavender', 'Magenta', 'Purple', 'Teal',
  'Green', 'Blue', 'Red', 'Pink', 'Orange', 'Yellow', 'White', 'Grey', 'Black', 'Brown',
];

const FABRIC_KEYWORDS = [
  'Cotton', 'Viscose', 'Rayon', 'Georgette', 'Chiffon', 'Silk', 'Linen',
  'Crepe', 'Net', 'Satin', 'Polyester', 'Modal',
];

function detectColorFromName(name: string): string {
  const lower = name.toLowerCase();
  for (const c of KNOWN_COLORS) {
    if (lower.includes(c.toLowerCase())) return c;
  }
  return '';
}

function detectFabric(text: string): string {
  for (const f of FABRIC_KEYWORDS) {
    if (new RegExp(`\\b${f}\\b`, 'i').test(text)) return f;
  }
  return '';
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function deriveMyntraAutofill(input: MyntraAutofillInput): MyntraAutofillOutcome {
  const { name, description, category, subcategory, colors } = input;
  const coOrd = category === 'Co Ord Sets' || category === 'Summer Co-ord Sets';
  const saree = category === 'Sarees';
  const text = `${name}\n${description}`;

  const patch: Record<string, string> = {};
  const reviewFields: string[] = [];
  const blockedFields: string[] = [];

  const fillConfident = (field: string, val: string) => {
    if (val) patch[field] = val;
  };
  const fillReview = (field: string, val: string) => {
    if (val) {
      patch[field] = val;
      reviewFields.push(field);
    } else {
      blockedFields.push(field);
    }
  };
  const block = (field: string) => blockedFields.push(field);

  // Safe defaults — low risk, easy to correct if wrong.
  fillConfident('sizeLabelPresent', 'Yes');
  fillConfident('ageGroup', 'Adults-Women');
  fillConfident('fashionType', 'Fashion');
  fillConfident('netQuantityUnit', 'Pieces');
  fillConfident('year', String(new Date().getFullYear()));
  fillConfident('styleName', name.split('|')[0].trim());

  // Best-effort guesses — verify before export.
  const color = colors[0]?.name || detectColorFromName(name);
  fillReview('colourRemarks', color);
  fillReview('prominentColour', color);

  // Myntra's season dropdown is only Spring/Summer/Fall/Winter — no "All Season"
  // option, so guessing outside that set would fail their validation, not ours.
  // Default to Winter (confirmed value for this festive/embroidered product family)
  // unless the listing itself is explicitly a summer piece.
  const isSummer = /summer/i.test(category) || /summer/i.test(subcategory || '') || /summer/i.test(description);
  fillReview('season', isSummer ? 'Summer' : 'Winter');
  fillReview('netQuantity', '1');

  // GTIN is never guessed — a wrong barcode is a real business/compliance problem.
  block('gtin');

  if (coOrd) {
    // articleType is just the sheet's constant label for this category, not a
    // per-product guess — same for every Co-Ord Set listing.
    fillConfident('articleType', 'Co-Ords');

    const rawFabric = detectFabric(text);
    const fabric = FABRIC_VOCAB[rawFabric] || rawFabric;
    fillReview('topFabric', fabric);
    fillReview('bottomFabric', fabric);

    // HSN is a fixed tax-classification code for this garment category — confirmed
    // from a real submitted listing — but still flagged since it's a shared default,
    // not looked up per SKU.
    fillReview('hsnCode', CO_ORD_COMMON_HSN);

    const washCare = FABRIC_WASH_CARE[fabric] || '';
    const washMatch = description.match(/\b(dry clean|hand wash|machine wash)[^.\n]*/i);
    if (washCare) fillReview('washCare', washCare);
    else if (washMatch) fillReview('washCare', capitalizeFirst(washMatch[0]));
    else block('washCare');

    const resolvedWashCare = washCare || (washMatch ? capitalizeFirst(washMatch[0]) : '');
    if (fabric && resolvedWashCare) fillReview('materialCareDescription', `100% ${fabric}, ${resolvedWashCare}`);
    else block('materialCareDescription');

    const pkgMatch = description.match(/package contains?:?\s*([^\n]+)/i);
    fillReview('packageContains', pkgMatch ? pkgMatch[1].trim() : '1 Top, 1 Bottom');
    fillReview('numberOfItems', '2');

    block('addOns');
    block('lining');
    block('numberOfPockets');
  } else if (saree) {
    block('washCare');
    block('materialCareDescription');
    block('hsnCode');
    fillReview('articleType', 'Saree');
    fillReview('sareeFabric', detectFabric(text));
    fillReview('blouseIncluded', /blouse/i.test(text) ? 'Unstitched Blouse Piece' : 'No Blouse');
    fillReview('multipackSet', '1');

    block('sareeType');
    block('blouseFabric');
  }

  return { patch, reviewFields, blockedFields };
}

export const MYNTRA_FIELD_LABELS: Record<string, string> = {
  styleName: 'Style Name', articleType: 'Article Type', sizeLabelPresent: 'Size Label Present',
  colourRemarks: 'Brand Colour Remarks', prominentColour: 'Prominent Colour', gtin: 'GTIN',
  hsnCode: 'HSN Code', ageGroup: 'Age Group', fashionType: 'Fashion Type', year: 'Year',
  season: 'Season', materialCareDescription: 'Material Care Description', washCare: 'Wash Care',
  netQuantityUnit: 'Net Quantity Unit', netQuantity: 'Net Quantity', topFabric: 'Top Fabric',
  bottomFabric: 'Bottom Fabric', addOns: 'Add-Ons', lining: 'Lining',
  numberOfPockets: 'Number of Pockets', numberOfItems: 'Number of Items',
  packageContains: 'Package Contains', sareeType: 'Saree Type', sareeFabric: 'Saree Fabric',
  blouseFabric: 'Blouse Fabric', blouseIncluded: 'Blouse Included', multipackSet: 'Multipack Set',
};
