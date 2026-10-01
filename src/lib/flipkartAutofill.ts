// Heuristic auto-fill for Flipkart listing details. Grounded in a real
// reference sheet (Google Sheets "Flipkart_Coordset", shared 2026-09-19) —
// column names and confirmed values below are read directly from it.
//
// Same three-bucket policy as Myntra's autofill (see myntraAutofill.ts):
// confident defaults, best-effort "review" guesses, and never-guessed
// "blocked" fields (GTIN, and the disputed Myntra-HSN column — see below).

import { detectColorFromName, detectFabric, splitDescriptionParagraphAndBullets } from './productTextHeuristics';
import { isKurtaSet } from './flipkart';

export interface FlipkartAutofillInput {
  name: string;
  description: string;
  category: string;
  colors: { name: string }[];
}

export interface FlipkartAutofillOutcome {
  patch: Record<string, string>;
  reviewFields: string[];
  blockedFields: string[];
}

// HSN confirmed from the Flipkart_Coordset reference sheet (DSH_CS_03 row).
const FLIPKART_CO_ORD_HSN = '6204';
const FLIPKART_CATEGORY = 'Coordset';
// Confirmed 2026-09-24 from DSH_CS_03's real LIVE listing via
// GET /sellers/listings/v3/DSH_CS_03 — not a guess. Account-level (same
// seller/warehouse for every product), so these carry over as-is.
const FLIPKART_LOCATION_ID = 'LOCf63da351145f411381b64c10322efe3a';
const FLIPKART_FULFILLMENT_PROFILE = 'NON_FBF';
const FLIPKART_DISPATCH_SLA_HOURS = '24';

// Package weight/dimensions have NO Flipkart-provided default anywhere
// (confirmed blank across every category's template and live Add-Listing UI,
// 2026-09-24) — these are real, product-specific values given by the business,
// not guesses, and are NOT shared across categories (a 2-piece Co-Ord and a
// 3-piece Suit are genuinely different sizes/weights).
const CO_ORD_PACKAGE = { lengthCm: '30', breadthCm: '25', heightCm: '5', weightKg: '0.5' }; // DSH_CS_03, confirmed via live GET
const SUIT_PACKAGE = { lengthCm: '32', breadthCm: '26', heightCm: '6', weightKg: '0.6' }; // DSH_SU_04, given by the business 2026-09-24
const KURTI_PACKAGE = { lengthCm: '35', breadthCm: '28', heightCm: '4', weightKg: '0.45' }; // DSH-BEG-KPS, confirmed via live GET 2026-09-24

// Confirmed from a real, self-validated ("0 errors") Flipkart bulk-template row
// for DSH_SU_04 (salwar_kurta_dupatta category, 2026-09-24).
const FLIPKART_SUIT_HSN = '6204';
const FLIPKART_SUIT_CATEGORY = 'salwar_kurta_dupatta';
// Kurti: HSN/category confirmed from DSH-BEG-KPS's real live listing (already
// active on the account, category "kurta", HSN 6204) — everything else is
// best-effort, not yet QC-tested like Suits/Co-Ord were.
const FLIPKART_KURTI_HSN = '6204';
const FLIPKART_KURTI_CATEGORY = 'kurta';
// Ethnic Set (kurta + bottom, no dupatta — e.g. "Kurta and Palazzo Set") —
// confirmed 2026-09-24 via Flipkart's own Seller Hub category browser as the
// real, distinct category for this garment type (separate from single "kurta"
// and from "salwar_kurta_dupatta" which is for dupatta-included sets). No live
// reference listing yet, so HSN/category are carried over from the same
// apparel HSN precedent; package dims are NOT guessed — see KURTA_SET_PACKAGE.
const FLIPKART_ETHNIC_SET_HSN = '6204';
const FLIPKART_ETHNIC_SET_CATEGORY = 'ethnic_set';
// Given directly by the business 2026-09-24 (not guessed).
const KURTA_SET_PACKAGE: { lengthCm: string; breadthCm: string; heightCm: string; weightKg: string } | null =
  { lengthCm: '30', breadthCm: '25', heightCm: '5', weightKg: '0.45' };

const BOTTOM_TYPE_PATTERNS: [RegExp, string][] = [
  [/palazzo/i, 'Palazzo'],
  [/churidar/i, 'Churidar'],
  [/sharara/i, 'Sharara'],
  [/patiala/i, 'Patiala'],
  [/dhoti/i, 'Dhoti Pant'],
  [/\bpant(s)?\b|trouser/i, 'Pant'],
];

