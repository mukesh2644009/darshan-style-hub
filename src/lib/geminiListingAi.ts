import { FLIPKART_COLOR_VALUES, FLIPKART_NECK_VALUES, FLIPKART_SLEEVE_VALUES, FLIPKART_TOP_VALUES, FLIPKART_CO_ORD_VALUES } from './flipkartAutofill';

// "AI Fill" for the Flipkart review panel: Gemini reads the product's name,
// description and photos and drafts the text fields autofill can't write well
// (Key Features, Search Keywords, Description) plus the attributes it often
// guesses wrong from text alone (colour, neck, sleeve, shape…). Uses Google's
// free API tier via GEMINI_API_KEY; the admin reviews everything before Save.

// Google's rolling alias for the newest Flash model (available on the free tier).
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-lite-latest'];
const MAX_IMAGES = 3;
// Gemini rejects empty enum values — the model answers this instead, and it's dropped.
const UNKNOWN = 'Unknown';

// Keys are FlipkartFormState field names, so the result patches the form directly.
export type ListingAiSuggestion = Record<string, string>;

interface GeminiResponse {
  error?: { message?: string };
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
}

// Per-category attributes the AI fills. `allowed` = Flipkart's fixed dropdown
// for that category's template; without it the value is free text.
type AttributeSpec = Record<string, { allowed?: string[]; hint: string }>;

const ETHNIC_ATTRIBUTES: AttributeSpec = {
  neck: { allowed: FLIPKART_NECK_VALUES, hint: 'neckline' },
  sleeveLength: { allowed: FLIPKART_SLEEVE_VALUES, hint: 'sleeve length' },
  shapeType: { hint: "the kurta's silhouette as Flipkart names it, e.g. Straight, A-line, Anarkali, Flared" },
};

// Co-ords ("apparel_set" template) — values from Flipkart's own dropdowns.
const C = FLIPKART_CO_ORD_VALUES;
const CO_ORD_ATTRIBUTES: AttributeSpec = {
  neck: { allowed: C.neck, hint: "the top's neckline" },
  sleeveLength: { allowed: C.sleeveLength, hint: "the top's sleeve length" },
  sleeveStyle: { allowed: C.sleeveStyle, hint: 'sleeve style; Regular Sleeves if nothing special, No Sleeves if sleeveless' },
  topType: { allowed: C.topType, hint: 'type of the top piece' },
  bottomType: { allowed: C.bottomType, hint: 'type of the bottom piece' },
  topPattern: { allowed: C.topPattern, hint: "the top's pattern" },
  bottomPattern: { allowed: C.bottomPattern, hint: "must be the SAME value as topPattern (Flipkart rejects mismatches) — the set's main pattern" },
  topFabric: { allowed: C.topFabric, hint: 'top fabric as stated in the text (Pure Cotton for 100% cotton); if the text never says, judge the most likely fabric from the photos (drape, sheen, texture) — never Unknown' },
  bottomFabric: { allowed: C.bottomFabric, hint: 'bottom fabric as stated in the text; if the text never says, judge the most likely fabric from the photos — never Unknown' },
  printType: { allowed: C.printType, hint: 'main print or surface design of the set' },
  addOns: { allowed: C.addOns, hint: 'extra piece beyond top + bottom; NA if none' },
  topLength: { allowed: C.topLength, hint: 'top length: Crop, Regular or Long' },
  bottomLength: { allowed: C.bottomLength, hint: 'where the bottom ends' },
  occasion: { allowed: C.occasion, hint: 'occasion' },
};

const TOP_ATTRIBUTES: AttributeSpec = {
  neck: { allowed: FLIPKART_TOP_VALUES.neck, hint: 'neckline' },
  sleeveLength: { allowed: FLIPKART_TOP_VALUES.sleeveLength, hint: 'sleeve length' },
  sleeveStyle: { allowed: FLIPKART_TOP_VALUES.sleeveStyle, hint: 'sleeve style; Regular Sleeves if nothing special' },
  shapeType: { allowed: FLIPKART_TOP_VALUES.styleType, hint: 'top style type; Regular Top if nothing special' },
  topPattern: { allowed: FLIPKART_TOP_VALUES.pattern, hint: 'main print/pattern' },
  fabricType: { allowed: FLIPKART_TOP_VALUES.fabric, hint: 'fabric as stated in the text (Pure Cotton for 100% cotton)' },
  fit: { allowed: FLIPKART_TOP_VALUES.fit, hint: 'fit' },
  suitableFor: { allowed: FLIPKART_TOP_VALUES.suitableFor, hint: 'Fusion Wear for kurti-style/ethnic-print tops, Western Wear otherwise' },
  topsLength: { allowed: FLIPKART_TOP_VALUES.topsLength, hint: 'where the top ends on the model' },
  occasion: { allowed: FLIPKART_TOP_VALUES.occasion, hint: 'occasion' },
};

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

