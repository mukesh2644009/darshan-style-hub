// Shared plain-text heuristics for marketplace listing auto-fill (Myntra,
// Flipkart, ...). Pure string logic, no DB/server imports — keep it that way
// so it can run both client-side and server-side.

export const KNOWN_COLORS = [
  'Off White', 'Olive Green', 'Mehendi Green', 'Navy Blue', 'Royal Blue', 'Teal Blue',
  'Hot Pink', 'Fuchsia Pink', 'Rust Coral', 'Golden', 'Rust', 'Maroon', 'Mauve', 'Mustard',
  'Indigo', 'Coral', 'Peach', 'Cream', 'Beige', 'Lavender', 'Magenta', 'Purple', 'Teal',
  'Olive', 'Green', 'Blue', 'Red', 'Pink', 'Orange', 'Yellow', 'White', 'Grey', 'Black', 'Brown',
];

export const FABRIC_KEYWORDS = [
  'Cotton', 'Viscose', 'Rayon', 'Georgette', 'Chiffon', 'Silk', 'Linen',
  'Crepe', 'Net', 'Satin', 'Polyester', 'Modal',
];

export function detectColorFromName(name: string): string {
  // Word-boundary matching, not substring — "Embroidered" contains "red" as a
  // substring and was matching the color "Red" for any embroidered product
  // with no other color earlier in KNOWN_COLORS (found via DSH_KP_01, a real
  // Grey & White product that got tagged "Red", 2026-09-24).
  for (const c of KNOWN_COLORS) {
    if (new RegExp(`\\b${c.replace(/\s+/g, '\\s+')}\\b`, 'i').test(name)) return c;
  }
  return '';
}

export function detectFabric(text: string): string {
  for (const f of FABRIC_KEYWORDS) {
    if (new RegExp(`\\b${f}\\b`, 'i').test(text)) return f;
  }
  return '';
}

export function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Bullet markers seen across this catalog's descriptions — not just "•".
// "✔" was found via DSH_KP_03 (2026-09-27), whose Key Features used checkmarks
// instead of bullets and got silently merged into the marketing paragraph.
const BULLET_CHARS = '•✔✓✅➤▪‣';

// Emoji/decorative section-header lines (e.g. "🌿 Product Description", "✨ Key
// Features", "📦 Package Contains") found via DSH_KP_03 — a different content
// template than the rest of the catalog. These are pure formatting noise for
// a marketplace listing, not real content, so they're stripped rather than
// left embedded in the middle of the description text.
const HEADER_LINE_RE = /^\s*[^\w\s]{0,3}\s*(product description|key features|package contains|features|highlights|specifications)\s*[^\w\s]{0,3}\s*$/i;

/**
 * Splits a product description into its lead paragraph and its bullet list,
 * matching the convention used across most of this catalog's descriptions (a
 * marketing paragraph, then bullet lines). Returns both trimmed, joining
 * bullets with " | " to match how marketplace sheets expect a single cell.
 */
export function splitDescriptionParagraphAndBullets(description: string): { paragraph: string; bullets: string } {
  const cleaned = description
    .split('\n')
    .filter((line) => !HEADER_LINE_RE.test(line))
    .join('\n');

  const bulletMatch = cleaned.match(new RegExp(`^([\\s\\S]*?)((?:^|\\n)\\s*[${BULLET_CHARS}][\\s\\S]*)$`));
  if (!bulletMatch) return { paragraph: cleaned.trim(), bullets: '' };

  const paragraph = bulletMatch[1].trim();
  const bullets = bulletMatch[2]
    .split(/\n/)
    .map((line) => line.replace(new RegExp(`^\\s*[${BULLET_CHARS}]\\s*`), '').trim())
    .filter(Boolean)
    .join(' | ');

  return { paragraph, bullets };
}