// Values must match Flipkart's fixed Neck dropdown exactly (confirmed 2026-09-24
// via a real QC error: "V-Neck" was rejected, "V Neck" — space, no hyphen — is
// the real allowed value). Full allowed list: Asymmetric Neck, Boat Neck,
// Collared Neck, Halter Neck, High Neck, Key Hole Neck, Mandarin Collar, Round
// Neck, Shawl Collar, Square Neck, Sweetheart Neck, U - Neck, V Neck.
const NECK_PATTERNS: [RegExp, string][] = [
  [/mandarin collar/i, 'Mandarin Collar'],
  [/shirt collar|collared/i, 'Collared Neck'],
  [/round neck/i, 'Round Neck'],
  [/v[- ]?neck|v[- ]?notch/i, 'V Neck'],
  [/boat neck/i, 'Boat Neck'],
  [/square neck/i, 'Square Neck'],
  [/halter neck/i, 'Halter Neck'],
  [/high neck/i, 'High Neck'],
];
// "3/4 Sleeve" (no "th") is the real confirmed-working value for Suits.
const SLEEVE_PATTERNS: [RegExp, string][] = [
  [/sleeveless/i, 'Sleeveless'],
  [/(three[- ]quarter|3\/4(?:th)?)\s*sleeve/i, '3/4 Sleeve'],
  [/half sleeve/i, 'Half Sleeve'],
  [/full sleeve/i, 'Full Sleeve'],
  [/elbow[- ]length/i, 'Elbow Length Sleeve'],
];

// Flipkart's Color field is a strict ~20-value enum, not free text (confirmed
// 2026-09-24: "Olive" was rejected). Maps common ethnic-wear color names to the
// nearest allowed value: Beige, Black, Blue, Brown, Dark Blue, Dark Green, Gold,
// Green, Grey, Light Blue, Light Green, Maroon, Multicolor, Orange, Pink,
// Purple, Red, Silver, White, Yellow.
export const FLIPKART_COLOR_VALUES = [
  'Beige', 'Black', 'Blue', 'Brown', 'Dark Blue', 'Dark Green', 'Gold', 'Green',
  'Grey', 'Light Blue', 'Light Green', 'Maroon', 'Multicolor', 'Orange', 'Pink',
  'Purple', 'Red', 'Silver', 'White', 'Yellow',
];
const FLIPKART_COLOR_ENUM = new Set(FLIPKART_COLOR_VALUES);
export const FLIPKART_NECK_VALUES = [
  'Asymmetric Neck', 'Boat Neck', 'Collared Neck', 'Halter Neck', 'High Neck', 'Key Hole Neck',
  'Mandarin Collar', 'Round Neck', 'Shawl Collar', 'Square Neck', 'Sweetheart Neck', 'U - Neck', 'V Neck',
];
export const FLIPKART_SLEEVE_VALUES = SLEEVE_PATTERNS.map(([, value]) => value);

