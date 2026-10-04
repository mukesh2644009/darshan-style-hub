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

import { detectColorFromName, detectFabric, capitalizeFirst } from './productTextHeuristics';
import { toMyntraFabric, MYNTRA_DRESSES_VALUES, MYNTRA_KURTA_SETS_VALUES } from './myntraValues';

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

// Standard women's dress block (garment inches) for Myntra Dresses — the user
// asked for standard measurements (2026-10-04). Front Length depends on the
// dress length, rising 0.5" per size so the values ascend as Myntra requires.
// Always review-flagged: not measured from the actual SKU.
const DRESS_SIZE_CHART: Record<string, { bust: number; hips: number; garmentWaist: number; step: number }> = {
  XS: { bust: 34, hips: 36, garmentWaist: 28, step: 0 },
  S: { bust: 36, hips: 38, garmentWaist: 30, step: 1 },
  M: { bust: 38, hips: 40, garmentWaist: 32, step: 2 },
  L: { bust: 40, hips: 42, garmentWaist: 34, step: 3 },
  XL: { bust: 42, hips: 44, garmentWaist: 36, step: 4 },
  XXL: { bust: 44, hips: 46, garmentWaist: 38, step: 5 },
  XXXL: { bust: 46, hips: 48, garmentWaist: 40, step: 6 },
  'Free Size': { bust: 38, hips: 40, garmentWaist: 32, step: 2 },
};
const DRESS_FRONT_LENGTH: Record<string, number> = { Mini: 33, 'Above Knee': 35, 'Knee Length': 38, Midi: 45, Maxi: 53 };

export interface DressSizeMeasurementSuggestion {
  size: string;
  bust: string; chest: string; frontLength: string; hips: string; garmentWaist: string;
}

/** Suggests per-size dress measurements from the standard block. Always review-flagged. */
export function deriveDressSizeMeasurements(sizes: string[], dressLength: string): DressSizeMeasurementSuggestion[] {
  const base = DRESS_FRONT_LENGTH[dressLength] ?? DRESS_FRONT_LENGTH['Knee Length'];
  return sizes
    .filter((s) => DRESS_SIZE_CHART[s])
    .map((s) => {
      const m = DRESS_SIZE_CHART[s];
      return {
        size: s,
        bust: String(m.bust), chest: String(m.bust), hips: String(m.hips), garmentWaist: String(m.garmentWaist),
        frontLength: String(base + m.step * 0.5),
      };
    });
}

/** Dress length from the name/description, as Myntra's "Length" value. */
export function detectDressLength(text: string): string {
  return /maxi|floor[- ]length|full[- ]length/i.test(text) ? 'Maxi'
    : /midi|calf/i.test(text) ? 'Midi'
    : /knee[- ]length/i.test(text) ? 'Knee Length'
    : /above[- ]knee|mid[- ]thigh/i.test(text) ? 'Above Knee'
    : /\bmini\b/i.test(text) ? 'Mini' : '';
}

// Kurta-set size chart (garment inches) copied from the DSH_SU_04/05 upload Myntra
// accepted (job 1695788, catalogued 21 Sep 2026); XS and XXXL extended one step.
// Always review-flagged: not measured from the actual SKU.
const KURTA_SET_SIZE_CHART: Record<string, { acrossShoulder: number; bust: number; chest: number; frontLength: number; hips: number; inseamLength: number; pyjamaWaist: number; toFitWaist: number; garmentWaist: number }> = {
  XS: { acrossShoulder: 13, bust: 32, chest: 32, frontLength: 43.5, hips: 34, inseamLength: 38.5, pyjamaWaist: 26, toFitWaist: 26, garmentWaist: 24 },
  S: { acrossShoulder: 13.5, bust: 34, chest: 34, frontLength: 44, hips: 36, inseamLength: 39, pyjamaWaist: 28, toFitWaist: 28, garmentWaist: 26 },
  M: { acrossShoulder: 14, bust: 36, chest: 36, frontLength: 44, hips: 38, inseamLength: 39, pyjamaWaist: 30, toFitWaist: 30, garmentWaist: 28 },
  L: { acrossShoulder: 14.5, bust: 38, chest: 38, frontLength: 45, hips: 40, inseamLength: 39.5, pyjamaWaist: 32, toFitWaist: 32, garmentWaist: 30 },
  XL: { acrossShoulder: 15, bust: 40, chest: 40, frontLength: 45, hips: 42, inseamLength: 39.5, pyjamaWaist: 34, toFitWaist: 34, garmentWaist: 32 },
  XXL: { acrossShoulder: 15.5, bust: 42, chest: 42, frontLength: 46, hips: 44, inseamLength: 40, pyjamaWaist: 36, toFitWaist: 36, garmentWaist: 34 },
  XXXL: { acrossShoulder: 16, bust: 44, chest: 44, frontLength: 46, hips: 46, inseamLength: 40, pyjamaWaist: 38, toFitWaist: 38, garmentWaist: 36 },
};

