import { MYNTRA_CO_ORDS_VALUES, MYNTRA_DRESSES_VALUES, MYNTRA_KURTA_SETS_VALUES } from './myntraValues';

// "AI Fill" for the Myntra review panel (Co-Ords): Gemini reads the product's
// name, description and photos and drafts Myntra's text fields plus its
// dropdown attributes, using only values from Myntra's own template
// (myntraValues.ts). Kept separate from the Flipkart AI on purpose — Flipkart's
// flow must not change when Myntra's does. Free tier via GEMINI_API_KEY; the
// admin reviews everything before Save.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-lite-latest'];
const MAX_IMAGES = 3;
// Gemini rejects empty enum values — the model answers this instead, and it's dropped.
const UNKNOWN = 'Unknown';

export type MyntraAiSuggestion = Record<string, string>;

interface GeminiResponse {
  error?: { message?: string };
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
}

// Keys are MyntraFormState field names. `allowed` = Myntra's dropdown values.
const V = MYNTRA_CO_ORDS_VALUES;
const CO_ORDS_FIELDS: Record<string, { allowed?: string[]; hint: string }> = {
  styleName: { hint: 'short product name, e.g. "Black Embroidered Co-ord Set" (colour + key detail + Co-ord Set), max 60 characters' },
  productDetails: { hint: 'Myntra "Product Details": one paragraph (50-90 words) covering the top, the bottom, fabric and key selling points' },
  styleNote: { hint: 'one or two sentences on how to style or wear it' },
  tags: { hint: '8-12 distinct search terms Indian shoppers would type on Myntra, lowercase, comma-separated, each 2-5 words (colour, fabric, work, occasion, "co ord set for women" style phrases), no near-duplicates' },
  materialCareDescription: { hint: 'fabric and care, e.g. "Top fabric: Pure Cotton, Bottom fabric: Pure Cotton, Machine wash" — use the same fabrics as topFabric/bottomFabric, never "Unknown"' },
  colourRemarks: { hint: 'brand colour name as a shopper would say it, e.g. "Mustard Yellow"' },
  prominentColour: { allowed: V.prominentColour, hint: 'dominant colour' },
  occasion: { allowed: V.occasion, hint: 'occasion' },
  neck: { allowed: V.neck, hint: "the top's neckline" },
  sleeveLength: { allowed: V.sleeveLength, hint: "the top's sleeve length" },
  topType: { allowed: V.topType, hint: 'type of the top piece' },
  bottomType: { allowed: V.bottomType, hint: 'type of the bottom piece' },
  topPattern: { allowed: V.topPattern, hint: "the top's pattern" },
  bottomPattern: { allowed: V.bottomPattern, hint: "the bottom's pattern" },
  // Same rule as the Flipkart AI: most site descriptions never state fabric, and
  // Myntra rejects the sheet without it — so judge from the photos (admin verifies).
  topFabric: { allowed: V.topFabric, hint: 'top fabric as stated in the text (Pure Cotton for 100% cotton; crepe/georgette usually Polyester or Poly Georgette); if the text never says, judge the most likely fabric from the photos (drape, sheen, texture) — never Unknown' },
  bottomFabric: { allowed: V.bottomFabric, hint: 'bottom fabric as stated in the text; if the text never says, judge the most likely fabric from the photos — never Unknown' },
  washCare: { allowed: V.washCare, hint: 'wash care as stated; Hand Wash if not stated' },
  addOns: { allowed: V.addOns, hint: 'extra pieces beyond top + bottom; NA if none' },
  lining: { allowed: V.lining, hint: 'NA unless a lining is mentioned' },
  numberOfPockets: { allowed: V.numberOfPockets, hint: 'NA unless pockets are mentioned or visible' },
  numberOfItems: { allowed: V.numberOfItems, hint: 'pieces in the pack (top + bottom = 2)' },
  season: { allowed: V.season, hint: 'season it suits best' },
};