// Tops ("top" template) use their OWN allowed-value lists — copied verbatim
// from the template's Index sheet (Flipkart-Bulk-Template-Top.xls, downloaded
// 2026-09-24). Note Neck differs from the ethnic templates: "V-Neck" (hyphen),
// "Collared", "U Neck", "Keyhole Neck".
export const FLIPKART_TOP_VALUES = {
  neck: [
    'Asymmetric Neck', 'Boat Neck', 'Choker Neck', 'Cold Shoulder', 'Collared', 'Cowl Collar', 'Halter Neck',
    'Henley', 'High Neck', 'Keyhole Neck', 'Lapel Collar', 'Mandarin Collar', 'Off Shoulder', 'One Shoulder',
    'One Shoulder Neck', 'Peter Pan', 'Pussy Bow Collar', 'Round Neck', 'Ruffle Neck', 'Scoop Neck',
    'Spaghetti Neck', 'Spread Collar', 'Square Neck', 'Strapless', 'Sweetheart Neck', 'Tie-Up', 'U Neck', 'V-Neck',
  ],
  pattern: [
    'Animal Print', 'Checkered', 'Chevron/Zig Zag', 'Color Block', 'Embellished', 'Embossed', 'Embroidered',
    'Ethnic Motifs', 'Floral Print', 'Geometric Print', 'Graphic Print', 'Houndstooth', 'Lace', 'Laser Cut',
    'Ombre', 'Polka Print', 'Printed', 'Self Design', 'Solid', 'Striped', 'Tie & Dye', 'Tribal', 'Washed',
  ],
  fabric: [
    'Acrylic Blend', 'Bamboo', 'Chambray', 'Chiffon', 'Cotton Blend', 'Cotton Linen', 'Cotton Lycra', 'Cotton Silk',
    'Crepe', 'Denim', 'Georgette', 'Hosiery', 'Lace', 'Linen', 'Liva', 'Lycra Blend', 'Lyocell', 'Modal', 'Net',
    'Nylon', 'Polyester', 'Pure Cotton', 'Satin', 'Silk', 'Silk Blend', 'Taffeta', 'Velvet', 'Viscose Rayon', 'Wool',
  ],
  fit: ['Oversized', 'Regular', 'Relaxed', 'Slim', 'Tailored'],
  suitableFor: ['Fusion Wear', 'Maternity Wear', 'Western Wear'],
  occasion: ['Beach Wear', 'Casual', 'Formal', 'Party'],
  sleeveStyle: [
    'Balloon Sleeve', 'Batwing Sleeves', 'Bell Sleeves', 'Bishop Sleeve', 'Butterfly Sleeves', 'Cap Sleeves',
    'Cape Sleeves', 'Cold Shoulder Sleeves', 'Cuffed Sleeves', 'Cutout', 'Dolman Sleeve', 'Extended Sleeves',
    'Flared Sleeves', 'Flute Sleeves', 'Flutter Sleeves', 'Kaftan Sleeve', 'Kimono Sleeves', 'Layered',
    'Noodle Straps', 'Off Shoulder Sleeve', 'One Shoulder Sleeves', 'Petal Sleeves', 'Puff Sleeves',
    'Raglan Sleeves', 'Regular Sleeves', 'Roll Up Sleeves', 'Ruffled Sleeves', 'Shoulder Straps', 'Sleeveless',
    'Slit Sleeves',
  ],
  styleType: [
    'Asymmetric', 'Bardot Top', 'Blouson Top', 'Bodysuit', 'Boxy Top', 'Boyfriend', 'Boyfriend Top', 'Bralette Top',
    'Cami Top', 'Cape Top', 'Cinched Waist Top', 'Crop Top', 'Designer Back Top', 'Empire Waist Top', 'High Low Top',
    'Kaftan Top', 'Kimono Top', 'Layered Top', 'Longline Top', 'Off Shoulder Top', 'Peasant Top', 'Peplum Top',
    'Racerback Top', 'Raglan Top', 'Regular Top', 'Ruffled Top', 'Sheer Top', 'Shirt Style', 'Strappy Top',
    'Swing Top', 'Tank Top', 'Trapeze Top', 'Tube Top', 'Tunic', 'Wrap Top',
  ],
  sleeveLength: ['3/4 Sleeve', 'Full Sleeve', 'Half Sleeve', 'Short Sleeve', 'Sleeveless'],
  topsLength: ['Calf Length', 'Crop', 'Hip Length', 'Knee Length', 'Long'],
};

// Ethnic-template neck names -> Tops' spelling of the same neckline.
const TOP_NECK_FROM_ETHNIC: Record<string, string> = {
  'V Neck': 'V-Neck', 'Collared Neck': 'Collared', 'U - Neck': 'U Neck', 'Key Hole Neck': 'Keyhole Neck',
};
// detectFabric() keyword -> Tops "Brand Fabric" value.
const TOP_FABRIC_FROM_KEYWORD: Record<string, string> = {
  Cotton: 'Pure Cotton', Viscose: 'Viscose Rayon', Rayon: 'Viscose Rayon', Georgette: 'Georgette',
  Chiffon: 'Chiffon', Silk: 'Silk', Linen: 'Linen', Crepe: 'Crepe', Net: 'Net', Satin: 'Satin',
  Polyester: 'Polyester', Modal: 'Modal',
};
const FLIPKART_TOP_CATEGORY = 'top';
// Same precedent as every other apparel category on this account (see
// project memory) — not one of Flipkart's longer 8-digit shortlist codes.
const FLIPKART_TOP_HSN = '6204';
// Package size/weight for all Tops — given directly by the business 2026-09-30
// (not guessed; Flipkart QC treats these as conditionally mandatory).
const TOP_PACKAGE: { lengthCm: string; breadthCm: string; heightCm: string; weightKg: string } | null =
  { lengthCm: '35', breadthCm: '28', heightCm: '4', weightKg: '0.35' };