function responseSchema(attributes: AttributeSpec) {
  const attributeProps = Object.fromEntries(
    Object.entries(attributes).map(([field, spec]) => [
      field,
      spec.allowed
        ? { type: 'STRING', enum: [...spec.allowed, UNKNOWN], description: spec.hint }
        : { type: 'STRING', description: spec.hint },
    ])
  );
  return {
    type: 'OBJECT',
    properties: {
      keyFeatures: { type: 'ARRAY', items: { type: 'STRING' }, description: '5-8 short factual selling points' },
      searchKeywords: { type: 'ARRAY', items: { type: 'STRING' }, description: 'exactly 5 buyer search phrases' },
      description: { type: 'STRING', description: 'plain-text product description, 60-120 words' },
      colour: { type: 'STRING', enum: FLIPKART_COLOR_VALUES },
      ...attributeProps,
    },
    required: ['keyFeatures', 'searchKeywords', 'description', 'colour', ...Object.keys(attributes)],
  };
}

const PROMPT = `You are writing a Flipkart listing for an Indian women's fashion seller (brand: Darshan Style Hub).
Use only what the product name, description and photos actually show. Never invent fabric, work, or items that aren't there (e.g. don't mention a dupatta unless one is included).

- keyFeatures: 5-8 short points a buyer cares about (fabric, print/work, fit, sleeve, neck, what's in the pack, occasion). No emojis, no HTML.
- searchKeywords: exactly 5 distinct phrases Indian shoppers would type on Flipkart, lowercase, each 2-5 words, no near-duplicates.
- description: plain text, 60-120 words, no emojis, no HTML, no price or discount claims.
- colour: the dominant colour from the allowed list; use Multicolor only if no single colour dominates.
- Every other field: pick from its allowed list, reading the photos when the text doesn't say. Answer "${UNKNOWN}" if you genuinely can't tell.`;

async function imagePart(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const mimeType = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  if (!mimeType.startsWith('image/')) return null;
  const data = Buffer.from(await res.arrayBuffer()).toString('base64');
  return { inline_data: { mime_type: mimeType, data } };
}

export async function suggestFlipkartListing(input: {
  name: string;
  description: string;
  category: string;
  imageUrls: string[];
}): Promise<ListingAiSuggestion> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env');

  const isCoOrd = input.category === 'Co Ord Sets' || input.category === 'Summer Co-ord Sets';
  const attributes = input.category === 'Tops' ? TOP_ATTRIBUTES : isCoOrd ? CO_ORD_ATTRIBUTES : ETHNIC_ATTRIBUTES;
  const images = (await Promise.all(input.imageUrls.slice(0, MAX_IMAGES).map(imagePart))).filter(Boolean);

  const body = JSON.stringify({
    contents: [{
      role: 'user',
      parts: [
        { text: `${PROMPT}\n\nCategory: ${input.category}\nProduct name: ${input.name}\n\nProduct description:\n${input.description}` },
        ...images,
      ],
    }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: responseSchema(attributes) },
  });

  // Free-tier models return 503 "high demand" fairly often, and Google retires
  // models for new keys — fall through to the next model instead of failing
  // the click. A 429 (quota) applies to the whole key, so stop there.
  let res: Response | undefined;
  let data: GeminiResponse = {};
  for (const model of Array.from(new Set([GEMINI_MODEL, ...FALLBACK_MODELS]))) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body,
    });
    data = await res.json().catch(() => ({}));
    if (res.ok || res.status === 429) break;
  }
  if (!res || !res.ok) {
    if (!res) throw new Error('Gemini request failed');
    const message = data?.error?.message || `HTTP ${res.status}`;
    if (res.status === 429) throw new Error(`Gemini free-tier limit reached — try again in a minute. (${message})`);
    throw new Error(`Gemini request failed: ${message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
  if (!text) throw new Error(`Gemini returned no answer (finish reason: ${data?.candidates?.[0]?.finishReason ?? 'unknown'})`);
  const out = JSON.parse(text);

  // Schema enums are enforced by Gemini, but never trust a value we can't use.
  const clean = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/::/g, ' ').replace(/\s+/g, ' ').trim();
  const pick = (value: unknown, allowed?: string[]) => {
    if (typeof value !== 'string') return '';
    return allowed ? (allowed.includes(value) ? value : '') : clean(value);
  };

  const suggestion: ListingAiSuggestion = {
    productDetails: (out.keyFeatures as string[]).map(clean).filter(Boolean).join(' | '),
    searchKeywords: (out.searchKeywords as string[]).map(clean).filter(Boolean).slice(0, 5).join('::'),
    styleNote: clean(String(out.description ?? '')),
    colour: pick(out.colour, FLIPKART_COLOR_VALUES),
  };
  for (const [field, spec] of Object.entries(attributes)) {
    suggestion[field] = pick(out[field], spec.allowed);
  }
  return suggestion;
}