// Dresses ("Dresses" sheet) — dropdowns from Myntra's own masterdata.
const DV = MYNTRA_DRESSES_VALUES;
const DRESS_FIELDS: Record<string, { allowed?: string[]; hint: string }> = {
  styleName: { hint: 'short product name, e.g. "Maroon Tiered Midi Dress" (colour + key detail + Dress), max 40 characters' },
  productDetails: { hint: 'Myntra "Product Details": one paragraph (50-90 words) covering the dress, fabric and key selling points' },
  styleNote: { hint: 'one or two sentences on how to style or wear it' },
  tags: { hint: '8-12 distinct search terms Indian shoppers would type on Myntra, lowercase, comma-separated, each 2-5 words (colour, fabric, length, shape, "dress for women" style phrases), no near-duplicates' },
  materialCareDescription: { hint: 'fabric and care, e.g. "100% Viscose Rayon, Hand Wash" — same fabric as the fabric field, never "Unknown"' },
  colourRemarks: { hint: 'brand colour name as a shopper would say it, e.g. "Maroon"' },
  prominentColour: { allowed: DV.prominentColour, hint: 'dominant colour' },
  fabric: { allowed: DV.fabric, hint: 'main fabric as stated in the text (Viscose Rayon for viscose/rayon); if the text never says, judge from the photos — never Unknown' },
  fabricType: { allowed: DV.fabricType, hint: 'fabric family/weave if it is one of these (Cotton, Crepe, Georgette, Linen…); NA when none fits (e.g. plain viscose)' },
  knitOrWoven: { allowed: DV.knitOrWoven, hint: 'Woven for regular dress fabrics, Knitted for jersey/stretch knits' },
  closure: { allowed: DV.closure, hint: 'how it fastens (Button for shirt dresses, Zip, Tie-Ups); NA for pull-on dresses' },
  dressShape: { allowed: DV.dressShape, hint: 'silhouette as Myntra names it (e.g. Fit and Flare, A-Line, Shirt, Wrap, Bodycon)' },
  dressType: { allowed: DV.dressType, hint: 'dress type (e.g. Tiered, Shirt, Wrap, Fit and Flare)' },
  dressLength: { allowed: DV.dressLength, hint: 'where the hem ends on the model' },
  neck: { allowed: DV.neck, hint: 'neckline' },
  sleeveLength: { allowed: DV.sleeveLength, hint: 'sleeve length (flutter/cap sleeves are Short Sleeves)' },
  sleeveStyling: { allowed: DV.sleeveStyling, hint: 'sleeve style; Regular Sleeves if nothing special, No Sleeves if sleeveless' },
  topPattern: { allowed: DV.topPattern, hint: 'overall pattern; Solid if plain' },
  printType: { allowed: DV.printType, hint: 'print or pattern type; Solid if plain' },
  occasion: { allowed: DV.occasion, hint: 'occasion' },
  washCare: { allowed: DV.washCare, hint: 'wash care as stated; Hand Wash if not stated' },
  addOns: { allowed: DV.addOns, hint: 'Comes with a belt only if a separate belt is included; NA otherwise' },
  lining: { allowed: DV.lining, hint: 'NA unless a lining is mentioned' },
  season: { allowed: DV.season, hint: 'season it suits best' },
};