const COLOR_SYNONYMS: Record<string, string> = {
  olive: 'Green', mustard: 'Yellow', peach: 'Pink', coral: 'Orange', rust: 'Brown',
  wine: 'Maroon', burgundy: 'Maroon', teal: 'Blue', navy: 'Dark Blue', 'navy blue': 'Dark Blue',
  cream: 'Beige', ivory: 'White', offwhite: 'White', 'off white': 'White', magenta: 'Pink',
  turquoise: 'Blue', lavender: 'Purple', indigo: 'Dark Blue', mint: 'Light Green',
  lilac: 'Purple', fuchsia: 'Pink', tan: 'Beige', charcoal: 'Grey', khaki: 'Beige',
  mauve: 'Purple', copper: 'Brown', bronze: 'Gold', rani: 'Pink', mehendi: 'Green',
  'sky blue': 'Light Blue', 'baby pink': 'Pink', 'hot pink': 'Pink', 'bottle green': 'Dark Green',
  'forest green': 'Dark Green', 'wine red': 'Maroon', 'sea green': 'Green', 'pastel green': 'Light Green',
  'pastel pink': 'Pink', 'pastel blue': 'Light Blue',
};
function mapToFlipkartColorEnum(rawColor: string): string {
  if (!rawColor) return '';
  const trimmed = rawColor.trim();
  if (FLIPKART_COLOR_ENUM.has(trimmed)) return trimmed;
  const key = trimmed.toLowerCase();
  if (COLOR_SYNONYMS[key]) return COLOR_SYNONYMS[key];
  const titleCase = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  if (FLIPKART_COLOR_ENUM.has(titleCase)) return titleCase;
  return 'Multicolor'; // safe fallback — always a valid enum value, never guessed further
}

// Any generically-named "Fabric" column (Ethnic Set's "Fabric", Suit's "Kurta
// Fabric") uses this SAME fixed enum — confirmed 2026-09-25 via two separate
// real QC failures on two different categories, both rejecting "100% Cotton"
// and both accepting "Pure Cotton" instead. Distinct from "Top Fabric"/"Bottom
// Fabric" columns, which want the plain material name (e.g. "Cotton") with no
// "100%" prefix and no "Pure" wrapper — confirmed separately via Ethnic Set's
// QC round. Only map fabrics we've seen a confirmed real example value for;
// anything else stays unmapped (blocked) rather than guessed.
const FABRIC_TYPE_ENUM_MAP: Record<string, string> = {
  Cotton: 'Pure Cotton',
  Georgette: 'Georgette',
  Silk: 'Silk Blend',
};

