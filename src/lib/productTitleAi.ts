// "AI Item Name" for the Add Product → Load from Sheet flow: Gemini (free tier,
// GEMINI_API_KEY) writes the product name in the same style as the shop's
// existing names. Text only — the product isn't saved yet, so no photos.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-lite-latest'];

interface GeminiResponse {
  error?: { message?: string };
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export async function suggestProductTitle(input: {
  category: string;
  fabricSpec: string;
  description: string;
  bullets: string[];
  examples: string[];
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env');

  const prompt = `Write the product name for an Indian women's fashion listing (brand: Darshan Style Hub, category: ${input.category}).
Match the style of these existing names from the same shop exactly — same order of parts and the " | " separator:
${input.examples.map((e) => `- ${e}`).join('\n') || '- Black Embroidered Co-ord Set | Co-ord with Round Neck With Tie Up & Tie-Up Sleeves'}

Rules: colour + work/pattern + product type first, then " | " and the key fit/neck/sleeve details. 60-120 characters.
Use only facts from the details below; correct obvious spelling mistakes (e.g. "Embrodireed" → "Embroidered"). No brand name, no emojis, no price.
Answer with the name only.

Spec: ${input.fabricSpec}
Description: ${input.description}
Key features:
${input.bullets.map((b) => `- ${b}`).join('\n')}`;

  const body = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
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
  if (!res || !res.ok) throw new Error(`Gemini request failed: ${data?.error?.message || `HTTP ${res?.status}`}`);

  const text = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text || '';
  return text.split('\n')[0].replace(/^["'*\s-]+|["'*\s]+$/g, '').replace(/<[^>]+>/g, '').slice(0, 200);
}