export type KurtaSetMeasurementSuggestion = { size: string } & Record<'acrossShoulder' | 'bust' | 'chest' | 'frontLength' | 'hips' | 'inseamLength' | 'pyjamaWaist' | 'toFitWaist' | 'garmentWaist', string>;

/** Per-size kurta-set measurements from the accepted SU_04/05 chart. Always review-flagged. */
export function deriveKurtaSetSizeMeasurements(sizes: string[]): KurtaSetMeasurementSuggestion[] {
  return sizes
    .filter((s) => KURTA_SET_SIZE_CHART[s])
    .map((s) => {
      const m = KURTA_SET_SIZE_CHART[s];
      return {
        size: s,
        acrossShoulder: String(m.acrossShoulder), bust: String(m.bust), chest: String(m.chest), frontLength: String(m.frontLength),
        hips: String(m.hips), inseamLength: String(m.inseamLength), pyjamaWaist: String(m.pyjamaWaist),
        toFitWaist: String(m.toFitWaist), garmentWaist: String(m.garmentWaist),
      };
    });
}

export function deriveMyntraAutofill(input: MyntraAutofillInput): MyntraAutofillOutcome {
  const { name, description, category, subcategory, colors } = input;
  const coOrd = category === 'Co Ord Sets' || category === 'Summer Co-ord Sets';
  const saree = category === 'Sarees';
  const dress = category === 'Western Dress';
  const kurtaSet = category === 'Suits';
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

  // GTIN is never guessed — a wrong barcode is a real business/compliance problem.
  block('gtin');

  if (coOrd) {
    // articleType is just the sheet's constant label for this category, not a
    // per-product guess — same for every Co-Ord Set listing.
    fillConfident('articleType', 'Co-Ords');

    // Only ever store a value from Myntra's own list — a raw word like
    // "Georgette" would be rejected after upload.
    const rawFabric = detectFabric(text);
    const fabric = toMyntraFabric(rawFabric, 'topFabric');
    fillReview('topFabric', fabric);
    fillReview('bottomFabric', toMyntraFabric(rawFabric, 'bottomFabric'));

    // HSN is a fixed tax-classification code for this garment category — confirmed
    // from a real submitted listing — but still flagged since it's a shared default,
    // not looked up per SKU.
    fillReview('hsnCode', CO_ORD_COMMON_HSN);

    const washCare = FABRIC_WASH_CARE[fabric] || '';
    // Myntra's Wash Care is a 3-value dropdown — store the canonical value, not
    // the description's full phrase ("Hand wash in cold water" is rejected).
    // Same "Hand Wash if not stated" default the AI Fill uses.
    const washMatch = description.match(/\b(dry clean|hand wash|machine wash)/i);
    const resolvedWashCare = washCare || (washMatch
      ? washMatch[1].toLowerCase().split(' ').map(capitalizeFirst).join(' ')
      : 'Hand Wash');
    fillReview('washCare', resolvedWashCare);
    if (fabric && resolvedWashCare) fillReview('materialCareDescription', `100% ${fabric}, ${resolvedWashCare}`);
    else block('materialCareDescription');

    const pkgMatch = description.match(/package contains?:?\s*([^\n]+)/i);
    fillReview('packageContains', pkgMatch ? pkgMatch[1].trim() : '1 Top, 1 Bottom');
    // Confirmed from DSH_CS_03: Net Quantity matches Number of Items for a co-ord
    // set (both count pieces in the pack) — was wrongly defaulted to '1' before.
    fillReview('numberOfItems', '2');
    fillReview('netQuantity', '2');

    // Myntra requires *something* in these columns, but "NA" is a valid, confirmed
    // answer when the garment genuinely has none — safe default, still flagged to
    // verify in case a specific product actually does have add-ons/lining/pockets.
    fillReview('addOns', 'NA');
    fillReview('lining', 'NA');
    fillReview('numberOfPockets', 'NA');
  } else if (kurtaSet) {
    // Myntra "Kurta Sets" sheet — mandatory = yellow header cells. Defaults
    // follow the accepted DSH_SU_04/05 upload; values only from
    // MYNTRA_KURTA_SETS_VALUES, guesses review-flagged.
    const V = MYNTRA_KURTA_SETS_VALUES;
    const ok = (field: string, v: string) => (V[field]?.includes(v) ? v : '');
    fillConfident('articleType', 'Kurta Sets');
    if (patch.prominentColour && !V.prominentColour.includes(patch.prominentColour)) {
      const lc = patch.prominentColour.toLowerCase();
      const match = V.prominentColour
        .filter((c) => c !== 'NA' && lc.includes(c.toLowerCase()))
        .sort((a, b) => b.length - a.length || lc.indexOf(a.toLowerCase()) - lc.indexOf(b.toLowerCase()))[0];
      if (match) patch.prominentColour = match; else { delete patch.prominentColour; block('prominentColour'); }
    }

    const raw = detectFabric(text);
    const fab = (field: string) => ok(field, /viscose|rayon/i.test(raw) ? 'Viscose Rayon' : /cotton|jamdani|mulmul/i.test(raw) ? 'Pure Cotton'
      : /georgette/i.test(raw) ? 'Georgette' : /chanderi/i.test(raw) ? 'Chanderi Cotton' : /linen/i.test(raw) ? 'Linen'
      : /silk/i.test(raw) ? 'Silk Blend' : /polyester/i.test(raw) ? 'Polyester' : '');
    const hasDupatta = /dupatta/i.test(text);
    fillReview('topFabric', fab('topFabric'));
    fillReview('bottomFabric', fab('bottomFabric'));
    fillReview('dupatta', hasDupatta ? 'With Dupatta' : 'NA');
    fillReview('dupattaFabric', hasDupatta ? fab('dupattaFabric') : 'NA');
    fillReview('dupattaPattern', hasDupatta ? (/embroider/i.test(text) ? 'Embroidered' : /print/i.test(text) ? 'Printed' : 'Solid') : 'NA');
    fillReview('dupattaBorder', hasDupatta ? (/tassel/i.test(text) ? 'Tassels' : patch.dupattaPattern === 'Printed' ? 'Printed' : 'Solid') : 'NA');
    fillReview('hsnCode', CO_ORD_COMMON_HSN); // 62042300 — same code as the accepted SU_04/05 upload

    const washMatch = description.match(/\b(dry clean|hand wash|machine wash)/i);
    const washCare = washMatch ? washMatch[1].toLowerCase().split(' ').map(capitalizeFirst).join(' ') : 'Hand Wash';
    fillReview('washCare', washCare);
    if (patch.topFabric) fillReview('materialCareDescription', `100% ${raw || patch.topFabric}, ${washCare}`); else block('materialCareDescription');

    fillReview('topType', /kurti\b/i.test(text) ? 'Kurti' : 'Kurta');
    const bottom = /palazzo/i.test(text) ? 'Palazzos' : /sharara/i.test(text) ? 'Sharara' : /churidar/i.test(text) ? 'Churidar'
      : /patiala/i.test(text) ? 'Patiala' : /salwar/i.test(text) ? 'Salwar' : /skirt/i.test(text) ? 'Skirt' : 'Trousers';
    fillReview('bottomType', bottom);
    fillReview('topShape', /anarkali/i.test(text) ? 'Anarkali' : /a[- ]line/i.test(text) ? 'A-Line' : /kaftan/i.test(text) ? 'Kaftan' : 'Straight');
    fillReview('topLength', /anarkali|calf/i.test(text) ? 'Calf Length' : /floor/i.test(text) ? 'Floor Length' : 'Knee Length');
    fillReview('topHemline', /anarkali|flared/i.test(text) ? 'Flared' : /high[- ]low/i.test(text) ? 'High-Low' : 'Straight');
    fillReview('slitDetail', /anarkali/i.test(text) ? 'NA' : 'Side Slits');
    fillReview('neck', ok('neck', /v[- ]?neck/i.test(text) ? 'V-Neck' : /round neck/i.test(text) ? 'Round Neck' : /mandarin/i.test(text) ? 'Mandarin Collar'
      : /boat neck/i.test(text) ? 'Boat Neck' : /square neck/i.test(text) ? 'Square Neck' : /collar/i.test(text) ? 'Shirt Collar' : ''));
    fillReview('sleeveLength', /sleeveless/i.test(text) ? 'Sleeveless' : /full sleeve|long sleeve/i.test(text) ? 'Long Sleeves'
      : /3\/4|three[- ]quarter/i.test(text) ? 'Three-Quarter Sleeves' : /half sleeve|short sleeve/i.test(text) ? 'Short Sleeves' : '');
    fillReview('topPattern', /jamdani|woven/i.test(text) ? 'Woven Design' : /embroider/i.test(text) ? 'Embroidered' : /print/i.test(text) ? 'Printed' : /solid|plain/i.test(text) ? 'Solid' : '');
    fillReview('bottomPattern', /printed (pant|palazzo|bottom)/i.test(text) ? 'Printed' : 'Solid');
    fillReview('printType', /floral/i.test(text) ? 'Floral' : /paisley/i.test(text) ? 'Paisley' : /geometric/i.test(text) ? 'Geometric'
      : /bandhani|bandhej/i.test(text) ? 'Bandhani' : /leheriya/i.test(text) ? 'Leheriya' : /jamdani|woven/i.test(text) ? 'Woven Design'
      : /ethnic motif/i.test(text) ? 'Ethnic Motifs' : /solid|plain/i.test(text) ? 'Solid' : '');
    fillReview('bottomClosure', /drawstring/i.test(text) ? 'Drawstring' : /zip/i.test(text) ? 'Zip' : 'Drawstring');
    fillReview('waistband', /elastic/i.test(text) ? 'Elasticated' : /partially elastic/i.test(text) ? 'Partially Elasticated' : 'Elasticated');
    fillReview('weavePattern', /jamdani|jacquard/i.test(text) ? 'Jacquard' : /brocade/i.test(text) ? 'Brocade' : /dobby/i.test(text) ? 'Dobby' : /khadi/i.test(text) ? 'Khadi' : 'Regular');
    fillReview('weaveType', /handloom|jamdani/i.test(text) ? 'Handloom' : 'Machine Weave');
    fillReview('technique', /block print/i.test(text) ? 'Block Print' : /bandhani|bandhej/i.test(text) ? 'Bandhani' : /leheriya/i.test(text) ? 'Leheriya' : 'NA');
    fillReview('ornamentation', /mirror/i.test(text) ? 'Mirror Work' : /gotta/i.test(text) ? 'Gotta Patti' : /zari/i.test(text) ? 'Zari'
      : /sequin/i.test(text) ? 'Sequinned' : /chikankari/i.test(text) ? 'Chikankari' : /embroider|thread/i.test(text) ? 'Thread Work' : 'NA');
    fillReview('occasion', /festive|wedding|party|embroider/i.test(text) ? 'Festive' : 'Daily');
    fillReview('stitch', 'Ready to Wear');
    fillReview('addOns', 'NA');
    fillReview('numberOfPockets', 'NA');
    const items = hasDupatta ? '3' : '2';
    fillReview('numberOfItems', items);
    fillReview('netQuantity', items);
    const bottomWord = bottom === 'Trousers' ? 'Pant' : bottom === 'Palazzos' ? 'Palazzo' : bottom;
    fillReview('packageContains', `1 Kurta, 1 ${bottomWord}${hasDupatta ? ', 1 Dupatta' : ''}`);
  } else if (dress) {
    // Myntra "Dresses" sheet — mandatory = yellow header cells (template v13,
    // 2026-10-04). Values only from MYNTRA_DRESSES_VALUES; guesses review-flagged.
    const V = MYNTRA_DRESSES_VALUES;
    const pick = (field: string, v: string) => (V[field]?.includes(v) ? v : '');
    fillConfident('articleType', 'Dresses');
    // Prominent Colour is a dropdown: "Olive Green" → "Olive" (longest list
    // value contained in the colour name), else left for the admin/AI.
    if (patch.prominentColour && !V.prominentColour.includes(patch.prominentColour)) {
      const lc = patch.prominentColour.toLowerCase();
      // Longest match wins ("Sea Green" over "Green"); on a tie, the one named first ("Olive Green" → Olive).
      const match = V.prominentColour
        .filter((c) => c !== 'NA' && lc.includes(c.toLowerCase()))
        .sort((a, b) => b.length - a.length || lc.indexOf(a.toLowerCase()) - lc.indexOf(b.toLowerCase()))[0];
      if (match) patch.prominentColour = match; else { delete patch.prominentColour; block('prominentColour'); }
    }

    const raw = detectFabric(text); // e.g. "Viscose", "Cotton", "Rayon"
    const fabric = pick('fabric', /viscose|rayon/i.test(raw) ? 'Viscose Rayon' : /cotton/i.test(raw) ? 'Cotton' : raw);
    fillReview('fabric', fabric);
    // "Fabric Type" is the weave/material family; viscose isn't on its list.
    fillReview('fabricType', /cotton/i.test(raw) ? 'Cotton' : pick('fabricType', raw) || 'NA');
    fillReview('knitOrWoven', /knit|jersey|hosiery/i.test(text) ? 'Knitted' : 'Woven');
    // HSN 6204.4x = women's dresses, by fibre: 42 cotton, 43 synthetic, 44 artificial (viscose/rayon).
    // Best-effort by fabric — flagged; confirm with your CA.
    fillReview('hsnCode', /cotton/i.test(raw) ? '62044200' : /polyester|nylon|synthetic/i.test(raw) ? '62044300' : /viscose|rayon/i.test(raw) ? '62044400' : '');

    const washMatch = description.match(/\b(dry clean|hand wash|machine wash)/i);
    const washCare = washMatch ? washMatch[1].toLowerCase().split(' ').map(capitalizeFirst).join(' ') : 'Hand Wash';
    fillReview('washCare', washCare);
    if (fabric) fillReview('materialCareDescription', `100% ${fabric}, ${washCare}`); else block('materialCareDescription');

    fillReview('closure', /button|shirt dress|button[- ]down/i.test(text) ? 'Button' : /zip/i.test(text) ? 'Zip' : /tie[- ]up/i.test(text) ? 'Tie-Ups' : 'NA');
    fillReview('addOns', /belt/i.test(text) ? 'Comes with a belt' : 'NA');
    fillReview('lining', /lined|lining/i.test(text) ? 'Has a lining' : 'NA');
    fillReview('multipackSet', 'NA');
    fillReview('numberOfItems', '1');
    fillReview('netQuantity', '1');
    fillReview('packageContains', '1 Dress');

    const length = detectDressLength(text);
    fillReview('dressLength', length);
    fillReview('dressShape', /shirt dress/i.test(text) ? 'Shirt' : /wrap/i.test(text) ? 'Wrap' : /bodycon/i.test(text) ? 'Bodycon'
      : /a[- ]line/i.test(text) ? 'A-Line' : /fit and flare|fit & flare|smock|tiered/i.test(text) ? 'Fit and Flare' : '');
    fillReview('dressType', /tiered/i.test(text) ? 'Tiered' : /shirt dress/i.test(text) ? 'Shirt' : /wrap/i.test(text) ? 'Wrap' : '');
    fillReview('neck', /square neck/i.test(text) ? 'Square Neck' : /collar/i.test(text) ? 'Shirt Collar' : /v[- ]?neck/i.test(text) ? 'V-Neck'
      : /round neck/i.test(text) ? 'Round Neck' : /sweetheart/i.test(text) ? 'Sweetheart Neck' : '');
    fillReview('sleeveLength', /sleeveless/i.test(text) ? 'Sleeveless' : /full sleeve|long sleeve/i.test(text) ? 'Long Sleeves'
      : /3\/4|three[- ]quarter/i.test(text) ? 'Three-Quarter Sleeves' : /half sleeve|short sleeve|flutter|cap sleeve|puff sleeve/i.test(text) ? 'Short Sleeves' : '');
    fillReview('sleeveStyling', /sleeveless/i.test(text) ? 'No Sleeves' : /flutter/i.test(text) ? 'Flutter Sleeves' : /puff/i.test(text) ? 'Puff Sleeves'
      : /bell sleeve/i.test(text) ? 'Bell Sleeves' : 'Regular Sleeves');
    const pattern = /floral/i.test(text) ? 'Printed' : /stripe/i.test(text) ? 'Striped' : /check/i.test(text) ? 'Checked'
      : /embroider/i.test(text) ? 'Embroidered' : /print/i.test(text) ? 'Printed' : /solid|plain/i.test(text) ? 'Solid' : '';
    fillReview('topPattern', pattern);
    fillReview('printType', /floral/i.test(text) ? 'Floral' : /stripe/i.test(text) ? 'Striped' : /check/i.test(text) ? 'Checked' : pattern === 'Solid' ? 'Solid' : '');
    fillReview('occasion', /party/i.test(text) ? 'Party' : 'Casual');
  } else if (saree) {
    block('washCare');
    block('materialCareDescription');
    block('hsnCode');
    fillReview('articleType', 'Saree');
    fillReview('sareeFabric', detectFabric(text));
    fillReview('blouseIncluded', /blouse/i.test(text) ? 'Unstitched Blouse Piece' : 'No Blouse');
    fillReview('multipackSet', '1');
    fillReview('netQuantity', '1');

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
  productDetails: 'Product Details', styleNote: 'Style Note', tags: 'Tags', occasion: 'Occasion',
  neck: 'Neck', sleeveLength: 'Sleeve Length', topType: 'Top Type', bottomType: 'Bottom Type',
  topPattern: 'Top Pattern', bottomPattern: 'Bottom Pattern',
  fabric: 'Fabric', fabricType: 'Fabric Type', knitOrWoven: 'Knit or Woven', closure: 'Closure',
  dressShape: 'Shape', dressType: 'Type', dressLength: 'Length', sleeveStyling: 'Sleeve Styling',
  printType: 'Print or Pattern Type',
  dupatta: 'Dupatta', dupattaFabric: 'Dupatta Fabric', dupattaPattern: 'Dupatta Pattern', dupattaBorder: 'Dupatta Border',
  topHemline: 'Top Hemline', topLength: 'Top Length', topShape: 'Top Shape', slitDetail: 'Slit Detail',
  bottomClosure: 'Bottom Closure', waistband: 'Waistband', weavePattern: 'Weave Pattern', weaveType: 'Weave Type',
  patternCoverage: 'Pattern Coverage', technique: 'Technique', ornamentation: 'Ornamentation', stitch: 'Stitch',
};