// Flipkart rejects embedded HTML in text fields ("Malicious data present...
// The br tag is not allowed for security reasons" — confirmed 2026-09-24).
// Strip tags and normalize breaks to plain-text separators.
function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function deriveFlipkartAutofill(input: FlipkartAutofillInput): FlipkartAutofillOutcome {
  const { name, description, category, colors } = input;
  const isCoOrd = category === 'Co Ord Sets' || category === 'Summer Co-ord Sets';
  const isSuit = category === 'Suits';
  const isEthnicSet = category === 'Kurtis' && isKurtaSet(name);
  const isKurti = category === 'Kurtis' && !isEthnicSet;
  const isTop = category === 'Tops';
  const text = `${name}\n${description}`;

  const patch: Record<string, string> = {};
  const reviewFields: string[] = [];
  const blockedFields: string[] = [];

  const fillConfident = (field: string, val: string) => { if (val) patch[field] = val; };
  const fillReview = (field: string, val: string) => {
    if (val) { patch[field] = val; reviewFields.push(field); }
    else blockedFields.push(field);
  };
  const block = (field: string) => blockedFields.push(field);

  if (!isCoOrd && !isSuit && !isKurti && !isEthnicSet && !isTop) {
    return { patch, reviewFields: [], blockedFields: ['category'] };
  }

  // Shared account-level constants — same seller/warehouse regardless of
  // category, confirmed 2026-09-24 from DSH_CS_03's real live listing via
  // GET /sellers/listings/v3/DSH_CS_03. Not per-product guesses.
  // fulfilmentBy/procurementType — final confirmed values from a real
  // end-to-end submission that reached "10 Listings Created, 0 Failed"
  // 2026-09-24. Account is self-ship (not FBF-enabled), so 'Fulfilment by'
  // must be the literal value 'Seller' — blank is rejected as a missing
  // mandatory field ("service_profile"), and 'Flipkart' is rejected outright
  // (FBF not available). Once 'Fulfilment by' = 'Seller', both Procurement
  // type AND Procurement SLA become mandatory together (setting only one
  // errors) — 'REGULAR' / '1' are the confirmed working values.
  fillConfident('taxCode', 'GST_APPAREL');
  fillConfident('fulfilmentBy', 'Seller');
  fillConfident('procurementType', 'REGULAR');
  fillConfident('procurementSlaDays', '1');
  fillConfident('locationId', FLIPKART_LOCATION_ID);
  fillConfident('fulfillmentProfile', FLIPKART_FULFILLMENT_PROFILE);
  fillConfident('dispatchSlaHours', FLIPKART_DISPATCH_SLA_HOURS);
  fillConfident('year', String(new Date().getFullYear()));

  // Deterministic text extraction, not a guess — same convention used across
  // this whole catalog's descriptions (marketing paragraph, then bullets).
  // HTML tags (e.g. <br>) are stripped — Flipkart rejects embedded HTML as
  // "malicious data" (confirmed 2026-09-24).
  const { paragraph, bullets } = splitDescriptionParagraphAndBullets(description);
  fillConfident('styleNote', stripHtml(paragraph));
  fillConfident('productDetails', stripHtml(bullets));

  // Best-effort guesses — verify before export. Colour is mapped to Flipkart's
  // strict ~20-value enum (confirmed 2026-09-24: "Olive" was rejected outright).
  // Text detection from the name takes priority over the stored colors[]
  // relation — found via DSH_KP_03 (2026-09-27): its stored colors were
  // [Teal, Green, Black], but the name/description only ever describe it as
  // Green, and colors[0]='Teal' silently won, mapping to the wrong 'Blue'.
  // The name is written specifically for this listing's actual photos/copy,
  // so it's the more reliable signal; colors[] may list variants that aren't
  // what this specific description/listing is about. Still always
  // review-flagged either way — never silently trusted.
  const rawColor = detectColorFromName(name) || colors[0]?.name || '';
  const color = rawColor ? mapToFlipkartColorEnum(rawColor) : '';
  fillReview('colour', color);

  // Search Keywords — real column across Suit/Kurti/Ethnic Set/Co-Ord
  // templates (Multi-Text, "::"-separated, max 5), added 2026-09-25. Not
  // confirmed mandatory anywhere (Suits went live with it blank), so a
  // best-effort suggestion built from the product's own name/category/colour
  // — always review-flagged, never silently trusted.
  const categoryLabel = isSuit ? 'Kurta Set' : isEthnicSet ? 'Kurta Set' : isKurti ? 'Kurti' : isTop ? 'Top' : 'Co-ord Set';
  const nameLead = name.split('|')[0].trim();
  const keywordCandidates = [
    color ? `${color} ${categoryLabel} for Women` : '',
    nameLead.length <= 60 ? nameLead : '',
    'Ethnic Wear for Women',
  ].filter(Boolean).slice(0, 5);
  if (keywordCandidates.length > 0) fillReview('searchKeywords', keywordCandidates.join('::'));
  else block('searchKeywords');

  const fabric = detectFabric(text);
  const fabricLabel = fabric ? `100% ${fabric}` : '';

  const neckMatch = NECK_PATTERNS.find(([re]) => re.test(text));
  const neck = neckMatch ? (isTop ? TOP_NECK_FROM_ETHNIC[neckMatch[1]] ?? neckMatch[1] : neckMatch[1]) : '';
  if (neck) fillReview('neck', neck); else block('neck');

  const pattern = /embroider/i.test(text) ? 'Embroidered' : /print/i.test(text) ? 'Printed' : '';

  if (isCoOrd) {
    fillConfident('category', FLIPKART_CATEGORY);
    fillConfident('hsnFlipkart', FLIPKART_CO_ORD_HSN);
    fillReview('lengthCm', CO_ORD_PACKAGE.lengthCm);
    fillReview('breadthCm', CO_ORD_PACKAGE.breadthCm);
    fillReview('heightCm', CO_ORD_PACKAGE.heightCm);
    fillReview('weightKg', CO_ORD_PACKAGE.weightKg);

    if (color) fillReview('tags', `coordset, ${color.toLowerCase()}`);
    else block('tags');

    if (fabricLabel) {
      fillReview('topFabric', fabricLabel);
      fillReview('bottomFabric', fabricLabel);
      fillReview('materialCareDescription', fabricLabel);
    } else {
      block('topFabric');
      block('bottomFabric');
      block('materialCareDescription');
    }

    fillReview('netQuantity', '2');
    fillReview('packageContains', '1 Top, 1 Bottom');

    const sleeveMatch = SLEEVE_PATTERNS.find(([re]) => re.test(text));
    if (sleeveMatch) fillReview('sleeveLength', sleeveMatch[1]); else block('sleeveLength');

    if (pattern) {
      fillReview('topPattern', pattern);
      fillReview('bottomPattern', pattern);
    } else {
      block('topPattern');
      block('bottomPattern');
    }
    block('topType');
    block('bottomType');
    block('occasion');
  } else if (isSuit) {
    // Suits (salwar_kurta_dupatta on Flipkart) — confirmed from a real,
    // self-validated ("0 errors") DSH_SU_04 bulk-template row, 2026-09-24.
    fillConfident('category', FLIPKART_SUIT_CATEGORY);
    fillConfident('hsnFlipkart', FLIPKART_SUIT_HSN);
    fillConfident('topType', 'Kurta');
    fillConfident('ageGroup', 'Women'); // Flipkart's "Ideal For" field
    fillConfident('netQuantity', '3'); // kurta + bottom + dupatta
    fillReview('lengthCm', SUIT_PACKAGE.lengthCm);
    fillReview('breadthCm', SUIT_PACKAGE.breadthCm);
    fillReview('heightCm', SUIT_PACKAGE.heightCm);
    fillReview('weightKg', SUIT_PACKAGE.weightKg);

    if (fabricLabel) fillReview('materialCareDescription', fabricLabel); else block('materialCareDescription');
    if (/dupatta/i.test(text)) fillReview('packageContains', '1 Kurta, 1 Bottom, 1 Dupatta');
    else block('packageContains');

    if (pattern) fillReview('topPattern', pattern); else block('topPattern');

    // "Sleeve", "Shape Type", "Occasion", "Kurta Fabric", and "Suitable For"
    // are mandatory at Flipkart's real server-side QC, even though Excel's own
    // "Fast Validate" macro doesn't flag them (confirmed 2026-09-24 via a real
    // submission that failed QC with these blank — the earlier "0 errors" file
    // only passed local format checks, not full server-side QC).
    const sleeveMatch = SLEEVE_PATTERNS.find(([re]) => re.test(text));
    fillReview('sleeveLength', sleeveMatch ? sleeveMatch[1] : 'Full Sleeve');
    fillReview('shapeType', 'Straight');
    fillReview('occasion', 'Casual');
    // "Kurta Fabric" is Suit's real column name for this concept — we reuse the
    // generic topFabric DB field for it (topType is always 'Kurta' for Suits).
    // Confirmed 2026-09-25 via real QC failure: this field wants the same fixed
    // enum as Ethnic Set's "Fabric" ("Pure Cotton"), NOT "100% Cotton" — despite
    // the earlier "0 errors" reference file suggesting free text was fine (that
    // was only local format validation, not the real server-side QC).
    const suitFabricType = fabric ? FABRIC_TYPE_ENUM_MAP[fabric] : undefined;
    if (suitFabricType) fillReview('topFabric', suitFabricType); else block('topFabric');
    // Strict 3-value enum (Ethnic Wear / Fusion Wear / Maternity Wear) — every
    // product in this category is an ethnic kurta/dupatta set.
    fillConfident('suitableFor', 'Ethnic Wear');

    // Confirmed mandatory via real QC failure 2026-09-25 (left blank, rejected)
    // — real accepted value is "Trouser", not "Pant" (Ethnic Set's Bottom Type
    // uses "Pant" instead — each category has its own separate enum here too).
    const suitBottomMatch = BOTTOM_TYPE_PATTERNS.find(([re]) => re.test(text));
    if (suitBottomMatch) fillReview('bottomType', suitBottomMatch[1] === 'Pant' ? 'Trouser' : suitBottomMatch[1]);
    else block('bottomType');
    block('bottomPattern');
    // Flipkart's real Suit fields are "Salwar Fabric"/"Dupatta Fabric" —
    // distinct from "Kurta Fabric" above, and we don't have matching columns
    // yet, so these stay explicitly flagged rather than silently unset.
    block('bottomFabric');
    block('tags');
  } else if (isKurti) {
    // Kurtis (single-piece "kurta" on Flipkart) — HSN/category/package dims
    // confirmed from DSH-BEG-KPS's real live listing, 2026-09-24. Everything
    // else follows the same real-QC-confirmed pattern as Suits as a best-effort
    // starting point — not yet independently QC-tested for this category.
    fillConfident('category', FLIPKART_KURTI_CATEGORY);
    fillConfident('hsnFlipkart', FLIPKART_KURTI_HSN);
    fillConfident('topType', 'Kurta');
    fillConfident('ageGroup', 'Women');
    fillConfident('netQuantity', '1'); // single garment, no components
    fillConfident('packOf', '1');
    fillReview('lengthCm', KURTI_PACKAGE.lengthCm);
    fillReview('breadthCm', KURTI_PACKAGE.breadthCm);
    fillReview('heightCm', KURTI_PACKAGE.heightCm);
    fillReview('weightKg', KURTI_PACKAGE.weightKg);

    if (fabricLabel) fillReview('materialCareDescription', fabricLabel); else block('materialCareDescription');
    if (pattern) fillReview('topPattern', pattern); else block('topPattern');

    const sleeveMatch = SLEEVE_PATTERNS.find(([re]) => re.test(text));
    fillReview('sleeveLength', sleeveMatch ? sleeveMatch[1] : 'Full Sleeve');
    fillReview('shapeType', 'Straight');
    fillReview('occasion', 'Casual');
    if (fabricLabel) fillReview('topFabric', fabricLabel); else block('topFabric');
    fillConfident('suitableFor', 'Ethnic Wear');
    fillReview('attachedDupatta', 'No');
    fillReview('pockets', /pocket/i.test(text) ? 'Yes' : 'No');

    block('bottomType');
    block('bottomPattern');
    block('bottomFabric');
    block('packageContains'); // not a real column for single-piece Kurtis
    block('tags');
  } else if (isTop) {
    // Tops ("top" on Flipkart) — mandatory fields (blue header cells) and
    // allowed values read from Flipkart's own template, 2026-09-30. Not yet
    // QC-tested: every guess is review-flagged, enums only from FLIPKART_TOP_VALUES.
    fillConfident('category', FLIPKART_TOP_CATEGORY);
    fillConfident('hsnFlipkart', FLIPKART_TOP_HSN);
    fillConfident('ageGroup', 'Women'); // "Ideal For" — only allowed value
    fillConfident('packOf', '1');
    if (TOP_PACKAGE) {
      fillReview('lengthCm', TOP_PACKAGE.lengthCm);
      fillReview('breadthCm', TOP_PACKAGE.breadthCm);
      fillReview('heightCm', TOP_PACKAGE.heightCm);
      fillReview('weightKg', TOP_PACKAGE.weightKg);
    } else {
      block('lengthCm'); block('breadthCm'); block('heightCm'); block('weightKg');
    }

    const topFabric = fabric ? TOP_FABRIC_FROM_KEYWORD[fabric] ?? '' : '';
    if (topFabric) fillReview('fabricType', topFabric); else block('fabricType');
    if (fabricLabel) fillReview('materialCareDescription', fabricLabel); else block('materialCareDescription');

    const topPattern = /floral/i.test(text) ? 'Floral Print'
      : /paisley|block print|ethnic motif|bandhani/i.test(text) ? 'Ethnic Motifs'
      : /embroider/i.test(text) ? 'Embroidered'
      : /print/i.test(text) ? 'Printed'
      : /solid|plain/i.test(text) ? 'Solid' : '';
    fillReview('topPattern', topPattern);

    const sleeveMatch = SLEEVE_PATTERNS.find(([re]) => re.test(text));
    const sleeveLength = sleeveMatch?.[1] === 'Elbow Length Sleeve' ? 'Half Sleeve' : sleeveMatch?.[1] ?? '';
    fillReview('sleeveLength', sleeveLength);
    fillReview('sleeveStyle', sleeveLength === 'Sleeveless' ? 'Sleeveless'
      : /bell sleeve/i.test(text) ? 'Bell Sleeves'
      : /puff sleeve/i.test(text) ? 'Puff Sleeves'
      : /flared sleeve/i.test(text) ? 'Flared Sleeves'
      : 'Regular Sleeves');

    // "Style Type" — reuses the shapeType column.
    fillReview('shapeType', /tunic/i.test(text) ? 'Tunic'
      : /peplum/i.test(text) ? 'Peplum Top'
      : /kaftan/i.test(text) ? 'Kaftan Top'
      : /crop top/i.test(text) ? 'Crop Top'
      : 'Regular Top');
    fillReview('fit', 'Regular');
    fillReview('occasion', 'Casual');
    // Kurti-style tops (ethnic prints) are "Fusion Wear"; plain western tops "Western Wear".
    fillReview('suitableFor', /kurti|ethnic|block print|paisley|bandhani/i.test(text) ? 'Fusion Wear' : 'Western Wear');
    block('topsLength'); // recommended only — AI Fill can judge it from photos

    block('topType'); block('bottomType'); block('bottomPattern'); block('bottomFabric');
    block('packageContains'); block('tags');
  } else {
    // Ethnic Set (kurta + bottom, no dupatta — e.g. "Kurta and Palazzo Set")
    // — category confirmed real via Flipkart's Seller Hub category browser,
    // 2026-09-24. No live reference listing exists yet for this category
    // (unlike Suit/Kurti), so this is a first-draft best effort, more
    // provisional than Suits/Kurtis — expect a real QC round to correct it.
    fillConfident('category', FLIPKART_ETHNIC_SET_CATEGORY);
    fillConfident('hsnFlipkart', FLIPKART_ETHNIC_SET_HSN);
    fillConfident('topType', 'Kurta');
    fillConfident('ageGroup', 'Women');

    const dupattaIncluded = /dupatta/i.test(text);
    fillConfident('netQuantity', dupattaIncluded ? '3' : '2');
    fillReview('packageContains', dupattaIncluded ? '1 Kurta, 1 Bottom, 1 Dupatta' : '1 Kurta, 1 Bottom');

    // Package dims genuinely unknown for this category — never guessed, left
    // blocked until the business provides real measured values (see
    // KURTA_SET_PACKAGE — deliberately null).
    if (KURTA_SET_PACKAGE) {
      fillReview('lengthCm', KURTA_SET_PACKAGE.lengthCm);
      fillReview('breadthCm', KURTA_SET_PACKAGE.breadthCm);
      fillReview('heightCm', KURTA_SET_PACKAGE.heightCm);
      fillReview('weightKg', KURTA_SET_PACKAGE.weightKg);
    } else {
      block('lengthCm'); block('breadthCm'); block('heightCm'); block('weightKg');
    }

    const bottomMatch = BOTTOM_TYPE_PATTERNS.find(([re]) => re.test(text));
    if (bottomMatch) fillReview('bottomType', bottomMatch[1]); else block('bottomType');

    // Top Fabric/Bottom Fabric want the plain fabric name (e.g. "Cotton") —
    // NOT the "100% X" form (confirmed rejected via real QC, 2026-09-24).
    // "Fabric" (the general column) has yet another, separate enum — mapped
    // via FABRIC_TYPE_ENUM_MAP, only for fabrics we've confirmed a real
    // working value for.
    if (fabric) {
      fillReview('topFabric', fabric);
      fillReview('bottomFabric', fabric);
      fillReview('materialCareDescription', fabricLabel);
      const fabricType = FABRIC_TYPE_ENUM_MAP[fabric];
      if (fabricType) fillReview('fabricType', fabricType); else block('fabricType');
    } else {
      block('topFabric');
      block('bottomFabric');
      block('materialCareDescription');
      block('fabricType');
    }

    if (pattern) fillReview('topPattern', pattern); else block('topPattern');

    const sleeveMatch = SLEEVE_PATTERNS.find(([re]) => re.test(text));
    fillReview('sleeveLength', sleeveMatch ? sleeveMatch[1] : 'Full Sleeve');
    fillReview('shapeType', 'Straight');
    fillReview('occasion', 'Casual');

    block('bottomPattern');
    block('tags');
  }

  // Never guessed:
  block('gtin');
  // The reference sheet's "HSN Code - Myntra (8-digit)" (62042990) conflicts
  // with the actual submitted Myntra file for the same product (62042300) —
  // needs a business decision, not a guess either way.
  block('hsnMyntra');
  block('fashionType');
  block('season');

  return { patch, reviewFields, blockedFields };
}