// Kurta Sets ("Kurta Sets" sheet, used for Suits) — dropdowns from Myntra's masterdata.
const KV = MYNTRA_KURTA_SETS_VALUES;
const KURTA_SET_FIELDS: Record<string, { allowed?: string[]; hint: string }> = {
  styleName: { hint: 'short product name, e.g. "Olive Jamdani Kurta Pant Set" (colour + key detail + Kurta Set), max 40 characters' },
  productDetails: { hint: 'Myntra "Product Details": one paragraph (50-90 words) covering the kurta, bottom, dupatta (if any), fabric and key selling points' },
  styleNote: { hint: 'one or two sentences on how to style or wear it' },
  tags: { hint: '8-12 distinct search terms Indian shoppers would type on Myntra, lowercase, comma-separated, each 2-5 words (colour, fabric, work, "kurta set with dupatta" style phrases), no near-duplicates' },
  materialCareDescription: { hint: 'fabric and care, e.g. "100% Cotton, Hand Wash" — never "Unknown"' },
  colourRemarks: { hint: 'brand colour name as a shopper would say it' },
  prominentColour: { allowed: KV.prominentColour, hint: 'dominant colour' },
  topType: { allowed: KV.topType, hint: 'Kurta for kurta sets' },
  bottomType: { allowed: KV.bottomType, hint: 'bottom piece (Trousers for straight pants, Palazzos, Salwar, Churidar, Sharara…)' },
  dupatta: { allowed: KV.dupatta, hint: 'With Dupatta only if a dupatta is included; NA otherwise' },
  topFabric: { allowed: KV.topFabric, hint: 'kurta fabric as stated (Pure Cotton for cotton/jamdani, Viscose Rayon for viscose/rayon); if unstated judge from photos — never Unknown' },
  bottomFabric: { allowed: KV.bottomFabric, hint: 'bottom fabric; usually the same as the kurta' },
  dupattaFabric: { allowed: KV.dupattaFabric, hint: 'dupatta fabric; NA when there is no dupatta' },
  dupattaPattern: { allowed: KV.dupattaPattern, hint: 'dupatta pattern; NA when there is no dupatta' },
  dupattaBorder: { allowed: KV.dupattaBorder, hint: 'dupatta border; NA when there is no dupatta' },
  topPattern: { allowed: KV.topPattern, hint: "kurta's pattern" },
  bottomPattern: { allowed: KV.bottomPattern, hint: "bottom's pattern; Solid if plain" },
  printType: { allowed: KV.printType, hint: 'main print or pattern type' },
  topShape: { allowed: KV.topShape, hint: 'kurta silhouette' },
  topLength: { allowed: KV.topLength, hint: 'where the kurta ends on the model' },
  topHemline: { allowed: KV.topHemline, hint: 'kurta hemline' },
  slitDetail: { allowed: KV.slitDetail, hint: 'kurta slits; NA if none' },
  neck: { allowed: KV.neck, hint: 'neckline' },
  sleeveLength: { allowed: KV.sleeveLength, hint: 'sleeve length' },
  sleeveStyling: { allowed: KV.sleeveStyling, hint: 'sleeve style; Regular Sleeves if nothing special' },
  bottomClosure: { allowed: KV.bottomClosure, hint: 'how the bottom fastens (Drawstring, Slip-On for elastic pull-on, Zip…)' },
  waistband: { allowed: KV.waistband, hint: 'Elasticated for elastic waists' },
  weavePattern: { allowed: KV.weavePattern, hint: 'Jacquard for jamdani/jacquard weaves, Regular for plain fabric' },
  weaveType: { allowed: KV.weaveType, hint: 'Handloom for jamdani/handwoven, Machine Weave otherwise' },
  ornamentation: { allowed: KV.ornamentation, hint: 'surface work (Thread Work for embroidery, Mirror Work, Gotta Patti…); NA if none' },
  technique: { allowed: KV.technique, hint: 'print/dye technique (Block Print, Bandhani…); NA if none' },
  occasion: { allowed: KV.occasion, hint: 'Festive for embroidered/festive sets, Daily for everyday cotton sets' },
  washCare: { allowed: KV.washCare, hint: 'wash care as stated; Hand Wash if not stated' },
  season: { allowed: KV.season, hint: 'season it suits best' },
};

const KURTA_SET_PROMPT = `You are writing a Myntra listing for an Indian women's fashion seller (brand: Darshan Style Hub). The product is a kurta set (kurta + bottom, sometimes with a dupatta).
Use only what the product name, description and photos actually show. Never invent work or items that aren't there (no dupatta unless one is included); for fabric, follow the fabric instructions.
No emojis, no HTML, no price or discount claims. For fields with an allowed list, pick from it, reading the photos when the text doesn't say; answer "${UNKNOWN}" if you genuinely can't tell.`;

