import fs from 'fs';
import { google, type sheets_v4 } from 'googleapis';

// The "parent" Google Sheet new products are entered in (same sheet the
// DarshanAutomation hang-tag app uses). Server-only, and local-only in
// practice: it reads the hang-tag service account key from this laptop.
export const PARENT_SPREADSHEET_ID = process.env.PARENT_SHEET_ID || '1Wm2xR7KBnNKcHScGXsv9v22Ew5UZI-LlHHIsfIrKvmU';
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
  || 'C:\\Users\\91973\\Documents\\MUKESHPERSONAL\\DarshanAutomation_Local\\hang-tag\\credentials\\service-account.json';

export const DEFAULT_SOURCE_TAB = 'Sheet2';

// Sheet's own category word → site category.
const CATEGORY_RULES: [RegExp, string][] = [
  [/summer/i, 'Summer Co-ord Sets'],
  [/co-?\s?ord/i, 'Co Ord Sets'],
  [/suit/i, 'Suits'],
  [/kurt/i, 'Kurtis'],
  [/western|dress|gown/i, 'Western Dress'],
  [/top/i, 'Tops'],
  [/saree|sari/i, 'Sarees'],
];
export function siteCategoryFor(sheetCategory: string): string {
  return CATEGORY_RULES.find(([re]) => re.test(sheetCategory))?.[1] || '';
}

// Site category → its tab in the parent sheet (existing tabs: Coordset, Kurti, Suit).
const CATEGORY_TABS: Record<string, string> = {
  'Co Ord Sets': 'Coordset',
  'Summer Co-ord Sets': 'Coordset',
  Suits: 'Suit',
  Kurtis: 'Kurti',
  'Western Dress': 'Western',
  Tops: 'Top',
  Sarees: 'Saree',
};
export function categoryTabFor(siteCategory: string): string {
  return CATEGORY_TABS[siteCategory] || siteCategory;
}

// Size columns the sheet may have ("3XL" and "XXXL" both mean the site's XXXL).
const SIZE_HEADERS: Record<string, string> = {
  xs: 'XS', s: 'S', m: 'M', l: 'L', xl: 'XL', xxl: 'XXL', '2xl': 'XXL', xxxl: 'XXXL', '3xl': 'XXXL', 'free size': 'Free Size',
};
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];