export const FLIPKART_FIELD_LABELS: Record<string, string> = {
  category: 'Category', colour: 'Colour', gtin: 'GTIN', hsnFlipkart: 'HSN Code (Flipkart)',
  hsnMyntra: 'HSN Code (Myntra, disputed)', taxCode: 'Tax Code',
  materialCareDescription: 'Material Care Description', topFabric: 'Top Fabric', bottomFabric: 'Bottom Fabric',
  netQuantity: 'Net Quantity', packageContains: 'Package Contains',
  lengthCm: 'Length (cm)', breadthCm: 'Breadth (cm)', heightCm: 'Height (cm)', weightKg: 'Weight (kg)',
  fulfilmentBy: 'Fulfilment By', procurementType: 'Procurement Type', procurementSlaDays: 'Procurement SLA (days)',
  locationId: 'Location ID', fulfillmentProfile: 'Fulfillment Profile', dispatchSlaHours: 'Dispatch SLA (hours)',
  topType: 'Top Type', bottomType: 'Bottom Type', neck: 'Neck', sleeveLength: 'Sleeve Length',
  topPattern: 'Top Pattern', bottomPattern: 'Bottom Pattern', occasion: 'Occasion',
  ageGroup: 'Age Group', fashionType: 'Fashion Type', season: 'Season', year: 'Year',
  productDetails: 'Product Details / Key Features', styleNote: 'Style Note / Description', tags: 'Tags',
  shapeType: 'Shape Type', suitableFor: 'Suitable For',
  pockets: 'Pockets', packOf: 'Pack of', attachedDupatta: 'Attached Dupatta',
  fabricType: 'Fabric',
  searchKeywords: 'Search Keywords',
  fit: 'Fit', sleeveStyle: 'Sleeve Style', topsLength: 'Tops Length',
};