const DRESS_PROMPT = `You are writing a Myntra listing for an Indian women's fashion seller (brand: Darshan Style Hub). The product is a western dress.
Use only what the product name, description and photos actually show. Never invent work or items that aren't there; for fabric, follow the fabric instructions.
No emojis, no HTML, no price or discount claims. For fields with an allowed list, pick from it, reading the photos when the text doesn't say; answer "${UNKNOWN}" if you genuinely can't tell.`;

const PROMPT = `You are writing a Myntra listing for an Indian women's fashion seller (brand: Darshan Style Hub). The product is a co-ord set (matching top + bottom).
Use only what the product name, description and photos actually show. Never invent work or items that aren't there; for fabric, follow the topFabric/bottomFabric instructions.
No emojis, no HTML, no price or discount claims. For fields with an allowed list, pick from it, reading the photos when the text doesn't say; answer "${UNKNOWN}" if you genuinely can't tell.`;

export function isMyntraAiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

async function imagePart(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const mimeType = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  if (!mimeType.startsWith('image/')) return null;
  const data = Buffer.from(await res.arrayBuffer()).toString('base64');
  return { inline_data: { mime_type: mimeType, data } };
}

export async function suggestMyntraCoOrdListing(input: {
  name: string;
  description: string;
  imageUrls: string[];
  category?: string;
}): Promise<MyntraAiSuggestion> {
  const isDress = input.category === 'Western Dress';
  const isKurtaSet = input.category === 'Suits';
  const FIELDS = isKurtaSet ? KURTA_SET_FIELDS : isDress ? DRESS_FIELDS : CO_ORDS_FIELDS;
  const prompt = isKurtaSet ? KURTA_SET_PROMPT : isDress ? DRESS_PROMPT : PROMPT;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env');

  const schema = {
    type: 'OBJECT',
    properties: Object.fromEntries(Object.entries(FIELDS).map(([field, spec]) => [
      field,
      spec.allowed
        ? { type: 'STRING', enum: [...spec.allowed, UNKNOWN], description: spec.hint }
        : { type: 'STRING', description: spec.hint },
    ])),
    required: Object.keys(FIELDS),
  };

  const images = (await Promise.all(input.imageUrls.slice(0, MAX_IMAGES).map(imagePart))).filter(Boolean);
  const body = JSON.stringify({
    contents: [{
      role: 'user',
      parts: [{ text: `${prompt}\n\nProduct name: ${input.name}\n\nProduct description:\n${input.description}` }, ...images],
    }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
  });

  // Free-tier models often return 503 "high demand", and Google retires models
  // for new keys — try the next model. A 429 (quota) applies to the whole key.
  let res: Response | undefined;
  let data: GeminiResponse = {};
  for (const model of Array.from(new Set([GEMINI_MODEL, ...FALLBACK_MODELS]))) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body,
    });
    data = await res.json().catch(() => ({}));
    // Free-tier quotas are per model (e.g. 20 requests/day on one model), so a
    // 429 just moves on to the next model; only stop once one succeeds.
    if (res.ok) break;
  }
  if (!res || !res.ok) {
    if (!res) throw new Error('Gemini request failed');
    const message = data?.error?.message || `HTTP ${res.status}`;
    if (res.status === 429) throw new Error(`Gemini free-tier limit reached on every model — the free daily quota resets in a few hours; you can still fill the fields by hand and Save. (${message})`);
    throw new Error(`Gemini request failed: ${message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
  if (!text) throw new Error(`Gemini returned no answer (finish reason: ${data?.candidates?.[0]?.finishReason ?? 'unknown'})`);
  const out = JSON.parse(text) as Record<string, unknown>;

  // Schema enums are enforced by Gemini, but never trust a value Myntra won't accept.
  const clean = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const suggestion: MyntraAiSuggestion = {};
  for (const [field, spec] of Object.entries(FIELDS)) {
    const value = out[field];
    if (typeof value !== 'string') continue;
    suggestion[field] = spec.allowed ? (spec.allowed.includes(value) ? value : '') : clean(value);
  }
  return suggestion;
}