const norm = (h: unknown) => String(h ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * True only on the laptop that has the hang-tag Google key. (process.env.VERCEL
 * can't be used for this: the local .env was pulled from Vercel and has VERCEL=1.)
 */
export function isSheetAccessAvailable(): boolean {
  return fs.existsSync(SERVICE_ACCOUNT_PATH);
}

function client(): sheets_v4.Sheets {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error(`Google service account key not found at ${SERVICE_ACCOUNT_PATH} — this works only on the laptop with the hang-tag credentials.`);
  }
  const key = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// ---- text helpers ported from hang-tag/listing.js (same output as before) ----

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const titleCaseWords = (s: string) => (s || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/** "FABRIC - 100% VISCOSE   PATTERN - EMBROIDERED   COLOUR - BLACK" → { FABRIC: '100% VISCOSE', ... } */
export function parseFabricAttrs(text: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([A-Za-z][A-Za-z]*(?:\s[A-Za-z]+)*)\s*-\s*([\s\S]*?)(?=(?:\s{2,}[A-Za-z][A-Za-z]*(?:\s[A-Za-z]+)*\s*-)|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text || '')) !== null) attrs[m[1].trim().toUpperCase()] = m[2].trim();
  return attrs;
}

/** Site description: "Crafted from X, a Y pattern, a striking Z shade. Finished with …" + description + • bullets. */
export function buildSiteDescription(fabricText: string, rawDesc: string, bullets: string[]): string {
  const a = parseFabricAttrs(fabricText);
  const fabric = a.FABRIC ? titleCaseWords(a.FABRIC) : '';
  const pattern = a.PATTERN ? titleCaseWords(a.PATTERN) : '';
  const colour = a.COLOUR || a.COLOR ? titleCaseWords(a.COLOUR || a.COLOR) : '';
  // "SQUARE" / "FLUTTER" alone read oddly ("finished with a square and flutter").
  const neck = a.NECK ? titleCaseWords(/neck|collar/i.test(a.NECK) ? a.NECK : `${a.NECK} neck`) : '';
  const sleeve = a.SLEEVE ? titleCaseWords(/sleeve/i.test(a.SLEEVE) ? a.SLEEVE : `${a.SLEEVE} sleeves`) : '';

  const specBits: string[] = [];
  if (fabric) specBits.push(`crafted from ${fabric}`);
  if (pattern) specBits.push(`a ${pattern.toLowerCase()} pattern`);
  if (colour) specBits.push(`a striking ${colour.toLowerCase()} shade`);
  const specSentence = specBits.length ? capitalize(specBits.join(', ')) + '.' : '';
  const detailBits = [neck, sleeve].filter(Boolean).map((x) => x.toLowerCase());
  const detailSentence = detailBits.length ? `Finished with a ${detailBits.join(' and ')}.` : '';

  const body = [specSentence, detailSentence, (rawDesc || '').trim()].filter(Boolean).join(' ');
  return [body, ...bullets.map((b) => `• ${b}`)].join('\n');
}

const TYPE_RULES: [RegExp, string][] = [
  [/\bkurta\b[\s\S]*\b(pant|palazzo|trouser)s?\b|\b(pant|palazzo|trouser)s?\b[\s\S]*\bkurta\b/i, 'Kurta Pant Set'],
  [/\bco-?ord\b/i, 'Co-ord Set'], [/\bkurti\b/i, 'Kurti'], [/\bkurta\b/i, 'Kurta'], [/\bsaree\b/i, 'Saree'],
  [/\bgown\b/i, 'Gown'], [/\bjumpsuit\b/i, 'Jumpsuit'], [/\bdress\b/i, 'Dress'], [/\bshirt\b/i, 'Shirt'],
  [/\btunic\b/i, 'Tunic'], [/\btop\b/i, 'Top'], [/\bskirt\b/i, 'Skirt'],
];

/** Rule-based title in the house style — fallback when the AI isn't available. */
export function composeTitle(fabricText: string, bullets: string[], description: string): string {
  const a = parseFabricAttrs(fabricText);
  const hay = `${fabricText} ${bullets.join(' ')} ${description}`;
  const colour = a.COLOUR || a.COLOR ? titleCaseWords(a.COLOUR || a.COLOR) : '';
  const pattern = a.PATTERN ? titleCaseWords(a.PATTERN) : '';
  const type = TYPE_RULES.find(([re]) => re.test(hay))?.[1] || '';
  const features = [a.NECK, a.SLEEVE].filter(Boolean).map((x) => titleCaseWords(x!));
  const partA = [colour, pattern, type].filter(Boolean).join(' ');
  const partB = features.length ? `${type ? type.split(' ')[0] : ''} with ${features.join(' & ')}`.trim() : '';
  return [partA, partB].filter(Boolean).join(' | ').slice(0, 200);
}

// ---- reading / writing the sheet ----

export interface SheetProductRow {
  tab: string;
  rowNumber: number; // 1-based row in the sheet
  sNo: string;
  sku: string;
  sheetCategory: string;
  siteCategory: string;
  realPrice: number;
  sellingPrice: number;
  fabricSpec: string;
  attrs: Record<string, string>;
  rawDescription: string;
  bullets: string[];
  itemName: string;
  sizes: { size: string; quantity: number }[];
  siteDescription: string;
  sizeConverted: string;
  addedToSite: string;
}

async function readTab(sheets: sheets_v4.Sheets, tab: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: PARENT_SPREADSHEET_ID,
    range: `'${tab}'!A1:ZZ`,
  });
  const rows = (res.data.values || []) as string[][];
  return { headers: rows[0] || [], rows };
}

