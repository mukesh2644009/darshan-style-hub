import { MYNTRA_CO_ORDS_VALUES } from './myntraValues';

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
}): Promise<MyntraAiSuggestion> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env');

  const schema = {
    type: 'OBJECT',
    properties: Object.fromEntries(Object.entries(CO_ORDS_FIELDS).map(([field, spec]) => [
      field,
      spec.allowed
        ? { type: 'STRING', enum: [...spec.allowed, UNKNOWN], description: spec.hint }
        : { type: 'STRING', description: spec.hint },
    ])),
    required: Object.keys(CO_ORDS_FIELDS),
  };

  const images = (await Promise.all(input.imageUrls.slice(0, MAX_IMAGES).map(imagePart))).filter(Boolean);
  const body = JSON.stringify({
    contents: [{
      role: 'user',
      parts: [{ text: `${PROMPT}\n\nProduct name: ${input.name}\n\nProduct description:\n${input.description}` }, ...images],
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
  const out = JSON.parse(text) as Record<string, unknown>;

  // Schema enums are enforced by Gemini, but never trust a value Myntra won't accept.
  const clean = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const suggestion: MyntraAiSuggestion = {};
  for (const [field, spec] of Object.entries(CO_ORDS_FIELDS)) {
    const value = out[field];
    if (typeof value !== 'string') continue;
    suggestion[field] = spec.allowed ? (spec.allowed.includes(value) ? value : '') : clean(value);
  }
  return suggestion;
}