export async function readSheetRow(tab: string, sNo: string): Promise<SheetProductRow> {
  const sheets = client();
  const { headers, rows } = await readTab(sheets, tab);
  const col = (name: string) => headers.findIndex((h) => norm(h) === name);
  const sNoCol = col('s.no') >= 0 ? col('s.no') : col('s. no');
  if (sNoCol < 0) throw new Error(`No "S.NO" column in tab "${tab}"`);

  const idx = rows.findIndex((r, i) => i > 0 && String(r[sNoCol] ?? '').trim() === String(sNo).trim());
  if (idx < 0) throw new Error(`S.No ${sNo} not found in tab "${tab}"`);
  const r = rows[idx];
  const get = (name: string) => {
    const c = col(name);
    return c >= 0 ? String(r[c] ?? '').trim() : '';
  };

  const sizes: { size: string; quantity: number }[] = [];
  headers.forEach((h, c) => {
    const size = SIZE_HEADERS[norm(h)];
    const qty = Number(String(r[c] ?? '').trim());
    if (size && String(r[c] ?? '').trim() !== '' && Number.isFinite(qty) && qty > 0) sizes.push({ size, quantity: qty });
  });
  // Or one "Size" cell listing them: "S- 10\nL-10\nM-10\nXL-10\n2XL-10" (any order,
  // newline/comma separated, "-" or ":" between size and quantity).
  for (const part of get('size').split(/[\n,;]+/)) {
    const m = part.trim().match(/^([a-z0-9 ]+?)\s*[-:=]\s*(\d+)$/i);
    const size = m && SIZE_HEADERS[norm(m[1])];
    const qty = m ? Number(m[2]) : 0;
    if (size && qty > 0 && !sizes.some((s) => s.size === size)) sizes.push({ size, quantity: qty });
  }
  sizes.sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));

  const fabricSpec = get('fabric');
  const rawDescription = get('description');
  // Cells pasted from elsewhere sometimes keep wrapping quotes / bullet marks.
  const bullets = get('bullet point').split('\n')
    .map((b) => b.trim().replace(/^["“”'•\-*\s]+|["“”'\s]+$/g, '').trim())
    .filter(Boolean);
  const sheetCategory = get('category');
  const price = (name: string) => Number(get(name).replace(/[^\d.]/g, '')) || 0;

  return {
    tab,
    rowNumber: idx + 1,
    sNo: String(sNo),
    sku: get('sku'),
    sheetCategory,
    siteCategory: siteCategoryFor(sheetCategory),
    realPrice: price('real price'),
    sellingPrice: price('selling price'),
    fabricSpec,
    attrs: parseFabricAttrs(fabricSpec),
    rawDescription,
    bullets,
    itemName: get('item name'),
    sizes,
    siteDescription: buildSiteDescription(fabricSpec, rawDescription, bullets),
    sizeConverted: get('size converted'),
    addedToSite: get('added to darshan site'),
  };
}

const colLetter = (i: number) => {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

/** Writes values into the product's row by header name; adds any missing header at the end. */
export async function updateSheetRow(tab: string, rowNumber: number, values: Record<string, string>) {
  const sheets = client();
  const { headers } = await readTab(sheets, tab);
  const data: sheets_v4.Schema$ValueRange[] = [];
  const allHeaders = [...headers];
  for (const [name, value] of Object.entries(values)) {
    let c = allHeaders.findIndex((h) => norm(h) === norm(name));
    if (c < 0) {
      c = allHeaders.length;
      allHeaders.push(name);
      data.push({ range: `'${tab}'!${colLetter(c)}1`, values: [[name]] });
    }
    data.push({ range: `'${tab}'!${colLetter(c)}${rowNumber}`, values: [[value]] });
  }
  if (data.length === 0) return;
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: PARENT_SPREADSHEET_ID,
    requestBody: { valueInputOption: 'RAW', data },
  });
}

const CATEGORY_TAB_HEADERS = ['SKU', 'Fabric', 'Title', 'Real price', 'Selling price', 'Bullet points', 'Description', 'Image files', ...SIZE_ORDER];

/** Adds or updates the product's row (matched by SKU) in its category tab, creating the tab if needed. */
export async function upsertCategoryTab(siteCategory: string, record: {
  sku: string; fabric: string; title: string; realPrice: number; sellingPrice: number;
  bullets: string[]; description: string; imageFiles: string[]; sizes: { size: string; quantity: number }[];
}): Promise<{ tab: string; created: boolean; action: 'added' | 'updated' }> {
  const sheets = client();
  const tab = categoryTabFor(siteCategory);
  const meta = await sheets.spreadsheets.get({ spreadsheetId: PARENT_SPREADSHEET_ID });
  const exists = (meta.data.sheets || []).some((s) => s.properties?.title === tab);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: PARENT_SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] },
    });
  }

  const { headers, rows } = await readTab(sheets, tab);
  // Keep the tab's existing columns; add any of ours that are missing.
  const allHeaders = [...headers];
  for (const h of CATEGORY_TAB_HEADERS) if (!allHeaders.some((x) => norm(x) === norm(h))) allHeaders.push(h);
  if (allHeaders.length !== headers.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: PARENT_SPREADSHEET_ID,
      range: `'${tab}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [allHeaders] },
    });
  }

  const qty = Object.fromEntries(record.sizes.map((s) => [s.size, String(s.quantity)]));
  const byHeader: Record<string, string> = {
    sku: record.sku,
    fabric: record.fabric,
    title: record.title,
    'real price': String(record.realPrice || ''),
    'selling price': String(record.sellingPrice || ''),
    'bullet points': record.bullets.join('\n'),
    description: record.description,
    'image files': record.imageFiles.join(', '),
    ...Object.fromEntries(SIZE_ORDER.map((s) => [norm(s), qty[s] || ''])),
  };
  const skuCol = allHeaders.findIndex((h) => norm(h) === 'sku');
  const existingIdx = rows.findIndex((r, i) => i > 0 && String(r[skuCol] ?? '').trim().toLowerCase() === record.sku.toLowerCase());
  // Columns we don't manage keep whatever the row already had.
  const existing = existingIdx > 0 ? rows[existingIdx] : [];
  const rowValues = allHeaders.map((h, i) => (norm(h) in byHeader ? byHeader[norm(h)] : String(existing[i] ?? '')));
  const rowNumber = existingIdx > 0 ? existingIdx + 1 : Math.max(rows.length, 1) + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: PARENT_SPREADSHEET_ID,
    range: `'${tab}'!A${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [rowValues] },
  });
  return { tab, created: !exists, action: existingIdx > 0 ? 'updated' : 'added' };
}
